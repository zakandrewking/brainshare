from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from backend import db, models


def get_data_schema(user_id: str) -> str:
    return f"data_{user_id.replace('-', '_')}"


def get_data_role(user_id: str) -> str:
    return f"data_role_{user_id.replace('-', '_')}"


async def _get_db_schemas(session: AsyncSession) -> str:
    """Needs to be run as admin"""
    # get value of db_schemas for the authenticator role
    result = await session.execute(
        text("select usename, useconfig from pg_shadow where usename = 'authenticator'")
    )
    res = result.one_or_none()
    existing_schemas = ""
    if res and len(res) == 2:
        configs = res[1]
        for config in configs:
            if config.startswith("pgrst.db_schemas="):
                existing_schemas = config.split("=")[1]
                break

    return existing_schemas


async def _get_or_create_schema(user_id: str, session: AsyncSession) -> str:
    """Needs to be run as admin"""
    data_schema = get_data_schema(user_id)

    # check if the schema exists
    result = await session.execute(
        text(
            "select schema_name from information_schema.schemata where schema_name = :schema_name"
        ),
        {"schema_name": data_schema},
    )
    if result.one_or_none() is not None:
        print(f"schema {data_schema} exists")
        return data_schema

    existing_schemas = await _get_db_schemas(session)

    print(f"creating schema {data_schema}")
    data_role = get_data_role(user_id)
    assign_roles = f"{data_role}, service_role;"
    superuser = "postgres"
    # https://supabase.com/docs/guides/api/using-custom-schemas
    commands = [
        f"create schema {data_schema}",
        f"create role {data_role}",
        f"grant {data_role} to postgres, authenticator",
        f"grant usage, create on schema {data_schema} to {assign_roles}",
        f"grant all on all tables in schema {data_schema} to {assign_roles}",
        f"grant all on all routines in schema {data_schema} to {assign_roles}",
        f"grant all on all sequences in schema {data_schema} to {assign_roles}",
        f"alter default privileges for role {superuser} in schema {data_schema} grant all on tables to {assign_roles}",
        f"alter default privileges for role {superuser} in schema {data_schema} grant all on routines to {assign_roles}",
        f"alter default privileges for role {superuser} in schema {data_schema} grant all on sequences to {assign_roles}",
        f"alter role authenticator set pgrst.db_schemas = '{existing_schemas},{data_schema}'",
        f"notify pgrst, 'reload config'",
    ]
    for command in commands:
        print(command)
        await session.execute(text(command))
    return data_schema


async def create_dataset(
    dataset_name: str,
    column_names: list[str],
    column_data_types: list[str],
    synced_file_id: int,
    session: AsyncSession,
    user_id: str,
) -> tuple[models.DatasetMetadata, models.SyncedFileDatasetMetadata]:

    # create the schema if needed. Won't be rolled back on error.
    async with db.as_admin(session, user_id):
        schema_name = await _get_or_create_schema(user_id, session)
    await session.commit()

    # remove any non-alphanumeric characters from the dataset name and make it lowercase
    formatted_table_name = "".join(c for c in dataset_name if c.isalnum()).lower()

    # if it's too short, throw an error
    if len(formatted_table_name) < 3:
        raise Exception("Dataset name is too short")

    dataset_metadata = models.DatasetMetadata(
        user_id=user_id,
        name=dataset_name,
        table_name=formatted_table_name,
        schema_name=schema_name,
    )
    session.add(dataset_metadata)
    synced_file_dataset_metadata = models.SyncedFileDatasetMetadata(
        user_id=user_id,
        synced_file_id=synced_file_id,
        dataset_metadata=dataset_metadata,
    )
    session.add(synced_file_dataset_metadata)

    # create the dataset table

    columns = ", ".join(
        f'"{name}" {data_type}' for name, data_type in zip(column_names, column_data_types)
    )
    data_role = get_data_role(user_id)
    commands = [
        # run as data user so that user owns the table
        f"set role {data_role}",
        # create
        f'create table "{schema_name}"."{formatted_table_name}" ({columns});',
        #
        # TODO do we need RLS? maybe not if we're restricting access by postgres role
        # f"alter table {schema_name}.{formatted_table_name} enable row level security;",
        # f"""create policy {schema_name}_{formatted_table_name}_policy on {schema_name}.{formatted_table_name}
        #     for all using (auth.uid() = '{user_id}'::uuid);""",
        #
        # go back to user role (need to go to admin first for permission)
        f"reset role",
        f"call auth.login_as_user('{user_id}')",
    ]
    for command in commands:
        await session.execute(text(command))

    await session.commit()

    if not dataset_metadata.id:
        raise Exception("Failed to create dataset")

    return dataset_metadata, synced_file_dataset_metadata


async def delete_dataset(dataset_metadata_id: int, session: AsyncSession, user_id: str) -> None:
    dataset_metadata = await session.get(models.DatasetMetadata, dataset_metadata_id)
    if not dataset_metadata:
        raise Exception("Dataset not found")

    schema_name = dataset_metadata.schema_name
    table_name = dataset_metadata.table_name
    data_role = get_data_role(user_id)
    commands = [
        # log in as data user
        f"set role {data_role}",
        # drop table
        f'drop table "{schema_name}"."{table_name}"',
        # go back to user role (need to go to admin first for permission)
        f"reset role",
        f"call auth.login_as_user('{user_id}')",
        # drop metadata. Use SQL because the autogenerated models aren't configured
        # to cascade delete
        f"delete from dataset_metadata cascade where id = {dataset_metadata_id}",
    ]
    for command in commands:
        await session.execute(text(command))

    await session.commit()


async def get_dataset_columns(
    dataset_metadata_id: int, session: AsyncSession, user_id: str
) -> list[str]:
    dataset = await session.get(models.DatasetMetadata, dataset_metadata_id)
    if not dataset:
        raise ValueError(f"Dataset {dataset_metadata_id} not found")

    # log in as data user
    data_role = get_data_role(user_id)
    await session.execute(text(f"set role {data_role}"))

    # get the columns
    columns_command = f"""select column_name from information_schema.columns where table_schema = '{dataset.schema_name}' and table_name = '{dataset.table_name}'"""
    columns = list((await session.execute(text(columns_command))).scalars())

    # go back to user role (need to go to admin first for permission)
    commands = [
        f"reset role",
        f"call auth.login_as_user('{user_id}')",
    ]
    for command in commands:
        await session.execute(text(command))

    await session.commit()

    return columns


async def delete_schema(user_id: str, session: AsyncSession):
    data_schema = get_data_schema(user_id)
    data_role = get_data_role(user_id)
    print(f"deleting schema {data_schema} and role {data_role}")
    async with db.as_admin(session, user_id):
        existing_schemas = await _get_db_schemas(session)
        new_schema_list = ",".join(x for x in existing_schemas.split(",") if x != data_schema)
        commands = [
            f"drop schema {data_schema} cascade",
            f"drop role {data_role}",
            f"alter role authenticator set pgrst.db_schemas = '{new_schema_list}'",
            f"notify pgrst, 'reload config'",
        ]
        for command in commands:
            await session.execute(text(command))
    await session.commit()
