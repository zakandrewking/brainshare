import os
from typing import AsyncIterator

from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, AsyncEngine

connection_string = os.environ.get("POSTGRESQL_CONNECTION_STRING")
if connection_string is None:
    raise Exception("Missing POSTGRESQL_CONNECTION_STRING")


engine = create_async_engine(connection_string)
sessionmaker = sessionmaker(engine, class_=AsyncSession)


async def get_session() -> AsyncIterator[AsyncSession]:
    """For use with FastAPI Depends"""
    async with sessionmaker() as session:
        yield session
