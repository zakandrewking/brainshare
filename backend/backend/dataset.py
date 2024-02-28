from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from uuid import uuid4

from backend import auth, db, models


async def create_dataset(
    dataset_name: str,
    column_names: list[str],
    column_data_types: list[str],
    synced_file_id: int,
    session: AsyncSession,
    user_id: str,
) -> int:

    formatted_table_name = f"ds_{str(uuid4()).replace('-', '_')}"

    dataset_metadata = models.DatasetMetadata(
        user_id=user_id,
        name=dataset_name,
        table_name=formatted_table_name,
    )
    session.add(dataset_metadata)
    dataset_synced = models.SyncedFileDatasetMetadata(
        user_id=user_id,
        synced_file_id=synced_file_id,
        dataset_metadata=dataset_metadata,
    )
    session.add(dataset_synced)

    # create the dataset table

    columns = ",\n".join(
        f'"{name}" {data_type}' for name, data_type in zip(column_names, column_data_types)
    )
    async with db.as_admin(session, user_id):
        await session.execute(text(f"create table data.{formatted_table_name} ({columns});"))
        await session.execute(
            text(f"alter table data.{formatted_table_name} enable row level security;")
        )
        await session.execute(
            text(
                f"""
create policy {formatted_table_name}_policy on data.{formatted_table_name}
    for all using (auth.uid() = '{user_id}'::uuid);"""
            )
        )

    await session.commit()

    # start the first sync

    # LEFT OFF

    if not dataset_metadata.id:
        raise Exception("Failed to create dataset")

    return dataset_metadata.id
