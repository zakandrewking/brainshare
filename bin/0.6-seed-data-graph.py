#!/usr/bin/env python

import asyncio
import os
import pickle
from os.path import dirname, join, realpath

import click
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from storage3 import AsyncStorageClient, create_client
from storage3.utils import StorageException

from db import chunk_insert
from structures import upload_svg

# get environment variables from .env
load_dotenv()


dir = dirname(realpath(__file__))
data_dir = join(dir, "..", "data")
seed_dir = join(dir, "..", "seed_data_graph")


@click.command()
@click.option("--connection-string", type=str, help="Select another postgres connection string")
@click.option("--supabase-url", type=str, help="Supabase URL")
@click.option("--supabase-key", type=str, help="Supabase service key")
def main(*args, **kwargs):
    asyncio.run(async_main(*args, **kwargs))


async def async_main(
    connection_string: str | None,
    supabase_url: str | None,
    supabase_key: str | None,
):
    con = connection_string or os.environ.get("SUPABASE_CONNECTION_STRING")
    if not con:
        raise Exception(
            """Missing connection string. Provide SUPABASE_CONNECTION_STRING in
            a .env file or use the command-line option --connection-string"""
        )
    engine = create_engine(con)
    session = Session(engine, future=True)  # type: ignore

    url = supabase_url or os.environ.get("SUPABASE_URL")
    if not url:
        raise Exception("Missing environment variable SUPABASE_URL")
    key = supabase_key or os.environ.get("SUPABASE_KEY")
    if not key:
        raise Exception("Missing environment variable SUPABASE_KEY")

    storage: AsyncStorageClient = create_client(
        url=f"{url}/storage/v1",
        is_async=True,
        headers={"apiKey": key, "Authorization": f"Bearer {key}"},
    )
    bucket = "structure_images_svg_graph"

    # NOTE: automap_base requires every table to have a primary key
    # https://docs.sqlalchemy.org/en/20/faq/ormconfiguration.html#how-do-i-map-a-table-that-has-no-primary-key
    Base = automap_base()
    Base.prepare(autoload_with=engine)
    Node = Base.classes.node
    Edge = Base.classes.edge

    print("loading nodes")
    with open(join(seed_dir, "node.pickle"), "rb") as f:
        nodes: pd.DataFrame = pickle.load(f)
    chunk_insert(session, nodes, Node)

    print("loading edges")
    with open(join(seed_dir, "edge.pickle"), "rb") as f:
        edges: pd.DataFrame = pickle.load(f)
    chunk_insert(session, edges, Edge)

    # images
    try:
        await storage.get_bucket(bucket)
    except StorageException:
        await asyncio.sleep(1)
        await storage.create_bucket(bucket, public=True)

    chemicals = nodes[nodes.node_type_id == "chemical"]
    for chemical in chemicals.itertuples():
        for file_name in [f"{chemical.id}.svg", f"{chemical.id}_dark.svg"]:
            with open(join(seed_dir, "structures", file_name), "rb") as f2:
                await upload_svg(f2.read(), file_name, storage, bucket=bucket)

    print("done")


if __name__ == "__main__":
    main()
