import os

import pytest
from httpx import AsyncClient
from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from backend.db import get_session
from backend.main import app
from backend.test.mock import mock_openai_embedding_async

# mock first so we don't set up openai with real keys
mock_openai_embedding_async()

# Create a nested transaction, recreate it when the application code calls
# session.commit, and roll it back at the end. Based on:
# https://docs.sqlalchemy.org/en/14/orm/session_transaction.html#joining-a-session-into-an-external-transaction-such-as-for-test-suites
# and
# https://stackoverflow.com/questions/67255653/how-to-set-up-and-tear-down-a-database-between-tests-in-fastapi#comment124064101_67348153
# and
# https://github.com/sqlalchemy/sqlalchemy/issues/5811#issuecomment-755871691
@pytest.fixture()
async def session(event_loop):
    connection_string = os.environ.get("POSTGRESQL_CONNECTION_STRING")
    if connection_string is None:
        raise Exception("Missing POSTGRESQL_CONNECTION_STRING")

    engine = create_async_engine(connection_string)

    async with engine.connect() as connection:
        await connection.begin()

        # Begin a nested transaction (using SAVEPOINT). Note this points to the
        # sync version of the Transaction.
        await connection.begin_nested()

        MyAsyncSession = sessionmaker(
            bind=connection,
            autocommit=False,
            autoflush=False,
            expire_on_commit=False,
            class_=AsyncSession,
        )
        async_session = MyAsyncSession()

        # If the application code calls session.commit, it will end the nested
        # transaction. Need to start a new one when that happens.
        @event.listens_for(async_session.sync_session, "after_transaction_end")
        def end_savepoint(session, transaction):
            if connection.closed:
                return
            if not connection.in_nested_transaction():
                connection.sync_connection.begin_nested()

        yield async_session

        # Rollback the overall transaction, restoring the state before the test ran.
        await connection.rollback()


# A fixture for the fastapi test client which depends on the previous session
# fixture. Instead of creating a new session in the dependency override as
# before, it uses the one provided by the session fixture.
@pytest.fixture()
async def client(session, event_loop):
    async def override_get_session():
        yield session

    app.dependency_overrides[get_session] = override_get_session
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
    del app.dependency_overrides[get_session]
