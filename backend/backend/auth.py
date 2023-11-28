import os

from fastapi import HTTPException, Request
from sqlmodel import SQLModel
from supabase import create_client


# TODO switch to asymmetric signing when this is done:
# https://github.com/orgs/supabase/discussions/12759
# rotating the jwt secret is a pain, so keep it safe
# def decode_access_token(access_token: str) -> str:
#     """Authorize by validating the JWT without a round-trip to Supabase.

#     Returns the user id.
#     """
#     try:
#         res = jwt.decode(
#             access_token, SUPABASE_JWT_SECRET, audience="authenticated", algorithms=["HS256"]
#         )
#         # TODO get user ID from token
#         print(res)
#         return res["sub"]
#     except jwt.ExpiredSignatureError as e:
#         print(e)
#         raise HTTPException(status_code=401, detail="Session is expired. Please log in again.")
#     except Exception as e:
#         print(e)
#         raise HTTPException(status_code=401, detail="Could not authenticate")


# def check_session(request: Request) -> str:
#     if not "Authorization" in request.headers:
#         raise HTTPException(status_code=401, detail="Missing header Authorization")

#     access_token = request.headers["Authorization"].replace("Bearer ", "")

#     _ = decode_access_token(access_token)

#     return access_token


class User(SQLModel):
    id: str
    access_token: str


def current_user(request: Request) -> User:
    """Returns validated access token and user."""
    if not "Authorization" in request.headers:
        raise HTTPException(status_code=401, detail="Missing header Authorization")
    access_token = request.headers["Authorization"].replace("Bearer ", "")

    supabase_api_url = os.environ.get("SUPABASE_API_URL")
    if not supabase_api_url:
        raise Exception("Missing environment variable SUPABASE_API_URL")
    supabase_anon_key = os.environ.get("SUPABASE_ANON_KEY")
    if not supabase_anon_key:
        raise Exception("Missing environment variable SUPABASE_ANON_KEY")
    supabase = create_client(
        supabase_api_url,
        supabase_anon_key,
    )

    response = supabase.auth.get_user(access_token)
    user = response.user
    if not user:
        raise HTTPException(status_code=401, detail="Could not authenticate")

    return User(user.id, access_token)


# Use db.py instead

# def get_admin_client() -> Client:
#     supabase_api_url = os.environ.get("SUPABASE_API_URL")
#     if not supabase_api_url:
#         raise Exception("Missing environment variable SUPABASE_API_URL")
#     supabase_service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
#     if not supabase_service_role_key:
#         raise Exception("Missing environment variable SUPABASE_SERVICE_ROLE_KEY")
#     supabase = create_client(
#         supabase_api_url,
#         supabase_service_role_key,
#     )
#     return supabase


# # This should work; not sure why it doesn't
# def get_authenticated_client(request: Request) -> Client:
#     access_token = request.headers["Authorization"].replace("Bearer ", "")
#     if not access_token:
#         raise HTTPException(status_code=401, detail="Missing header Authorization")
#     return get_authenticated_client_with_token(access_token)


# def get_authenticated_client_with_token(access_token: str) -> Client:
#     supabase_api_url = os.environ.get("SUPABASE_API_URL")
#     if not supabase_api_url:
#         raise Exception("Missing environment variable SUPABASE_API_URL")
#     supabase_anon_key = os.environ.get("SUPABASE_ANON_KEY")
#     if not supabase_anon_key:
#         raise Exception("Missing environment variable SUPABASE_ANON_KEY")
#     supabase = create_client(
#         supabase_api_url,
#         supabase_anon_key,
#     )
#     # TODO what if the token is expired?
#     supabase.auth.set_session(access_token, "fake_refresh_token")
#     # https://github.com/supabase-community/supabase-py/issues/185
#     supabase.postgrest.auth(access_token)
#     return supabase
