from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, select
import tempfile
from typing import Final
import pypdfium2 as pdfium

from backend import ai
from backend import auth
from backend import db
from backend import models
from backend.schemas import FileToAnnotate


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


async def process_synced_file(
    session: AsyncSession, file_data: bytes, user_id: str, mime_type: str | None = None
) -> int | None:
    """Load the file data into the database and annotate it.

    mime_type includes normal mime types plus those here:
    https://developers.google.com/drive/api/guides/mime-types

    """

    if mime_type == "application/pdf":
        print("processing pdf")
        return await load_pdf(session, file_data, user_id)
    else:
        print(f"unknown mime type {mime_type}")
        return None


async def update_synced_folder(
    synced_folder_id: int,
    user_id: str,
) -> None:
    print(f"Updating synced folder with id {synced_folder_id}")

    async with db.get_session_for_user(user_id) as session:
        print("getting remote_id")
        remote_id = (
            (
                await session.execute(
                    select(models.SyncedFolder).where(models.SyncedFolder.id == synced_folder_id)
                )
            )
            .scalar_one()
            .remote_id
        )
        print(f"received {remote_id}")

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
            print(f"received {access_token}")

    print("ready to continue work without sql session")

    # # get remote file id
    # folder = (
    #     supabase.table("synced_folder")
    #     .select("remote_id")
    #     .eq("id", synced_folder_id)
    #     .single()
    #     .execute()
    # ).json()
    # remote_id = folder["data"]["remote_id"]

    # # open temp file
    # tmp = tempfile.NamedTemporaryFile()
    # creds = None
    # with open(tmp.name, "rw") as f:
    #     json.dump(
    #         {
    #             "access_token": connection["access_token"],
    #             "refresh_token": connection["refresh_token"],
    #         },
    #         f,
    #     )
    #     creds = Credentials.from_authorized_user_file(
    #         tmp.name, ["https://www.googleapis.com/auth/drive"]
    #     )
    # if not creds or not creds.valid:
    #     raise Exception("Invalid credentials")
    # try:
    #     service = build("docs", "v1", credentials=creds)

    #     # Retrieve the documents contents from the Docs service.
    #     folder = service.documents().get(documentId=remote_id).execute()

    #     print(f"The title of the folder is: {folder.get('title')}")
    # except HttpError as err:
    #     print(err)


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
