#!/usr/bin/env python

from os.path import dirname, realpath, join
from shutil import unpack_archive
from tempfile import TemporaryDirectory
from typing import Any, Optional

import click
from dotenv import load_dotenv
import numpy as np
import os
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
import subprocess

from db import chunk_insert

# get environment variables from .env
load_dotenv()


ncbi_dir = "https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/"
ncbi_file = "taxdump.tar.gz"

dir = dirname(realpath(__file__))
data_dir = join(dir, "..", "data")
seed_dir = join(dir, "..", "seed_data")

# for jupyter %run
export: Any = {}


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
@click.option("--download", is_flag=True, help="Download NCBI data again")
@click.option("--load-db", is_flag=True, help="Write to the database")
@click.option("--number", type=int, help="Load the first 'number' chemicals")
@click.option("--connection-string", type=str, help="Select another postgres connection string")
@click.option("--upsert", type=bool, default=True, help="Upsert, i.e. update data where possible")
@click.option("--sleep", type=int, default=1, help="Delay in seconds between chunks")
def main(
    seed_only: bool,
    download: bool,
    load_db: bool,
    number: Optional[int],
    connection_string: Optional[str],
    upsert: bool,
    sleep: int,
):
    engine = create_engine(
        connection_string or "postgresql+psycopg2://postgres:postgres@localhost:54322/postgres"
    )
    session = Session(engine)

    # NOTE: automap_base requires every table to have a primary key
    # https://docs.sqlalchemy.org/en/20/faq/ormconfiguration.html#how-do-i-map-a-table-that-has-no-primary-key
    Base = automap_base()
    Base.prepare(autoload_with=engine)
    Species = Base.classes.species

    if seed_only:
        print("writing a few chemicals to the DB")
        chunk_insert(session, pd.read_table(join(seed_dir, "species.tsv")), Species)
        print("exiting")
        return

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
        divisions = read_dmp(
            join(d, "division.dmp"), ["division_id", "division_cde", "division_name", "comments"]
        )
        genetic_codes = read_dmp(
            join(d, "gencode.dmp"), ["genetic_code_id", "abbreviation", "name", "cde", "starts"]
        )

    tax_names = (
        names[names["class"] == "scientific name"]
        .merge(nodes.loc[:, ["tax_id", "rank"]])
        .loc[:, ["tax_id", "name", "rank"]]
        .rename(columns={"tax_id": "ncbi_tax_id"})
    )

    # drop root
    tax_names = tax_names[tax_names.name != "root"]

    if number:
        tax_names = tax_names.iloc[:number]

    export["names"] = names
    export["nodes"] = nodes
    export["divisions"] = divisions
    export["genetic_codes"] = genetic_codes
    export["tax_names"] = tax_names

    if load_db:

        print("writing species to db")

        chunk_insert(
            session,
            tax_names,
            Species,
            1000,
            upsert,
            ["ncbi_tax_id"],
            ["rank", "name"],
            sleep=sleep,
        )

        session.close()

    print("done")


if __name__ == "__main__":
    main()
