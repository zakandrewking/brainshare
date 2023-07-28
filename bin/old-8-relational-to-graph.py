#!/usr/bin/env python

"""
Load existing relational data into the new graph schema, starting with just a
few entities for testing.
"""

import asyncio
import os
from os.path import dirname, join, realpath
from typing import Final

import click
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session

from db import chunk_insert

# get environment variables from .env
load_dotenv()


dir = dirname(realpath(__file__))
seed_dir = join(dir, "..", "seed_data")


@click.command()
def main(*args, **kwargs) -> None:
    asyncio.run(async_main(*args, **kwargs))


async def async_main(*args, **kwargs) -> None:
    con = os.environ.get("SUPABASE_CONNECTION_STRING")
    if not con:
        raise Exception(
            """Missing connection string. Provide SUPABASE_CONNECTION_STRING in
            a .env file or use the command-line option --connection-string"""
        )
    engine = create_engine(con)
    session = Session(engine, future=True)  # type: ignore

    # NOTE: automap_base requires every table to have a primary key
    # https://docs.sqlalchemy.org/en/20/faq/ormconfiguration.html#how-do-i-map-a-table-that-has-no-primary-key
    Base = automap_base()
    Base.prepare(autoload_with=engine)
    NodeType = Base.classes.node_type
    Node = Base.classes.node
    # NodeHistory = Base.classes.node_history
    # Edge = Base.classes.edge
    # EdgeHistory = Base.classes.edge_history

    chemicals: Final[pd.DataFrame] = pd.read_table(join(seed_dir, "chemical.tsv"))
    synonyms: Final[pd.DataFrame] = pd.read_table(join(seed_dir, "synonym.tsv")).dropna(
        subset=["chemical_id"]
    )

    session.add(NodeType(name="chemical", top_level=True))
    session.add(NodeType(name="synonym"))
    session.commit()

    nodes = pd.concat(
        [
            pd.DataFrame.from_records(
                {
                    "type": "chemical",
                    "data": {
                        "name": c.name,
                        "inchi": c.inchi,
                        "inchi_key": c.inchi_key,
                    },
                    "public": True,
                }
                for c in chemicals.itertuples()
            ),
            pd.DataFrame.from_records(
                {
                    "type": "synonym",
                    "data": {
                        "source": s.source,
                        "value": s.value,
                    },
                    "public": True,
                }
                for s in synonyms.itertuples()
            ),
        ]
    )
    chunk_insert(session, nodes, Node)

    # edges = pd.DataFrame(
    #     {
    #         "source": chemicals["id"],
    #         "destination": synonyms["id"],
    #     }
    # )

    # chunk_insert(session, edges, Edge)


if __name__ == "__main__":
    main()
