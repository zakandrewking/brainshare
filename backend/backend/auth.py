import os

from fastapi import HTTPException, Request
from gotrue.types import User
import jwt
from supabase import create_client

try:
    supabase_jwt_secret = os.environ["SUPABASE_JWT_SECRET"]
except KeyError:
    raise Exception("SUPABASE_JWT_SECRET environment variable not set")


def check_session(request: Request) -> str:
    if not "Authorization" in request.headers:
        raise HTTPException(status_code=401, detail="Missing header Authorization")

    access_token = request.headers["Authorization"].replace("Bearer ", "")

    _ = decode_access_token(access_token)

    return access_token


def decode_access_token(access_token: str) -> str:
    """Authorize by validating the JWT without a round-trip to Supabase.

    Returns the user id.
    """
    try:
        res = jwt.decode(
            access_token, supabase_jwt_secret, audience="authenticated", algorithms=["HS256"]
        )
        return res["sub"]
    except jwt.ExpiredSignatureError as e:
        print(e)
        raise HTTPException(status_code=401, detail="Session is expired. Please log in again.")
    except Exception as e:
        print(e)
        raise HTTPException(status_code=401, detail="Could not authenticate")


# TODO drop this because it's slow
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
