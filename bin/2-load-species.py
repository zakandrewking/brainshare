#!/usr/bin/env python

from os.path import dirname, realpath, join
from shutil import unpack_archive
from sqlalchemy import create_engine
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from tempfile import TemporaryDirectory
from typing import Any, Optional
import click
import numpy as np
import os
import pandas as pd
import subprocess
import sys

ncbi_dir = "https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/"
ncbi_file = "taxdump.tar.gz"

dir = dirname(realpath(__file__))
data_dir = join(dir, "..", "data")

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
@click.option("--download", is_flag=True, help="Download NCBI data again")
@click.option("--load-db", is_flag=True, help="Write to the database")
@click.option("--number", type=int, help="Load the first 'number' chemicals")
@click.option("--connection-string", type=str, help="Select another postgres connection string")
@click.option("--supabase-url", type=str, help="Supabase URL")
@click.option("--supabase-key", type=str, help="Supabase service key")
def main(
    download: bool,
    load_db: bool,
    number: Optional[int],
    connection_string: Optional[str],
    supabase_url: Optional[str],
    supabase_key: Optional[str],
):
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
        names[names["class"] == "scientific name"].loc[:, ["tax_id", "name"]].set_index("tax_id")
    )

    export["names"] = names
    export["nodes"] = nodes
    export["divisions"] = divisions
    export["genetic_codes"] = genetic_codes
    export["tax_names"] = tax_names

    if load_db:

        engine = create_engine(
            connection_string or "postgresql+psycopg2://postgres:postgres@localhost:54322/postgres"
        )
        session = Session(engine)

        Base = automap_base()
        Base.prepare(autoload_with=engine)
        Species = Base.classes.species

        print("writing species to db")

        for i, (_, chunk) in enumerate(tax_names.groupby(np.arange(len(tax_names) // 1000))):
            sys.stdout.write(f"\rchunk {i + 1}")
            sys.stdout.flush()
            stmt = insert(Species).values(chunk.to_dict("records")).on_conflict_do_nothing()
            session.execute(stmt)
            session.commit()
        print("")

        session.close()

    print("done")


if __name__ == "__main__":
    main()
