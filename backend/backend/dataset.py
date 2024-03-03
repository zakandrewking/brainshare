from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from uuid import uuid4

from backend import auth, db, models


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
    schema_name = f"data_{user_id.replace('-', '_')}"
    # check if the schema exists
    result = await session.execute(
        text(
            "select schema_name from information_schema.schemata where schema_name = :schema_name"
        ),
        {"schema_name": schema_name},
    )
    if result.one_or_none() is not None:
        print(f"schema {schema_name} exists")
        return schema_name

    existing_schemas = await _get_db_schemas(session)

    print(f"creating schema {schema_name}")
    role_name = f"data_role_{user_id.replace('-', '_')}"
    assign_roles = f"{role_name}, service_role;"
    superuser = "postgres"
    # https://supabase.com/docs/guides/api/using-custom-schemas
    commands = [
        f"create schema {schema_name}",
        f"create role {role_name}",
        f"grant {role_name} to postgres",
        f"grant usage on schema {schema_name} to {assign_roles}",
        f"grant all on all tables in schema {schema_name} to {assign_roles}",
        f"grant all on all routines in schema {schema_name} to {assign_roles}",
        f"grant all on all sequences in schema {schema_name} to {assign_roles}",
        f"alter default privileges for role {superuser} in schema {schema_name} grant all on tables to {assign_roles}",
        f"alter default privileges for role {superuser} in schema {schema_name} grant all on routines to {assign_roles}",
        f"alter default privileges for role {superuser} in schema {schema_name} grant all on sequences to {assign_roles}",
        f"alter role authenticator set pgrst.db_schemas = '{existing_schemas},{schema_name}'",
        f"notify pgrst, 'reload config'",
    ]
    for command in commands:
        print(command)
        await session.execute(text(command))
    return schema_name


async def create_dataset(
    dataset_name: str,
    column_names: list[str],
    column_data_types: list[str],
    synced_file_id: int,
    session: AsyncSession,
    user_id: str,
) -> int:

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
    dataset_synced = models.SyncedFileDatasetMetadata(
        user_id=user_id,
        synced_file_id=synced_file_id,
        dataset_metadata=dataset_metadata,
    )
    session.add(dataset_synced)

    # create the dataset table

    columns = ", ".join(
        f'"{name}" {data_type}' for name, data_type in zip(column_names, column_data_types)
    )
    commands = [
        f'create table "{schema_name}"."{formatted_table_name}" ({columns});',
        # TODO do we need RLS? maybe not if we're restricting access by postgres role
        # f"alter table {schema_name}.{formatted_table_name} enable row level security;",
        # f"""create policy {schema_name}_{formatted_table_name}_policy on {schema_name}.{formatted_table_name}
        #     for all using (auth.uid() = '{user_id}'::uuid);""",
    ]
    async with db.as_admin(session, user_id):
        for command in commands:
            await session.execute(text(command))

    await session.commit()

    # start the first sync

    # LEFT OFF

    if not dataset_metadata.id:
        raise Exception("Failed to create dataset")

    return dataset_metadata.id


async def delete_schema(user_id: str, session: AsyncSession):
    schema_name = f"data_{user_id.replace('-', '_')}"
    role_name = f"data_role_{user_id.replace('-', '_')}"
    print(f"deleting schema {schema_name} and role {role_name}")
    async with db.as_admin(session, user_id):
        existing_schemas = await _get_db_schemas(session)
        new_schema_list = ",".join(x for x in existing_schemas.split(",") if x != schema_name)
        commands = [
            f"drop schema {schema_name} cascade",
            f"drop role {role_name}",
            f"alter role authenticator set pgrst.db_schemas = '{new_schema_list}'",
            f"notify pgrst, 'reload config'",
        ]
        for command in commands:
            await session.execute(text(command))
    await session.commit()
