#!/usr/bin/env python

from os.path import dirname, realpath, join
from sqlalchemy import create_engine, and_
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from typing import Any, Optional, cast, TypeAlias
import click
import os
import pandas as pd
import pybiopax
import subprocess
import itertools as it
import re
import hashlib

dir = dirname(realpath(__file__))
data_dir = join(dir, "..", "data")


# for jupyter %run
export: Any = {}


class StoichiometryEntry:
    inchi_key: str
    stoichiometry: float
    compartment_rule: str


def generate_hash(stoichs: list[StoichiometryEntry]):
    return hashlib.md5(
        ";".join(
            sorted(
                ",".join([s.inchi_key, "{0:.2f}".format(s.stoichiometry), s.compartment_rule])
                for s in stoichs
            )
        ).encode("utf-8")
    )


def rhea_type_to_table(rhea, class_name, num=None):
    df = pd.DataFrame.from_records(
        [
            {k: getattr(r, k) for k in r.__dir__() if not k.startswith("__") and "xml" not in k}
            for r in rhea.objects.values()
            if r.__class__.__name__ == class_name
        ]
    )
    return df.head(num) if num is not None else df


@click.command()
@click.option("--download", is_flag=True, help="Download Rhea data again")
@click.option("--load-db", is_flag=True, help="Write to the database")
@click.option(
    "--export-all", is_flag=True, help="Read all rhea data into an export dataframe (for jupyter)"
)
@click.option("--connection-string", type=str, help="Select another postgres connection string")
@click.option("--number", type=int, help="Load the first 'number' chemicals")
def main(
    download: bool,
    export_all: bool,
    load_db: bool,
    connection_string: str,
    number: Optional[int],
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

        # NOTE: automap_base requires every table to have a primary key
        # https://docs.sqlalchemy.org/en/20/faq/ormconfiguration.html#how-do-i-map-a-table-that-has-no-primary-key
        Base = automap_base()
        Base.prepare(autoload_with=engine)
        Reaction = Base.classes.reaction
        Stoichiometry = Base.classes.stoichiometry
        Synonym = Base.classes.synonym
        Chemical = Base.classes.chemical

        # get the rhea reactions
        reactions = it.islice(
            (
                obj
                for obj in rhea.objects.values()
                if obj.__class__.__name__ == "BiochemicalReaction"
            ),
            0,
            number,
        )

        # Find the chebi IDs for the reaction participants
        chebi_id_to_stoich = {}
        for reaction in reactions:
            for stoich in reaction.participant_stoichiometry:
                xrefs = stoich.physical_entity.entity_reference.xref
                chebi_xref = next(
                    (cast(str, x.id.lstrip("CHEBI:")) for x in xrefs if x.id.startswith("CHEBI:")),
                    None,
                )
                if chebi_xref:
                    chebi_ids[chebi_xref] = stoich

        # find the chemicals if they exist
        chems = (
            session.query(Synonym, Chemical)
            .join(Chemical)
            .filter(
                and_(
                    Synonym.source == "chebi_id",
                    Synonym.value.in_(chebi_ids),
                )
            )
            .all()
        )
        chem_matches = {syn.value: chem for syn, chem in chems}

        # add the chemicals to the Stoichiometry objects, skipping reaction
        # that don't have matches
        for reaction in reactions:
            # check that all the members have a chebi record in the database,
            # with an inchi_key
            stoichs: list[Any] = []
            for stoich in reaction.participant_stoichiometry:
                coefficient = float(stoich.stoichiometric_coefficient)
                try:
                    chem = chem_matches[]

            # check the reaction hash
            hash = generate_hash(stoichs)
            # if hash exists: update
            # else: insert
            name = reaction.display_name
            rhea_id = re.sub(r".*\/", "", reaction.uid)
            ec_number = reaction.e_c_number
            reaction_objects.append(
                Reaction(
                    name=name,
                    synonym_collection=[
                        Synonym(source="rhea", value=rhea_id),
                        Synonym(source="ec-number", value=ec_number),
                    ],
                    stoichiometry_collection=[
                        stoichs.append(
                            Stoichiometry(
                                coefficient=coefficient,
                                chemical=None,  # add after
                            )
                        )
                    ],
                )
            )

        export["reactions"] = reactions

        session.commit()
        session.close()

    print("done")


if __name__ == "__main__":
    main()
