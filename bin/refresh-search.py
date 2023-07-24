#!/usr/bin/env python

import asyncio
import os

import click
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from db import chunk_insert


@click.command()
@click.option("--connection-string", type=str, help="Select another postgres connection string")
def main(*args, **kwargs):
    asyncio.run(async_main(*args, **kwargs))


async def async_main(
    connection_string: str | None,
):
    con = connection_string or os.environ.get("SUPABASE_CONNECTION_STRING")
    if not con:
        raise Exception(
            """Missing connection string. Provide SUPABASE_CONNECTION_STRING in
            a .env file or use the command-line option --connection-string"""
        )
    engine = create_engine(con)
    session = Session(engine, future=True)  # type: ignore

    session.execute(text("refresh materialized view node_search;"))
    session.commit()


if __name__ == "__main__":
    main()
