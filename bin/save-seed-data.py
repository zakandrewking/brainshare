#!/usr/bin/env python

"""Pull seed data from the database for specific reactions"""

from collections import defaultdict
import os
from os.path import dirname, realpath, join
from typing import Optional, Any

import click
import pandas as pd
from sqlalchemy import and_
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.ext.automap import automap_base
from supabase import create_client, Client

# what to start with
rhea_id = "10296"
uniprot_id = "P39460"
ncbi_tax_id = "273057"

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
    session = Session(engine)

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

    # look up reaction
    _, reaction = (
        session.query(Synonym, Reaction)
        .join(Reaction)
        .filter(and_(Synonym.source == "rhea", Synonym.value == rhea_id))
        .one()
    )
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
            with open(join(seed_dir, file_name), "wb") as f:
                f.write(storage.from_(bucket).download(file_name))

    # look up species
    _, species = (
        session.query(Synonym, Species)
        .join(Species)
        .filter(and_(Synonym.source == "ncbi_taxonomy", Synonym.value == ncbi_tax_id))
        .one()
    )
    to_save.add(species)
    for syn in species.synonym_collection:
        to_save.add(syn)

    # look up proteins
    _, protein = (
        session.query(Synonym, Protein)
        .join(Protein)
        .filter(and_(Synonym.source == "uniprot", Synonym.value == uniprot_id))
        .one()
    )
    to_save.add(protein)
    for syn in protein.synonym_collection:
        to_save.add(syn)

    to_save.save()


if __name__ == "__main__":
    main()
