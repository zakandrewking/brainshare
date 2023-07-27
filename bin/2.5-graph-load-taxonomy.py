#!/usr/bin/env python

import asyncio
import datetime
import os
import pickle
import subprocess
from os.path import dirname, join, realpath
from shutil import unpack_archive
from tempfile import TemporaryDirectory

import click
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session

from db import chunk_insert, chunk_select, load_with_hash
from hash import taxonomy_hash_fn, synonym_hash_fn, edge_hash_fn

ncbi_dir = "https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/"
ncbi_file = "taxdump.tar.gz"

ncbi_tax_id_subset = []  # type: ignore

# get environment variables from .env
load_dotenv()


dir = dirname(realpath(__file__))
data_dir = join(dir, "..", "data")
seed_dir = join(dir, "..", "seed_data")


def read_dmp(filepath, column_names):
    """*.dmp files are bcp-like dump from GenBank taxonomy database."""
    return (
        pd.read_csv(filepath, sep="|", header=None)
        .iloc[:, :-1]
        .applymap(lambda x: x.strip() if isinstance(x, str) else x)
        .rename(columns={i: name for i, name in enumerate(column_names)})
    )


@click.command()
@click.option("--seed-only", is_flag=True, help="Just seed a few entries")
@click.option("--download", is_flag=True, help="Download ChEBI data again")
@click.option("--load-db", is_flag=True, help="Write to the database")
@click.option("--number", type=int, help="Load the first 'number' records in the Chebi dump file")
@click.option("--connection-string", type=str, help="Select another postgres connection string")
@click.option("--sleep", type=float, default=0.2, help="Delay in seconds between chunks")
@click.option("--upsert", is_flag=True, help="Update existing rows")
def main(*args, **kwargs):
    asyncio.run(async_main(*args, **kwargs))


async def async_main(
    seed_only: bool,
    download: bool,
    load_db: bool,
    number: int | None,
    connection_string: str | None,
    sleep: float,
    upsert: bool,
):
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
    Base.prepare(autoload_with=engine)
    Node = Base.classes.node
    Edge = Base.classes.edge
    NodeHistory = Base.classes.node_history

    if seed_only:
        raise NotImplementedError

    if download:
        print("deleting old files")
        try:
            os.remove(join(data_dir, ncbi_file))
        except:
            pass

        print("downloading files")
        subprocess.run(
            [
                "axel",
                ncbi_dir + ncbi_file,
            ],
            cwd=data_dir,
        )

    if load_db:
        print("reading files")

        taxonomy_raw: list[pd.DataFrame]
        tmp_pickle = "tmp_taxonomy_raw.pickle"
        if os.path.exists(join(data_dir, tmp_pickle)):
            with open(join(data_dir, tmp_pickle), "rb") as f:
                taxonomy_raw = pickle.load(f)
        else:
            with TemporaryDirectory() as d:
                unpack_archive(join(data_dir, ncbi_file), d)
                names = read_dmp(join(d, "names.dmp"), ["tax_id", "name", "name_unique", "class"])
                nodes = read_dmp(
                    join(d, "nodes.dmp"),
                    [
                        "tax_id",
                        "parent_tax_id",
                        "rank",
                        "embl_code",
                        "division_id",
                        "inherited_div_flag",
                        "genetic_code_id",
                        "inherited_GC_flag",
                        "mitochondrial_genetic_code_id",
                        "inherited_mgc_flag",
                        "genbank_hidden_flag",
                        "hidden_subtree_root_flag",
                        "comments",
                    ],
                )
                taxonomy_raw = [names, nodes]
                # divisions = read_dmp(
                #     join(d, "division.dmp"), ["division_id", "division_cde", "division_name", "comments"]
                # )
                # genetic_codes = read_dmp(
                #     join(d, "gencode.dmp"), ["genetic_code_id", "abbreviation", "name", "cde", "starts"]
                # )
                with open(join(data_dir, tmp_pickle), "wb") as f2:
                    pickle.dump(taxonomy_raw, f2)

        names, nodes = taxonomy_raw

        # NOTE: this script assumes that all entries have a ncbi tax ID. Other
        # entries are ignored
        tax_names = (
            names[names["class"] == "scientific name"]
            .merge(nodes.loc[:, ["tax_id", "rank"]])
            .loc[:, ["tax_id", "name", "rank"]]
            .rename(columns={"tax_id": "ncbi_tax_id"})
        )

        # make sure ncbi_tax_id is a string, to match DB
        tax_names.ncbi_tax_id = tax_names.ncbi_tax_id.astype(str)
        nodes.tax_id = nodes.tax_id.astype(str)
        nodes.parent_tax_id = nodes.parent_tax_id.astype(str)

        # add parents
        tax_names = tax_names.merge(
            nodes.loc[:, ["tax_id", "parent_tax_id"]].rename(
                columns={
                    "tax_id": "ncbi_tax_id",
                    "parent_tax_id": "parent_ncbi_tax_id",
                }
            ),
            on="ncbi_tax_id",
            how="left",
        )

        # drop root
        # tax_names = tax_names[tax_names.name != "root"]

        if number:
            tax_names = tax_names.iloc[:number]

        # TODO for a clean update:
        # - create history
        # - find all nodes that were most recently a part of this data source
        #   (need a reliable ID for data source). If they are no longer in the
        #   source, soft-delete them
        # - Those that were most recently edited by someone else should be
        #   tagged for review
        # -

        # calculate hashes
        tax_names["taxonomy_hash"] = tax_names["ncbi_tax_id"].apply(taxonomy_hash_fn)
        tax_names["parent_hash"] = tax_names["parent_ncbi_tax_id"].apply(taxonomy_hash_fn)
        tax_names["synonym_hash"] = tax_names.apply(
            lambda x: synonym_hash_fn(x.taxonomy_hash, "ncbi_taxonomy_id", x.ncbi_tax_id), axis=1
        )
        tax_names["synonym_edge_hash"] = tax_names.apply(
            lambda x: edge_hash_fn(x.taxonomy_hash, x.synonym_hash, "has_synonym"), axis=1
        )
        tax_names["parent_edge_hash"] = tax_names.apply(
            lambda x: edge_hash_fn(x.taxonomy_hash, x.parent_hash, "is_child_of"), axis=1
        )

        # we also make "previous" hashes, in case the hash function has changes
        tax_names["previous_taxonomy_hash"] = tax_names.taxonomy_hash
        tax_names["previous_parent_hash"] = tax_names.parent_hash
        tax_names["previous_synonym_hash"] = tax_names.synonym_hash
        tax_names["previous_synonym_edge_hash"] = tax_names.synonym_edge_hash
        tax_names["previous_parent_edge_hash"] = tax_names.parent_edge_hash

        print("loading taxonomy")
        tax_nodes = pd.DataFrame.from_records(
            {
                "node_type_id": "taxonomy",
                "data": {
                    "name": row.name,
                    "rank": row.rank,
                },
                "hash": row.taxonomy_hash,
                "previous_hash": row.previous_taxonomy_hash,
            }
            for row in tax_names.itertuples()
        )
        tax_id_to_hash = load_with_hash(session, tax_nodes, Node, upsert, sleep)

        print("loading synonyms")
        synonym_nodes = pd.DataFrame.from_records(
            {
                "node_type_id": "synonym",
                "data": {
                    "source": "ncbi_taxonomy",
                    "value": row.ncbi_tax_id,
                },
                "hash": row.synonym_hash,
                "previous_hash": row.previous_synonym_hash,
            }
            for row in tax_names.itertuples()
        )
        synonym_id_to_hash = load_with_hash(session, synonym_nodes, Node, upsert, sleep)

        print("loading synonym edges")
        synonym_ids = (
            synonym_id_to_hash.rename(columns={"id": "destination_id", "hash": "synonym_hash"})
            .merge(tax_names, on="synonym_hash", how="inner")
            .merge(
                tax_id_to_hash.rename(columns={"hash": "taxonomy_hash", "id": "source_id"}),
                on="taxonomy_hash",
                how="inner",
            )
        )
        synonym_edges = pd.DataFrame.from_records(
            {
                "source_id": row.source_id,
                "destination_id": row.destination_id,
                "relationship": "has_synonym",
                "data": {},
                "hash": row.synonym_edge_hash,
                "previous_hash": row.previous_synonym_edge_hash,
            }
            for row in synonym_ids.itertuples()
        )
        load_with_hash(session, synonym_edges, Edge, upsert, sleep)

        parent_ids = (
            tax_id_to_hash.rename(columns={"id": "source_id", "hash": "taxonomy_hash"})
            .merge(tax_names, on="taxonomy_hash", how="inner")
            .merge(
                tax_id_to_hash.loc[:, ["id", "hash"]].rename(
                    columns={"hash": "parent_hash", "id": "destination_id"}
                ),
                on="parent_hash",
                how="inner",
            )
        )
        parent_edges = pd.DataFrame.from_records(
            {
                "source_id": row.source_id,
                "destination_id": row.destination_id,
                "relationship": "is_child_of",
                "data": {},
                "hash": row.parent_edge_hash,
                "previous_hash": row.previous_parent_edge_hash,
            }
            for row in parent_ids.itertuples()
        )
        load_with_hash(session, parent_edges, Edge, upsert, sleep)

        print("loading history")
        all_id_to_hash = pd.concat([tax_id_to_hash, synonym_id_to_hash])
        node_ids_with_history_df = chunk_select(
            session,
            all_id_to_hash,
            NodeHistory,
            where_column={"node_id": "id"},
            returning=["node_id"],
        )
        ids_needing_history = set(all_id_to_hash.id.values) - set(
            node_ids_with_history_df.node_id.values
        )
        node_history = pd.DataFrame.from_records(
            {
                "time": datetime.datetime.utcnow(),
                "node_id": id,
                "source": "ncbi_taxonomy",
                "source_details": "taxdump.tar.gz accessed Nov 8, 2022",
                "change_type": "create",
            }
            for id in ids_needing_history
        )
        chunk_insert(session, node_history, NodeHistory, sleep_seconds=sleep)

    print("done")


if __name__ == "__main__":
    main()
