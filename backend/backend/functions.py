import os
import httpx
import re


async def invoke(function_name: str, method: str, access_token: str):
    """Based on supabase.tsx:invoke()"""

    supabase_api_url = os.environ.get("SUPABASE_API_URL")
    if not supabase_api_url:
        raise Exception("Missing environment variable SUPABASE_API_URL")
    supabase_anon_key = os.environ.get("SUPABASE_ANON_KEY")
    if not supabase_anon_key:
        raise Exception("Missing environment variable SUPABASE_ANON_KEY")

    is_platform = bool(re.search(r"(supabase\.co)|(supabase\.in)", supabase_api_url))
    functionsUrl = ""
    if is_platform:
        urlParts = supabase_api_url.split(".")
        functionsUrl = f"{urlParts[0]}.functions.{urlParts[1]}.{urlParts[2]}"
    else:
        functionsUrl = f"{supabase_api_url}/functions/v1"

    url = f"{functionsUrl}/{function_name}"
    headers = {
        "apikey": supabase_anon_key,
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient() as client:
        response = await client.request(method, url, headers=headers)

    response.raise_for_status()

    return response.json()
