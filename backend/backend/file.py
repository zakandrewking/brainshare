"""
Design Spec: Use this for:
- Async business logic with SQL queries
- Google Drive Python API
"""

from datetime import datetime
import io
from typing import Final, Any
from traceback import print_exception

from googleapiclient.http import MediaIoBaseDownload  # type: ignore
from google.oauth2.credentials import Credentials  # type: ignore
from googleapiclient.discovery import build  # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, select, not_
from sqlalchemy.orm import selectinload
import pypdfium2 as pdfium  # type: ignore

from backend import ai, db, models, schemas


# -----
# Utils
# -----


async def get_google_service(session: AsyncSession, user_id: str) -> Any:
    # oauth2 connection is not exposed in the api
    async with db.as_admin(session, user_id):
        print("getting oauth details")
        access_token = (
            (
                await session.execute(
                    select(models.Oauth2Connection).where(
                        and_(
                            models.Oauth2Connection.user_id == user_id,
                            models.Oauth2Connection.name == "google",
                        )
                    )
                )
            )
            .scalar_one()
            .access_token
        )
        print("retrieved access token")

    # create google client
    creds = Credentials(
        token=access_token,
        scopes=["https://www.googleapis.com/auth/drive"],
    )
    if not creds or not creds.valid:
        raise Exception("Invalid credentials")
    # TODO if we need to refresh, then call the edge function to refresh
    service = build("drive", "v3", credentials=creds)

    return service


# ----------------------
# Sync files to datasets
# ----------------------


async def sync_file_to_dataset(synced_file_id: int, dataset_metadata_id: int, user_id: str):
    """Sync the contents of a file to a dataset."""

    async with db.get_session_for_user(user_id) as session:
        file = await session.get(models.SyncedFile, synced_file_id)
        file = (
            await session.scalars(
                select(models.SyncedFile)
                .where(models.SyncedFile.id == synced_file_id)
                .options(selectinload(models.SyncedFile.file_data))
            )
        ).one()
        if not file:
            raise Exception(f"SyncedFile with id {synced_file_id} not found")
        file_data = file.file_data[0] if len(file.file_data) > 0 else None

        service = await get_google_service(session, user_id)

        print("processing file")

        # mark as processing (process_file will mark as done)
        # file.processing_status = "processing"
        await session.commit()

        await process_file(file, file_data, session, service)
    print("done")


# ------------------------------
# Sync folders from Google Drive
# ------------------------------


async def sync_folder(
    synced_folder_id: int,
    synced_file_folder_id: int | None,
    user_id: str,
    recursive: bool = True,
) -> None:
    """Update one folder within a synced folder, optionally recursive.

    synced_file_folder_id is the id of the SyncedFile that is this folder.

    If synced_file_folder_id is None, then this is the root folder.

    Running on a subfolder will sync that subfolder, and, if recursive,
    everything below on the tree. We track sync progress on the folder itself,
    and only one sync is possible at a time on a SyncedFolder.

    """
    print(f"Updating synced folder {synced_folder_id}")

    if synced_file_folder_id:
        print(f"Updating synced file folder {synced_file_folder_id}")
    else:
        print(f"Updating root folder")

    async with db.get_session_for_user(user_id) as session:
        synced_folder = (
            await session.execute(
                (
                    select(models.SyncedFolder)
                    .filter(models.SyncedFolder.id == synced_folder_id)
                    .options(selectinload(models.SyncedFolder.sync_folder_task_link))
                )
            )
        ).scalar_one()
        if not synced_folder:
            raise Exception(f"synced folder {synced_folder_id} not found")

        print(f"synced folder has remote_id {synced_folder.remote_id}")

        service = await get_google_service(session, user_id)

        sync_options = (
            await session.execute(
                select(models.SyncOptions)
                .filter(models.SyncOptions.source == "google_drive")
                .filter(models.SyncOptions.project_id == None)
            )
        ).scalar_one_or_none()

        await _update_synced_folder_with_session(
            session,
            synced_folder,
            synced_file_folder_id,
            sync_options.auto_sync_extensions if sync_options else [],
            user_id,
            service,
            recursive=recursive,
        )

        # Job succeeded so we drop the link connection and update the task link.
        synced_folder.sync_folder_task_link.task_finished_at = datetime.now()
        synced_folder.sync_folder_task_link_id = None
        await session.commit()

        print(
            f"done with synced folder {synced_folder_id} and synced file folder {synced_file_folder_id}"
        )


async def _update_synced_folder_with_session(
    session: AsyncSession,
    synced_folder: models.SyncedFolder,
    synced_file_folder_id: int | None,
    auto_sync_extensions: list[str],
    user_id: str,
    service: Any,
    recursive: bool = False,
) -> None:
    if recursive:
        print(f"Recursively updating synced folder {synced_folder.id}")
        if synced_file_folder_id:
            print(f"Recursively updating synced file folder {synced_file_folder_id}")
        else:
            print(f"Recursively updating root folder")

    synced_file_folder = None
    if synced_file_folder_id:
        synced_file_folder = await session.get(models.SyncedFile, synced_file_folder_id)
        if synced_file_folder:
            print(f"child folder has remote_id {synced_file_folder.remote_id}")

    # use google_service to find remote files
    remote_id_to_search = (
        synced_file_folder.remote_id if synced_file_folder else synced_folder.remote_id
    )
    google_files = (
        service.files()
        .list(
            q=f"('{remote_id_to_search}' in parents) and trashed=false",
            fields="files(id, name, parents, size, mimeType)",
            # TODO paginate later
            pageSize=100,
        )
        .execute()
    )["files"]
    print(f"got {len(google_files)} google drive files")

    # get synced files
    synced_files = (
        await session.scalars(
            (
                select(models.SyncedFile)
                .where(models.SyncedFile.synced_folder_id == synced_folder.id)
                .where(
                    models.SyncedFile.parent_ids.contains(
                        [synced_file_folder_id if synced_file_folder_id else -1]
                    )
                )
                .where(not_(models.SyncedFile.deleted))
            )
        )
    ).all()
    print(f"got {len(synced_files)} files with synced_folder_id {synced_folder.id}")

    # for recursive sync
    sub_file_folders_to_sync: list[models.SyncedFile] = [
        synced_file for synced_file in synced_files if synced_file.is_folder
    ]

    # create a synced file for missing google files
    missing = [
        google_file
        for google_file in google_files
        if google_file["id"] not in [synced_file.remote_id for synced_file in synced_files]
    ]
    print(f"adding {len(missing)} missing files")
    for google_file in missing:
        sf = models.SyncedFile(
            synced_folder_id=synced_folder.id,
            remote_id=google_file["id"],
            name=google_file["name"],
            mime_type=google_file["mimeType"],
            user_id=user_id,  # type: ignore
            is_folder=google_file["mimeType"] == "application/vnd.google-apps.folder",
            source="google_drive",
            # we only add the parent we know about now, and will add the
            # others when we process those folders
            parent_ids=[synced_file_folder_id if synced_file_folder_id else -1],
        )
        session.add(sf)

        # for recursive sync
        if sf.is_folder:
            sub_file_folders_to_sync.append(sf)

    # TODO update synced files with correct parent ids

    # soft delete synced files that are no longer in google drive
    to_delete = [
        synced_file
        for synced_file in synced_files
        if not synced_file.deleted
        and synced_file.remote_id not in [google_file["id"] for google_file in google_files]
    ]
    print(f"marking {len(to_delete)} files as deleted")
    for synced_file in to_delete:
        synced_file.deleted = True

    # commit before query
    await session.commit()

    if recursive:
        for sub_file_folder in sub_file_folders_to_sync:
            if sub_file_folder.deleted:
                continue
            if sub_file_folder.id:
                await _update_synced_folder_with_session(
                    session,
                    synced_folder,
                    sub_file_folder.id,
                    auto_sync_extensions,
                    user_id,
                    service,
                    recursive=recursive,
                )
            else:
                print(
                    f"sub_file_folder with remote_id {sub_file_folder.remote_id} has no id, skipping..."
                )

    # # sync the files to a dataset
    # def get_ext(name: str) -> str | None:
    #     if "." in name:
    #         return "." + name.rsplit(".")[-1]
    #     return None

    # if get_ext(synced_file.name) in auto_sync_extensions:
    #     pass
    # synced_files_to_process = [
    #     f
    #     for f in synced_files
    #     if not f.deleted and not f.is_folder and get_ext(f.name) in auto_sync_extensions
    # ]
    # print("synced_files_to_process")
    # print(synced_files_to_process)


# --------------------------------------------
# Unused functions to summarize text and files
# --------------------------------------------


async def load_pdf(session: AsyncSession, file_data: bytes, user_id: str):
    # process PDF (https://github.com/py-pdf/benchmarks)
    pdf: Final = pdfium.PdfDocument(file_data)

    text_content = ""
    for page in pdf:
        text_content += page.get_textpage().get_text_range()

    fd: Final = models.FileData(user_id=user_id, text_content=text_content)
    session.add(fd)
    await session.commit()
    await session.refresh(fd)
    return fd.id


async def summarize_excel(
    file_content: bytes,
    file: models.SyncedFile,
    file_data: models.FileData | None,
    session: AsyncSession,
) -> None:
    print("loading excel")
    summary, _ = await ai.summarize(file_content.decode("utf-8"))
    if not file_data:
        file_data = models.FileData(
            synced_file=file, user_id=file.user_id, text_content=None, text_summary=summary
        )
        session.add(file_data)
    else:
        file_data.text_summary = summary
    await session.commit()


async def summarize_text(
    file_content: bytes,
    file: models.SyncedFile,
    file_data: models.FileData | None,
    session: AsyncSession,
) -> None:
    print("loading text -- assuming utf-8")
    try:
        file_str = file_content.decode("utf-8")
    except UnicodeDecodeError:
        print("could not decode as utf-8")
        return

    # summarize (default is gpt3.5)
    summary, _ = await ai.summarize(file_str)

    if not file_data:
        file_data = models.FileData(
            synced_file=file, user_id=file.user_id, text_content=file_str, text_summary=summary
        )
        session.add(file_data)
    else:
        file_data.text_content = file_str
        file_data.text_summary = summary
    await session.commit()


async def process_file(
    file: models.SyncedFile,
    file_data: models.FileData | None,
    session: AsyncSession,
    service: Any,
) -> None:
    """Load the file data into the database and annotate it.

    mime_type includes normal mime types plus those here:
    https://developers.google.com/drive/api/guides/mime-types

    """
    print("downloading file")
    # Retrieve the documents contents from the Docs service.
    request = service.files().get_media(fileId=file.remote_id)
    with io.BytesIO() as f:
        downloader = MediaIoBaseDownload(f, request)
        done = False
        while done is False:
            status, done = downloader.next_chunk()
        bytes = f.getvalue()

    # text
    if file.mime_type == "text/plain":
        print("processing text")
        try:
            await load_text(bytes, file, file_data, session)
        except Exception as e:
            print(f"error processing text")
            print_exception(e)
            # file.processing_status = "error"
            await session.commit()
    elif file.mime_type in [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
    ]:
        print("processing excel")
        try:
            await load_excel(bytes, file, file_data, session)
        except Exception as e:
            print(f"error processing excel")
            print_exception(e)
            # file.processing_status = "error"
            await session.commit()
    else:
        print(f"unknown mime type {file.mime_type}")

    # mark as done
    # file.processing_status = "done"
    await session.commit()


async def annotate_file(file: schemas.FileToAnnotate, access_token: str) -> None:
    mime_type, t1 = await ai.determine_mime_type(file.name)
    # TODO verify mime_type by loading the file
    tokens = t1
    # supabase = get_authenticated_client_with_token(access_token)
    # res = (
    #     supabase.table("file")
    #     .update({"mime_type": mime_type, "tokens": tokens})
    #     .eq("id", file.id)
    #     .execute()
    # )
    # TODO if this fails, how do we update the user?
