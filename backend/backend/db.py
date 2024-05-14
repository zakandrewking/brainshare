from contextlib import asynccontextmanager
from fastapi import Depends
import os
from typing import Annotated

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.ext.asyncio import async_sessionmaker

from backend import auth


@asynccontextmanager
async def get_session_for_user(user_id: str):
    """Create a sqlalchemy session for the user_id."""
    print(f"getting session for user {user_id}")

    connection_string = os.environ.get("POSTGRESQL_CONNECTION_STRING")
    if connection_string is None:
        raise Exception("Missing environment variable POSTGRESQL_CONNECTION_STRING")

    engine = create_async_engine(connection_string)
    maker = async_sessionmaker(engine, expire_on_commit=False)

    async with maker() as session:
        await session.execute(text(f"call auth.login_as_user('{user_id}')"))
        yield session
    print(f"closed session for user {user_id}")


async def session(
    user_id: Annotated[str, Depends(auth.get_user_id)],
):
    """Create a sqlalchemy session for the authorized user. For use with FastAPI
    Depends."""
    async with get_session_for_user(user_id) as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@asynccontextmanager
async def as_admin(session: AsyncSession, user_id: str):
    """Use with context manager to run as admin"""
    # TODO debug log
    # print("logging out -- i.e. becoming admin")
    await session.execute(text("reset role"))
    await session.execute(text("call auth.logout()"))
    yield
    # print(f"logging back in as user {user_id}")
    await session.execute(text(f"call auth.login_as_user('{user_id}')"))
