import os

import jwt
from fastapi import HTTPException, Request
from sqlmodel import SQLModel


class User(SQLModel):
    id: str
    access_token: str


# TODO switch to asymmetric signing when this is done:
# https://github.com/orgs/supabase/discussions/12759
# rotating the jwt secret is a pain, so keep it safe
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")
if SUPABASE_JWT_SECRET is None:
    raise Exception("Missing environment variable SUPABASE_JWT_SECRET")


def get_user_id(request: Request) -> str:
    """Authorize by validating a JWT without a round-trip.

    Returns the user ID (sub).
    """
    if SUPABASE_JWT_SECRET is None:
        raise Exception("Missing environment variable SUPABASE_JWT_SECRET")

    if not "Authorization" in request.headers:
        raise HTTPException(status_code=401, detail="Missing header Authorization")
    access_token = request.headers["Authorization"].replace("Bearer ", "")

    try:
        res = jwt.decode(
            access_token, SUPABASE_JWT_SECRET, audience="authenticated", algorithms=["HS256"]
        )
        return res["sub"]
    except jwt.ExpiredSignatureError as e:
        print(e)
        raise HTTPException(status_code=401, detail="Session is expired. Please log in again.")
    except Exception as e:
        print(e)
        raise HTTPException(status_code=401, detail="Could not authenticate")
