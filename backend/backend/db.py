import os

# from redis.asyncio import Redis

from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

connection_string = os.environ.get("POSTGRESQL_CONNECTION_STRING")
if connection_string is None:
    raise Exception("Missing POSTGRESQL_CONNECTION_STRING")

# redis_connection_string = os.environ.get("REDIS_CONNECTION_STRING")
# if redis_connection_string is None:
#     raise Exception("Missing REDIS_CONNECTION_STRING")


engine = create_async_engine(connection_string)
MyAsyncSession = sessionmaker(engine, class_=AsyncSession)


async def get_session():
    """For use with FastAPI Depends"""
    async with MyAsyncSession() as session:
        yield session


# async def get_redis():
#     """For use with FastAPI Depends"""
#     return Redis()
