#!/usr/bin/env python

"""Pull seed data from the database for specific reactions"""

from collections import defaultdict
import os
from os.path import dirname, realpath, join
from typing import Optional, Any

import click
import pandas as pd
from sqlalchemy import create_engine, and_
from sqlalchemy.orm import Session
from sqlalchemy.ext.automap import automap_base
from supabase import create_client, Client

# what to start with
rhea_ids = ["10300", "16654"]
uniprot_ids = ["P53429", "Q5FTU6"]
ncbi_tax_ids = ["5741", "290633"]

dir = dirname(realpath(__file__))
seed_dir = join(dir, "..", "seed_data")


class ToSave:
    _to_save: dict[str, list[Any]]

    def __init__(self) -> None:
        self._to_save = defaultdict(list)

    def add(self, obj: Any) -> None:
        self._to_save[obj.__class__.__name__].append(obj)

    def save(self) -> None:
        for type, objects in self._to_save.items():
            df = pd.DataFrame.from_records(
                [{k.key: getattr(obj, k.key) for k in obj.__table__.columns} for obj in objects]
            )
            df.to_csv(join(seed_dir, f"{type}.tsv"), sep="\t", index=False)


@click.command()
@click.option(
    "--connection-string", type=str, required=True, help="Select another postgres connection string"
)
@click.option("--supabase-url", type=str, required=True, help="Supabase URL")
@click.option("--supabase-key", type=str, required=True, help="Supabase service key")
def main(
    connection_string: str,
    supabase_url: str,
    supabase_key: str,
):
    engine = create_engine(connection_string)
    session = Session(engine, future=True)  # type: ignore

    # NOTE: automap_base requires every table to have a primary key
    # https://docs.sqlalchemy.org/en/20/faq/ormconfiguration.html#how-do-i-map-a-table-that-has-no-primary-key
    Base = automap_base()
    Base.prepare(autoload_with=engine)
    Synonym = Base.classes.synonym
    Species = Base.classes.species
    Protein = Base.classes.protein
    Reaction = Base.classes.reaction

    url = supabase_url
    key = supabase_key

    supabase: Client = create_client(url, key)
    storage = supabase.storage()
    bucket = "structure_images_svg"
    storage.get_bucket(bucket)

    to_save = ToSave()

    # drop existing SVGs
    for f in os.listdir(join(seed_dir, "structures")):
        os.remove(join(seed_dir, "structures", f))

    # look up reaction
    reactions = (
        x[1]
        for x in (
            session.query(Synonym, Reaction)
            .join(Reaction)
            .filter(and_(Synonym.source == "rhea", Synonym.value.in_(rhea_ids)))
            .all()
        )
    )
    for reaction in reactions:
        to_save.add(reaction)

        for syn in reaction.synonym_collection:
            to_save.add(syn)

        for stoich in reaction.stoichiometry_collection:
            to_save.add(stoich)
            to_save.add(stoich.chemical)
            for syn in stoich.chemical.synonym_collection:
                to_save.add(syn)

            # save SVGs
            for file_name in [f"{stoich.chemical.id}.svg", f"{stoich.chemical.id}_dark.svg"]:
                with open(join(seed_dir, "structures", file_name), "wb") as f2:
                    f2.write(storage.from_(bucket).download(file_name))

    # look up species
    species = (
        x[1]
        for x in (
            session.query(Synonym, Species)
            .join(Species)
            .filter(and_(Synonym.source == "ncbi_taxonomy", Synonym.value.in_(ncbi_tax_ids)))
            .all()
        )
    )
    for s in species:
        to_save.add(s)
        for syn in s.synonym_collection:
            to_save.add(syn)

    # look up proteins
    proteins = (
        x[1]
        for x in (
            session.query(Synonym, Protein)
            .join(Protein)
            .filter(and_(Synonym.source == "uniprot", Synonym.value.in_(uniprot_ids)))
            .all()
        )
    )
    for protein in proteins:
        to_save.add(protein)
        for syn in protein.synonym_collection:
            to_save.add(syn)

    to_save.save()


if __name__ == "__main__":
    main()
