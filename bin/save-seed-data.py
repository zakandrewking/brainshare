#!/usr/bin/env python

"""Pull seed data from the database for specific reactions"""

from os.path import dirname, realpath, join
from typing import Optional
import click
import pandas as pd
import os

from dotenv import load_dotenv
from sqlalchemy import and_
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.ext.automap import automap_base
from supabase import create_client, Client

rhea_ids = ["10296"]

dir = dirname(realpath(__file__))
seed_dir = join(dir, "..", "seed_data")

# get environment variables from .env
load_dotenv()


@click.command()
@click.option("--connection-string", type=str, help="Select another postgres connection string")
def main(connection_string: Optional[str]):
    engine = create_engine(
        connection_string or "postgresql+psycopg2://postgres:postgres@localhost:54322/postgres"
    )
    session = Session(engine)

    # NOTE: automap_base requires every table to have a primary key
    # https://docs.sqlalchemy.org/en/20/faq/ormconfiguration.html#how-do-i-map-a-table-that-has-no-primary-key
    Base = automap_base()
    Base.prepare(autoload_with=engine)
    Chemical = Base.classes.chemical
    Synonym = Base.classes.synonym
    Reaction = Base.classes.reaction

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    supabase: Client = create_client(url, key)
    storage = supabase.storage()
    bucket = "structure_images_svg"
    storage.get_bucket(bucket)

    # look up reaction
    for rhea_id in rhea_ids:
        synonym = (
            session.query(Synonym)
            .filter(and_(Synonym.source == "rhea", Synonym.value == rhea_id))
            .one()
        )
        reaction = synonym.reaction
        chemicals = pd.DataFrame(
            [
                (
                    s.chemical.name,
                    s.chemical.inchi,
                    s.chemical.inchi_key,
                    next(x.value for x in s.chemical.synonym_collection if x.source == "chebi"),
                    s.chemical.id,
                )
                for s in reaction.stoichiometry_collection
            ],
            columns=["name", "inchi", "inchi_key", "chebi_id", "id"],
        )
        chemicals[["name", "inchi", "inchi_key", "chebi_id"]].to_csv(
            join(seed_dir, "chemicals.tsv"), mode="a", index=False, header=False, sep="\t"
        )
        # save SVG
        for chem in chemicals.itertuples():
            with open(join(seed_dir, f"{chem.inchi_key}.svg"), "wb") as f:
                f.write(storage.from_(bucket).download(f"{chem.id}.svg"))
            with open(join(seed_dir, f"{chem.inchi_key}_dark.svg"), "wb") as f:
                f.write(storage.from_(bucket).download(f"{chem.id}_dark.svg"))


if __name__ == "__main__":
    main()
