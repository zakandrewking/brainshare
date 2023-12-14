import io
from typing import Final, Any
from traceback import print_exception

from googleapiclient.http import MediaIoBaseDownload  # type: ignore
from google.oauth2.credentials import Credentials  # type: ignore
from googleapiclient.discovery import build  # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, select
from sqlalchemy.orm import selectinload
import pypdfium2 as pdfium  # type: ignore

from backend import ai
from backend import db
from backend import models
from backend.schemas import FileToAnnotate


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


async def load_excel(
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


async def load_text(
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
            file.processing_status = "error"
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
            file.processing_status = "error"
            await session.commit()
    else:
        print(f"unknown mime type {file.mime_type}")

    # mark as done
    file.processing_status = "done"
    await session.commit()


async def update_synced_folder(
    synced_folder_id: int,
    synced_file_folder_id: int | None,
    user_id: str,
) -> None:
    """Update one folder within a synced folder, not recursive.

    synced_file_folder_id is the id of the SyncedFile that is this folder.

    If synced_file_folder_id is None, then this is the root folder.

    """
    print(f"Updating synced folder with id {synced_folder_id}")
    if synced_file_folder_id:
        print(f"Updating child folder with id {synced_file_folder_id}")
    else:
        print(f"Updating root folder")

    # get a session
    async with db.get_session_for_user(user_id) as session:
        synced_folder = await session.get(models.SyncedFolder, synced_folder_id)
        print(f"folder with remote_id {synced_folder.remote_id}")

        synced_file_folder = None
        if synced_file_folder_id:
            synced_file_folder = await session.get(models.SyncedFile, synced_file_folder_id)
            print(f"child folder with remote_id {synced_file_folder.remote_id}")

        service = await get_google_service(session, user_id)

        # use google_service to find remote files
        remote_id_to_search = (
            synced_file_folder.remote_id if synced_file_folder else synced_folder.remote_id
        )
        google_files = (
            service.files()
            .list(
                q=f"('{remote_id_to_search}' in parents) and mimeType != 'application/vnd.google-apps.folder'",
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
                    .where(models.SyncedFile.synced_folder_id == synced_folder_id)
                    .where(
                        models.SyncedFile.parent_ids.contains(
                            [synced_file_folder_id if synced_file_folder_id else -1]
                        )
                    )
                )
            )
        ).all()
        print(f"got {len(synced_files)} files with synced_folder_id {synced_folder_id}")

        # create a synced file for missing google files
        missing = [
            google_file
            for google_file in google_files
            if google_file["id"] not in [synced_file.remote_id for synced_file in synced_files]
        ]
        print(f"adding {len(missing)} missing files")
        for google_file in missing:
            sf = models.SyncedFile(
                synced_folder_id=synced_folder_id,
                remote_id=google_file["id"],
                name=google_file["name"],
                mime_type=google_file["mimeType"],
                user_id=user_id,
                is_folder=False,
                source="google_drive",
                processing_status="processing",
                # we only add the parent we know about now, and will add the
                # others when we process those folders
                parent_ids=[synced_file_folder_id if synced_file_folder_id else -1],
            )
            session.add(sf)

        # TODO update synced files with correct parent ids

        # soft delete synced files that are no longer in google drive
        to_delete = [
            synced_file
            for synced_file in synced_files
            if synced_file.remote_id not in [google_file["id"] for google_file in google_files]
        ]
        print(f"marking {len(to_delete)} files as deleted")
        for synced_file in to_delete:
            synced_file.deleted = True

        # commit before query
        await session.commit()

        # get all synced files
        all_synced_files = (
            await session.scalars(
                select(models.SyncedFile)
                .where(models.SyncedFile.synced_folder_id == synced_folder_id)
                .options(selectinload(models.SyncedFile.file_data))
            )
        ).all()

        # mark all as processing
        for file in all_synced_files:
            file.processing_status = "processing"
        await session.commit()

        print(f"processing {len(all_synced_files)} files")
        for file in all_synced_files:
            file_data = file.file_data[0] if len(file.file_data) > 0 else None
            await process_file(file, file_data, session, service)

        print("done")


async def update_synced_file(synced_file_id: int, user_id: str):
    """Update the file. SyncedFile object must already exist, but not
    necessarily FileData."""

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
        file.processing_status = "processing"
        await session.commit()

        await process_file(file, file_data, session, service)
    print("done")


async def annotate_file(file: FileToAnnotate, access_token: str) -> None:
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
