#!/usr/bin/env python

import os
from os.path import dirname, realpath, join

import click
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session

# get environment variables from .env
load_dotenv()

dir = dirname(realpath(__file__))
data_dir = join(dir, "..", "data")
seed_dir = join(dir, "..", "seed_data")


@click.command()
@click.option("--seed-only", is_flag=True, help="Just seed a few entries")
@click.option("--download", is_flag=True, help="Download ChEBI data again")
@click.option("--load-db", is_flag=True, help="Write to the database")
@click.option("--number", type=int, help="Load the first 'number' chemicals")
@click.option("--connection-string", type=str, help="Select another postgres connection string")
@click.option("--supabase-url", type=str, help="Supabase URL")
@click.option("--supabase-key", type=str, help="Supabase service key")
def main(
    seed_only: bool,
    download: bool,
    load_db: bool,
    number: int | None,
    connection_string: str | None,
    supabase_url: str | None,
    supabase_key: str | None,
):
    engine = create_engine(
        connection_string or "postgresql+psycopg2://postgres:postgres@localhost:54322/postgres"
    )
    session = Session(engine, future=True)  # type: ignore

    # NOTE: automap_base requires every table to have a primary key
    # https://docs.sqlalchemy.org/en/20/faq/ormconfiguration.html#how-do-i-map-a-table-that-has-no-primary-key
    Base = automap_base()
    Base.prepare(autoload_with=engine)
    Genome = Base.classes.genome
    GenomeSynonym = Base.classes.genome_synonym
    Species = Base.classes.species

    if seed_only:
        species = session.query(Species).filter(Species.id == 58396).one()
        session.add(
            Genome(
                strain_name="Escherichia coli str. K-12 substr. MG1655",
                genome_synonym_collection=[GenomeSynonym(source="ncbi_taxonomy", value="511145")],
                species=species,
            )
        )
        session.commit()

    print("done")


if __name__ == "__main__":
    main()
