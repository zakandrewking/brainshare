from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, select
import tempfile

from backend import ai
from backend import auth
from backend import db
from backend import models
from backend.schemas import FileToAnnotate


async def update_synced_folder(
    synced_folder_id: int,
    user_id: str,
) -> None:
    print(f"Updating synced folder with id {synced_folder_id}")

    session = await db.get_session_for_user(user_id)

    # get remote file id
    stmt = select(models.SyncedFolder).where(models.SyncedFolder.id == synced_folder_id)
    res = await session.execute(stmt)
    #     session.query(models.SyncedFolder).filter(models.SyncedFolder.id == synced_folder_id).one()
    # )
    synced_folder = res.scalar_one()
    remote_id = synced_folder.remote_id

    with auth.as_admin(session, user_id):
        connection = (
            session.query(models.Oauth2Connection)
            .filter(
                and_(
                    models.Oauth2Connection.user_id == user_id,
                    models.Oauth2Connection.name == "google",
                )
            )
            .one()
        )

    session.close()

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
