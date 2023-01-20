#!/usr/bin/env python

import hashlib
import itertools as it
import os
from os.path import dirname, realpath, join
import re
import subprocess
from typing import Any, Optional, cast

import click
from dotenv import load_dotenv
import pandas as pd
import pybiopax
from sqlalchemy import create_engine, and_
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session

from db import chunk_insert, append, concat


dir = dirname(realpath(__file__))
data_dir = join(dir, "..", "data")
seed_dir = join(dir, "..", "seed_data")


# for jupyter %run
export: Any = {}


def _one_hash(stoichs: pd.DataFrame) -> str:
    return hashlib.md5(
        "/".join(
            "!".join(x)
            for x in sorted(
                (s.inchi_key, f"{s.coefficient:.2f}", s.compartment_rule or "")
                for s in stoichs.itertuples()
            )
        ).encode("utf-8")
    ).hexdigest()


def _reverse(stoichs: pd.DataFrame) -> pd.DataFrame:
    new_stoichs = stoichs.copy()
    new_stoichs["coefficient"] = -new_stoichs["coefficient"]
    return new_stoichs


def generate_hash(stoichs: pd.DataFrame) -> str:
    """Creates a deterministic reaction hash that does not specify a reaction
    direction.

    First, stoichiometries are converted to strings with two decimals places,
    and empty values (inc. None) are replace with empty strings.

    Next, a list of tuples is created like so:

    [(inchi_key, stoichiometry, compartment_rule), ...]

    This array is sorted by first element, then second, etc.

    Next, elements are joined by "!" and tuples joined by "/" to create a
    string, and the MD5 hash is calculated.

    Next a second hash is created using the same method, but with all of the
    stoichiometries reversed. This reverse hash is compared to the forward hash,
    and the first of the two in alphabetical order is returned.

    """
    forward = _one_hash(stoichs)
    reverse = _one_hash(_reverse(stoichs))
    return reverse if forward > reverse else forward


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
@click.option("--seed-only", is_flag=True, help="Just seed a few entries")
@click.option("--download", is_flag=True, help="Download Rhea data again")
@click.option("--load-db", is_flag=True, help="Write to the database")
@click.option(
    "--export-all", is_flag=True, help="Read all rhea data into an export dataframe (for jupyter)"
)
@click.option("--connection-string", type=str, help="Select another postgres connection string")
@click.option("--number", type=int, help="Load the first 'number' chemicals")
def main(
    seed_only: bool,
    download: bool,
    export_all: bool,
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
    Reaction = Base.classes.reaction
    Stoichiometry = Base.classes.stoichiometry
    Synonym = Base.classes.synonym
    Chemical = Base.classes.chemical

    if seed_only:
        print("writing a few reactions to the DB")
        chunk_insert(session, pd.read_table(join(seed_dir, "reaction.tsv")), Reaction)
        chunk_insert(session, pd.read_table(join(seed_dir, "stoichiometry.tsv")), Stoichiometry)
        chunk_insert(
            session,
            pd.read_table(join(seed_dir, "synonym.tsv")).dropna(subset=["reaction_id"]),
            Synonym,
        )
        print("exiting")
        return

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
        print("loading reactions to db")

        # get the rhea reactions
        rhea_reactions = list(  # we're gonna use this multiple times
            it.islice(
                (
                    obj
                    for obj in rhea.objects.values()
                    if obj.__class__.__name__ == "BiochemicalReaction"
                ),
                0,
                number,
            )
        )

        def extract_chebi(xrefs: Any) -> Optional[str]:
            return next(
                (cast(str, x.id.lstrip("CHEBI:")) for x in xrefs if x.id.startswith("CHEBI:")),
                None,
            )

        # find the chebi IDs for the reaction participants
        chebi_list: list[str] = []
        for rhea_reaction in rhea_reactions:
            for stoich in rhea_reaction.participant_stoichiometry:
                xrefs = stoich.physical_entity.entity_reference.xref  # type: ignore
                chebi_xref = extract_chebi(xrefs)
                if chebi_xref:
                    chebi_list.append(chebi_xref)

        # find the chemicals if they exist
        matching_chebi_to_chemical: dict[str, tuple[int, str]] = {
            val: (id, inchi_key)
            for val, id, inchi_key in (
                session.query(Synonym.value, Chemical.id, Chemical.inchi_key)
                .join(Chemical)
                .filter(and_(Synonym.source == "chebi", Synonym.value.in_(chebi_list)))
                .all()
            )
        }

        reactions = pd.DataFrame(columns=["hash", "name"])
        stoichiometries = pd.DataFrame(
            columns=["reaction_hash", "chemical_id", "coefficient", "compartment_rule"]
        )
        synonyms = pd.DataFrame(columns=["reaction_hash", "source", "value", "inchi_key"])

        # collect stoichiometry info, skipping reaction that don't have matches
        for rhea_reaction in rhea_reactions:
            # check that all the members have a chebi record in the database,
            stoichs: list = []
            missing_chem = False
            new_stoichiometries = pd.DataFrame(
                columns=["chemical_id", "coefficient", "inchi_key", "compartment_rule"]
            )
            for stoich in rhea_reaction.participant_stoichiometry:
                xrefs = stoich.physical_entity.entity_reference.xref  # type: ignore
                chebi_xref = extract_chebi(xrefs)
                if not chebi_xref:
                    missing_chem = True
                    break
                try:
                    chemical_id, inchi_key = matching_chebi_to_chemical[chebi_xref]
                except KeyError:
                    missing_chem = True
                    break

                coefficient = float(stoich.stoichiometric_coefficient) * (  # type: ignore
                    -1 if "left" in stoich.uid else 1  # type: ignore
                )

                append(
                    new_stoichiometries,
                    {
                        "chemical_id": chemical_id,
                        "coefficient": coefficient,
                        "inchi_key": inchi_key,
                        "compartment_rule": None,
                    },
                )

            if missing_chem:
                continue

            # check the reaction hash
            hash = generate_hash(new_stoichiometries)
            name = rhea_reaction.display_name

            # skip reaction and stoichiometries if the hash already exists in
            # our list, but continue with the synonyms
            if hash not in reactions["hash"].values:
                append(reactions, {"hash": hash, "name": name})
                new_stoichiometries["reaction_hash"] = hash
                stoichiometries = concat(
                    stoichiometries,
                    new_stoichiometries.loc[
                        :, ["reaction_hash", "chemical_id", "coefficient", "compartment_rule"]
                    ],
                )

            rhea_id: str = re.sub(r".*\/", "", rhea_reaction.uid)
            append(synonyms, {"source": "rhea", "value": rhea_id, "reaction_hash": hash})

        if export_all:
            export["reactions"] = reactions

        # find the reactions that already exist
        existing_hashes = [
            h
            for h in (
                session.query(Reaction.hash)
                .filter(Reaction.hash.in_(reactions["hash"].values))
                .all()
            )
        ]

        # upsert the reactions
        reaction_id_to_hash = chunk_insert(
            session,
            reactions,
            table=Reaction,
            chunk_size=1000,
            upsert=True,
            index_elements=["hash"],
            update=["name"],
            returning=["id", "hash"],
        )
        new_reaction_id_to_hash = (  # type: ignore
            reaction_id_to_hash[~reaction_id_to_hash.hash.isin(existing_hashes)]
        ).rename(columns={"id": "reaction_id", "hash": "reaction_hash"})

        # insert the synonyms filtered by just new reactions
        synonyms_to_load = synonyms.merge(
            new_reaction_id_to_hash, how="inner", on="reaction_hash"
        ).loc[:, ["reaction_id", "source", "value"]]
        chunk_insert(
            session,
            synonyms_to_load,
            table=Synonym,
            chunk_size=1000,
        )

        # insert the stoichiometries filtered by just new reactions
        stoichiometries_to_load = stoichiometries.merge(
            new_reaction_id_to_hash, how="inner", on="reaction_hash"
        ).loc[:, ["reaction_id", "chemical_id", "coefficient", "compartment_rule"]]
        chunk_insert(
            session,
            stoichiometries_to_load,
            table=Stoichiometry,
            chunk_size=1000,
        )

        session.commit()
        session.close()

    print("done")


if __name__ == "__main__":
    main()
