import os

from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

connection_string = os.environ.get("POSTGRESQL_CONNECTION_STRING")
if connection_string is None:
    raise Exception("Missing POSTGRESQL_CONNECTION_STRING")

engine = create_async_engine(connection_string)
AsyncSessionmaker = sessionmaker(engine, class_=AsyncSession)


async def get_session(access_token: str = None):
    """For use with FastAPI Depends"""
    async with AsyncSessionmaker() as session:
        # TODO default to authenticated role or anon if no access token
        yield session


def as_admin(session: AsyncSession):
    """Use with context manager to run as admin"""
    pass
