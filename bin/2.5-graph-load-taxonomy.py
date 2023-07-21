#!/usr/bin/env python


import asyncio
import os
import pickle
import subprocess
from os.path import dirname, join, realpath
from shutil import unpack_archive
from tempfile import TemporaryDirectory

import click
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import MetaData, create_engine
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session

from db import chunk_insert
from hash import taxonomy_hash_fn, synonym_hash_fn

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
@click.option("--sleep", type=int, default=1, help="Delay in seconds between chunks")
def main(*args, **kwargs):
    asyncio.run(async_main(*args, **kwargs))


async def async_main(
    seed_only: bool,
    download: bool,
    load_db: bool,
    number: int | None,
    connection_string: str | None,
    sleep: int,
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
    NodeType = Base.classes.node_type
    Definition = Base.classes.definition
    Node = Base.classes.node
    Edge = Base.classes.edge

    StorageBase = automap_base(metadata=MetaData(schema="storage"))
    StorageBase.prepare(autoload_with=engine)
    Object = StorageBase.classes.objects
    Bucket = StorageBase.classes.buckets

    if seed_only:
        raise NotImplementedError()

    if download:
        print("deleting old files")
        try:
            os.remove(join(data_dir, "GCF_000005845.2_ASM584v2_genomic.gbff.gz"))
        except:
            pass

        print("downloading files")
        subprocess.run(
            [
                "axel",
                "https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/000/005/845/GCF_000005845.2_ASM584v2/GCF_000005845.2_ASM584v2_genomic.gbff.gz",
            ],
            cwd=data_dir,
        )

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

    print("reading files")

    from io import BufferedReader

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
            with open(join(data_dir, tmp_pickle), "wb") as f:
                pickle.dump(taxonomy_raw, f)

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

    if load_db:
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

        print("loading taxonomy nodes")
        tax_nodes_to_load = pd.DataFrame.from_records(
            {
                "node_type_id": "taxonomy",
                "data": {
                    "name": row.name,
                    "rank": row.rank,
                },
                "hash": row.taxonomy_hash,
            }
            for row in tax_names.itertuples()
        )
        taxonomy_id_to_hash = chunk_insert(
            session, tax_nodes_to_load, Node, returning=["id", "hash"]
        )

        print("loading synonyms")
        synonym_nodes_to_load = pd.DataFrame.from_records(
            {
                "node_type_id": "synonym",
                "data": {
                    "source": "ncbi_taxonomy",
                    "value": row.ncbi_tax_id,
                },
                "hash": row.synonym_hash,
            }
            for row in tax_names.itertuples()
        )
        synonym_id_to_hash = chunk_insert(
            session, synonym_nodes_to_load, Node, returning=["id", "hash"]
        )
        edges_to_load = (
            synonym_id_to_hash.rename(columns={"id": "destination_id", "hash": "synonym_hash"})
            .merge(tax_names, on="synonym_hash", how="inner")
            .merge(
                taxonomy_id_to_hash.rename(columns={"hash": "taxonomy_hash", "id": "source_id"}),
                on="taxonomy_hash",
                how="inner",
            )
            .loc[:, ["source_id", "destination_id"]]
        )
        chunk_insert(session, edges_to_load, Edge)

        print("loading taxonomy edges")
        parent_edges_to_load = (
            taxonomy_id_to_hash.rename(columns={"id": "source_id", "hash": "taxonomy_hash"})
            .merge(tax_names, on="taxonomy_hash", how="inner")
            .merge(
                taxonomy_id_to_hash.rename(columns={"hash": "parent_hash", "id": "destination_id"}),
                on="parent_hash",
                how="inner",
            )
            .loc[:, ["source_id", "destination_id"]]
        )
        parent_edges_to_load["data"] = {"relationship": "is_child_of"}
        chunk_insert(session, parent_edges_to_load, Edge)

    print("done")


if __name__ == "__main__":
    main()
