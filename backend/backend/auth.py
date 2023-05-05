import os

from fastapi import HTTPException, Request
from gotrue.types import User
from supabase import create_client


def get_user(request: Request) -> User:
    supabase_api_url = os.environ.get("SUPABASE_API_URL")
    if not supabase_api_url:
        raise Exception("Missing environment variable SUPABASE_API_URL")
    supabase_anon_key = os.environ.get("SUPABASE_ANON_KEY")
    if not supabase_anon_key:
        raise Exception("Missing environment variable SUPABASE_ANON_KEY")
    if not "Authorization" in request.headers:
        raise HTTPException(status_code=401, detail="Missing header Authorization")
    supabase = create_client(
        supabase_api_url,
        supabase_anon_key,
    )
    response = supabase.auth.get_user(request.headers["Authorization"].replace("Bearer ", ""))
    user = response.user
    if not user:
        raise HTTPException(status_code=401, detail="Could not authenticate")
    return user
