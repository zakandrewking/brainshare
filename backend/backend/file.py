from backend import ai
from backend.auth import get_admin_client
from backend.schemas import FileToAnnotate


async def annotate_file(file: FileToAnnotate) -> None:
    mime_type, t1 = await ai.determine_mime_type(file.name)
    # TODO verify mime_type by loading the file
    tokens = t1
    # TODO(SECURITY) use the user's access token so we don't have to use the
    # service role key
    supabase = get_admin_client()
    res = (
        supabase.table("file")
        .update({"mime_type": mime_type, "tokens": tokens})
        .eq("id", file.id)
        .execute()
    )
    # TODO if this fails, how do we update the user?
