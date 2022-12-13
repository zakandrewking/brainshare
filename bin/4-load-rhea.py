#!/usr/bin/env python

from os.path import dirname, realpath, join
from sqlalchemy import create_engine
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from typing import Any
import click
import os
import pandas as pd
import pybiopax
import re
import subprocess

dir = dirname(realpath(__file__))
data_dir = join(dir, "..", "data")


# for jupyter %run
export: Any = {}


@click.command()
@click.option("--download", is_flag=True, help="Download Rhea data again")
@click.option("--load-db", is_flag=True, help="Write to the database")
@click.option(
    "--export-all", is_flag=True, help="Read all rhea data into an export dataframe (for jupyter)"
)
@click.option("--connection-string", type=str, help="Select another postgres connection string")
def main(
    download: bool,
    export_all: bool,
    load_db: bool,
    connection_string: str,
):
    if download:
        print("deleting old files")

        try:
            os.remove(join(data_dir, "rhea-biopax.owl.gz"))
        except:
            pass

        print("downloading files")

        subprocess.run(
            ["axel", "https://ftp.expasy.org/databases/rhea/biopax/rhea-biopax.owl.gz"],
            cwd=data_dir,
        )

    rhea = pybiopax.model_from_owl_gz(join(data_dir, "rhea-biopax.owl.gz"))
    if export_all:
        export["rhea"] = rhea

    if load_db:

        engine = create_engine(
            connection_string or "postgresql+psycopg2://postgres:postgres@localhost:54322/postgres"
        )
        session = Session(engine)

        Base = automap_base()
        Base.prepare(autoload_with=engine)
        Reaction = Base.classes.reaction
        ReactionStoichiometry = Base.classes.reaction_stoichiometry

        reactions = [
            obj for obj in rhea.objects.values() if obj.__class__.__name__ == "BiochemicalReaction"
        ]
        reaction_objects = [
            Reaction(
                name=r.display_name, rhea_id=re.sub(r".*\/", "", r.uid), ec_number=r.e_c_number
            )
            for r in reactions
        ]

        # TODO deal with
        # .participant_stoichiometry
        # reactions[0].participant_stoichiometry[0].stoichiometric_coefficient
        # reactions[0].participant_stoichiometry[0].physical_entity
        # chemicals = [obj for obj in rhea.objects.values() if obj.__class__.__name__ == 'SmallMolecule']
        # .display_name
        # SmallMoleculeReference .xref = CHEBI
        # mol[500].entity_reference.xref[0].id


if __name__ == "__main__":
    main()
