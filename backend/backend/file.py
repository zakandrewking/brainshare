from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import json
from sqlalchemy.ext.asyncio import AsyncSession
import tempfile

from backend import ai
from backend.db import get_admin_session, get_authenticated_session
from backend.auth import get_authenticated_client_with_token
from backend.schemas import FileToAnnotate


async def annotate_file(file: FileToAnnotate, access_token: str) -> None:
    mime_type, t1 = await ai.determine_mime_type(file.name)
    # TODO verify mime_type by loading the file
    tokens = t1
    supabase = get_authenticated_client_with_token(access_token)
    res = (
        supabase.table("file")
        .update({"mime_type": mime_type, "tokens": tokens})
        .eq("id", file.id)
        .execute()
    )
    # TODO if this fails, how do we update the user?


async def update_synced_folder(
    synced_folder_id: int,
    access_token: str,
) -> None:
    print(f"Updating synced folder with id {synced_folder_id}")
    # TODO use postgres session directly instead of supabase
    # TODO can we also set up an authentication context to keep queries safe?

    admin_session: AsyncSession = await get_admin_session()
    authenticated_session: AsyncSession = await get_authenticated_session()

    admin_session.close()
    authenticated_session.close()

    # # get remote file id
    # folder = (
    #     supabase.table("synced_folder")
    #     .select("remote_id")
    #     .eq("id", synced_folder_id)
    #     .single()
    #     .execute()
    # ).json()
    # remote_id = folder["data"]["remote_id"]

    # # get google creds
    # # TODO get this via database directly (same for above?)? or just pass the
    # # google access token into the job
    # connection = (
    #     supabase.table("oauth2_connection")
    #     .select("*")
    #     .eq("id", synced_folder_id)
    #     .single()
    #     .execute()
    # ).json()

    # open temp file
    tmp = tempfile.NamedTemporaryFile()
    creds = None
    with open(tmp.name, "rw") as f:
        json.dump(
            {
                "access_token": connection["access_token"],
                "refresh_token": connection["refresh_token"],
            },
            f,
        )
        creds = Credentials.from_authorized_user_file(
            tmp.name, ["https://www.googleapis.com/auth/drive"]
        )
    if not creds or not creds.valid:
        raise Exception("Invalid credentials")
    try:
        service = build("docs", "v1", credentials=creds)

        # Retrieve the documents contents from the Docs service.
        folder = service.documents().get(documentId=remote_id).execute()

        print(f"The title of the folder is: {folder.get('title')}")
    except HttpError as err:
        print(err)
