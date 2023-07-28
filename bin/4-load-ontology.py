#!/usr/bin/env python

import sys
import numpy as np
import os
import pickle
import subprocess
from os.path import dirname, join, realpath

import click
import networkx as nx
import obonet
import pandas as pd
from sqlalchemy import Column, Integer, Table, create_engine, and_
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session

from db import load_with_hash
from hash import edge_hash_fn


dir = dirname(realpath(__file__))
data_dir = join(dir, "..", "data")


@click.command()
@click.option("--download", is_flag=True, help="Download Rhea data again")
@click.option("--load-db", is_flag=True, help="Write to the database")
@click.option("--number", type=int, help="Load the first 'number' chemicals")
@click.option("--connection-string", type=str, help="Select another postgres connection string")
@click.option("--upsert", is_flag=True, help="Update existing rows")
def main(
    download: bool,
    load_db: bool,
    number: int | None,
    connection_string: str,
    upsert: bool,
):
    print("creating database session")
    con = connection_string or os.environ.get("SUPABASE_CONNECTION_STRING")
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
    # https://stackoverflow.com/a/61939524
    Table(
        "node_search",
        Base.metadata,
        Column("id", Integer, primary_key=True),
        autoload=True,
        autoload_with=engine,
    )
    Base.prepare(autoload_with=engine)
    Node = Base.classes.node
    Edge = Base.classes.edge
    NodeSearch = Base.classes.node_search

    if download:
        print("deleting old files")

        try:
            os.remove(join(data_dir, "chebi.obo.gz"))
        except:
            pass

        print("downloading files")

        subprocess.run(
            ["axel", "https://ftp.ebi.ac.uk/pub/databases/chebi/ontology/nightly/chebi.obo.gz"],
            cwd=data_dir,
        )

    if load_db:
        print("reading files")

        ontology: nx.MultiDiGraph
        tmp_pickle = "tmp_obo_raw.pickle"
        if os.path.exists(join(data_dir, tmp_pickle)):
            print("loading from pickle")
            with open(join(data_dir, tmp_pickle), "rb") as f:
                ontology = pickle.load(f)
        else:
            print("loading from obo")
            ontology = obonet.read_obo(join(data_dir, "chebi.obo.gz"))
            with open(join(data_dir, tmp_pickle), "wb") as f2:
                pickle.dump(ontology, f2)

        ontology_df = pd.DataFrame(
            ontology.edges, columns=["source_chebi", "destination_chebi", "relationship"]
        )
        ontology_df["source_chebi"] = ontology_df["source_chebi"].str.replace("CHEBI:", "")
        ontology_df["destination_chebi"] = ontology_df["destination_chebi"].str.replace(
            "CHEBI:", ""
        )

        if number:
            ontology_df = ontology_df.iloc[:number]

        print("getting chemicals")
        chebi_ids_df = pd.DataFrame(
            ontology_df[["source_chebi", "destination_chebi"]].stack().unique(),
            columns=["chebi_id"],
        )
        results: list[tuple[str, int, str]] = []
        chunk_size = 1000
        sleep_seconds = 0.2
        for i, (_, chunk) in enumerate(
            chebi_ids_df.groupby(np.arange(len(chebi_ids_df)) // chunk_size)
        ):
            sys.stdout.write(
                f"\rselecting chunk {i + 1}"
                + (f" ... sleeping {sleep_seconds} seconds" if sleep_seconds else "")
            )
            sys.stdout.flush()
            results += (
                session.query(NodeSearch.value, Node.id, Node.hash)
                .select_from(NodeSearch)
                .join(Node, Node.id == NodeSearch.id)
                .where(
                    and_(NodeSearch.source == "chebi", NodeSearch.value.in_(chunk.chebi_id.values)),
                )
                .all()
            )
        results_df = pd.DataFrame(
            results,
            columns=["chebi_id", "id", "hash"],
        )

        ontology_match = ontology_df.merge(
            results_df.rename(
                columns={
                    "chebi_id": "source_chebi",
                    "id": "source_id",
                    "hash": "source_hash",
                }
            ),
            on="source_chebi",
        ).merge(
            results_df.rename(
                columns={
                    "chebi_id": "destination_chebi",
                    "id": "destination_id",
                    "hash": "destination_hash",
                }
            ),
            on="destination_chebi",
        )
        ontology_match["hash"] = ontology_match.apply(
            lambda row: edge_hash_fn(row.source_hash, row.destination_hash, row.relationship),
            axis=1,
        )
        ontology_match["previous_hash"] = ontology_match["hash"]

        print("loading edges")
        edges_to_load = pd.DataFrame.from_records(
            {
                "source_id": row.source_id,
                "destination_id": row.destination_id,
                "relationship": row.relationship,
                "hash": row.hash,
                "previous_hash": row.previous_hash,
            }
            for row in ontology_match.itertuples()
        )
        load_with_hash(session, edges_to_load, Edge, upsert)

    # print("loading edge history")
    # TODO: where to show edge history in the UI?

    print("done")


if __name__ == "__main__":
    main()
