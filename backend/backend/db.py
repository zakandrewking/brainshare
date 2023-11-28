from contextlib import contextmanager
from fastapi import Depends
import os
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from typing import Annotated

from backend import auth


connection_string = os.environ.get("POSTGRESQL_CONNECTION_STRING")
if connection_string is None:
    raise Exception("Missing POSTGRESQL_CONNECTION_STRING")

engine = create_async_engine(connection_string)
AsyncSessionmaker = sessionmaker(engine, class_=AsyncSession)


async def get_session_for_user(user_id: str) -> AsyncSession:
    """Create a sqlalchemy session for the user_id."""
    async with AsyncSessionmaker() as session:
        await session.execute(f"CALL auth.login_as_user('${user_id}');")
        yield session


async def get_session(
    user: Annotated[auth.User, Depends(auth.current_user)],
) -> AsyncSession:
    """Create a sqlalchemy session for the authorized user. For use with FastAPI
    Depends."""
    return await get_session_for_user(user.id)


@contextmanager
async def as_admin(session: AsyncSession, user: auth.User):
    """Use with context manager to run as admin"""
    await session.execute("RESET ROLE;")
    await session.execute("CALL auth.logout();")
    try:
        yield
    finally:
        await session.execute(f"CALL auth.login_as_user('${user.id}');")
