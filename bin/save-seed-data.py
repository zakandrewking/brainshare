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

from db import append, concat

rhea_ids = ["10296"]

dir = dirname(realpath(__file__))
seed_dir = join(dir, "..", "seed_data")

# get environment variables from .env
load_dotenv()


@click.command()
@click.option("--connection-string", type=str, help="Select another postgres connection string")
@click.option("--supabase-url", type=str, help="Supabase URL")
@click.option("--supabase-key", type=str, help="Supabase service key")
def main(
    connection_string: Optional[str],
    supabase_url: Optional[str],
    supabase_key: Optional[str],
):
    engine = create_engine(
        connection_string or "postgresql+psycopg2://postgres:postgres@localhost:54322/postgres"
    )
    session = Session(engine)

    # NOTE: automap_base requires every table to have a primary key
    # https://docs.sqlalchemy.org/en/20/faq/ormconfiguration.html#how-do-i-map-a-table-that-has-no-primary-key
    Base = automap_base()
    Base.prepare(autoload_with=engine)
    Synonym = Base.classes.synonym

    url = supabase_url or os.environ.get("SUPABASE_URL")
    if not url:
        raise Exception("Missing environment variable SUPABASE_URL")
    key = supabase_key or os.environ.get("SUPABASE_KEY")
    if not key:
        raise Exception("Missing environment variable SUPABASE_KEY")

    supabase: Client = create_client(url, key)
    storage = supabase.storage()
    bucket = "structure_images_svg"
    storage.get_bucket(bucket)

    reactions = pd.DataFrame(columns=["hash", "name", "rhea_id"])
    stoichiometries = pd.DataFrame(
        columns=["reaction_hash", "chemical_inchi_key", "coefficient", "compartment_rule"]
    )
    chemicals = pd.DataFrame(columns=["name", "inchi", "inchi_key", "chebi_id"])

    # look up reaction
    for rhea_id in rhea_ids:
        synonym = (
            session.query(Synonym)
            .filter(and_(Synonym.source == "rhea", Synonym.value == rhea_id))
            .one()
        )
        reaction = synonym.reaction

        append(reactions, {"hash": reaction.hash, "name": reaction.name, "rhea_id": rhea_id})
        stoichiometries = concat(
            stoichiometries,
            pd.DataFrame(
                [
                    (
                        reaction.hash,
                        s.chemical.inchi_key,
                        s.coefficient,
                        s.compartment_rule,
                    )
                    for s in reaction.stoichiometry_collection
                ],
                columns=["reaction_hash", "chemical_inchi_key", "coefficient", "compartment_rule"],
            ),
        )

        chem = pd.DataFrame(
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
        chemicals = concat(chemicals, chem[["name", "inchi", "inchi_key", "chebi_id"]])

        # save SVG
        for chem in chem.itertuples():
            with open(join(seed_dir, f"{chem.inchi_key}.svg"), "wb") as f:
                f.write(storage.from_(bucket).download(f"{chem.id}.svg"))
            with open(join(seed_dir, f"{chem.inchi_key}_dark.svg"), "wb") as f:
                f.write(storage.from_(bucket).download(f"{chem.id}_dark.svg"))

    reactions.to_csv(join(seed_dir, "reactions.tsv"), index=False, sep="\t")
    stoichiometries.to_csv(join(seed_dir, "stoichiometries.tsv"), index=False, sep="\t")
    chemicals.to_csv(join(seed_dir, "chemicals.tsv"), index=False, sep="\t")


if __name__ == "__main__":
    main()
