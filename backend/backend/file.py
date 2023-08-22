from backend import ai
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
