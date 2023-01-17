#!/usr/bin/env python

# TODO also update reaction names and EC numbers where we have reaction matches

import gzip
import os
from os.path import dirname, realpath, join
import subprocess
from typing import Any, Optional, cast

from Bio import SeqIO  # type: ignore
import click
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session

from db import chunk_insert, append, concat


dir = dirname(realpath(__file__))
data_dir = join(dir, "..", "data")


@click.command()
@click.option("--seed-only", is_flag=True, help="Just seed a few entries")
@click.option("--download", is_flag=True, help="Download Rhea data again")
@click.option("--load-db", is_flag=True, help="Write to the database")
@click.option("--connection-string", type=str, help="Select another postgres connection string")
@click.option("--number", type=int, help="Load the first 'number' chemicals")
def main(
    seed_only: bool,
    download: bool,
    load_db: bool,
    connection_string: str,
    number: Optional[int],
):
    engine = create_engine(
        connection_string or "postgresql+psycopg2://postgres:postgres@localhost:54322/postgres"
    )
    session = Session(engine)

    # NOTE: automap_base requires every table to have a primary key
    # https://docs.sqlalchemy.org/en/20/faq/ormconfiguration.html#how-do-i-map-a-table-that-has-no-primary-key
    Base = automap_base()
    Base.prepare(autoload_with=engine)
    Protein = Base.classes.protein
    Synonym = Base.classes.synonym

    if seed_only:
        print("writing a few proteins to the DB")

        # https://www.uniprot.org/uniprotkb/A0R5M8/entry

        session.add(Protein(name="test"))
        session.commit()

    if download:
        print("deleting old files")

        try:
            os.remove(join(data_dir, "uniprot_sprot.dat.gz"))
            # uniprot_trembl.dat.gz
        except:
            pass

        print("downloading files")

        subprocess.run(
            [
                "axel",
                "https://ftp.uniprot.org/pub/databases/uniprot/current_release/knowledgebase/complete/uniprot_sprot.dat.gz",
                # https://ftp.uniprot.org/pub/databases/uniprot/current_release/knowledgebase/complete/uniprot_trembl.dat.gz
            ],
            cwd=data_dir,
        )

    if load_db:
        print("reading files")

        proteins = pd.DataFrame(columns=["sequence", "name"])
        synonyms = pd.DataFrame(columns=["source", "value"])

        with gzip.open(join(data_dir, "uniprot_sprot.dat.gz"), "r") as f:
            for record in SeqIO.parse(f, "swiss"):
                append(proteins, {"sequence": str(record.seq), "name": record.name})

        chunk_insert(session, Protein, proteins)

        chunk_insert(session, Synonym, synonyms)

    print("done")


if __name__ == "__main__":
    main()
