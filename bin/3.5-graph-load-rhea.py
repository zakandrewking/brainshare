#!/usr/bin/env python
import pickle

import datetime
import itertools as it
import os
from os.path import dirname, realpath, join
import re
import subprocess
from typing import Any, Optional, cast, Final

import click
import pandas as pd
from pandas import DataFrame
import pybiopax
from pybiopax.biopax import BiochemicalReaction
from sqlalchemy import create_engine, and_
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import aliased, Session

from db import chunk_insert, append, concat, load_with_hash
from hash import reaction_hash_fn, synonym_hash_fn, edge_hash_fn


dir = dirname(realpath(__file__))
data_dir = join(dir, "..", "data")
seed_dir = join(dir, "..", "seed_data")


# for jupyter %run
export: Any = {}


def rhea_type_to_table(rhea, class_name, num=None):
    df = pd.DataFrame.from_records(
        [
            {k: getattr(r, k) for k in r.__dir__() if not k.startswith("__") and "xml" not in k}
            for r in rhea.objects.values()
            if r.__class__.__name__ == class_name
        ]
    )
    return df.head(num) if num is not None else df


def _extract_chebi(xrefs: Any) -> Optional[str]:
    return next(
        (cast(str, x.id.lstrip("CHEBI:")) for x in xrefs if x.id.startswith("CHEBI:")),
        None,
    )


def _flatten_rhea_object(obj: BiochemicalReaction) -> dict:
    res: dict = {
        "participant_stoichiometry": [],
        "display_name": obj.display_name,
        "uid": obj.uid,
    }
    for stoich in obj.participant_stoichiometry:
        res["participant_stoichiometry"].append(
            {
                "chebi_xref": _extract_chebi(stoich.physical_entity.entity_reference.xref),
                "stoichiometric_coefficient": stoich.stoichiometric_coefficient,
                "uid": stoich.uid,
            }  # type: ignore
        )
    return res


@click.command()
@click.option("--seed-only", is_flag=True, help="Just seed a few entries")
@click.option("--download", is_flag=True, help="Download Rhea data again")
@click.option("--load-db", is_flag=True, help="Write to the database")
@click.option("--number", type=int, help="Load the first 'number' chemicals")
@click.option("--connection-string", type=str, help="Select another postgres connection string")
@click.option("--sleep", type=float, default=0.2, help="Delay in seconds between chunks")
@click.option("--upsert", is_flag=True, help="Update existing rows")
def main(
    seed_only: bool,
    download: bool,
    load_db: bool,
    number: int | None,
    connection_string: str,
    sleep: float,
    upsert: bool,
):
    con = connection_string or os.environ.get("SUPABASE_CONNECTION_STRING")
    if not con:
        raise Exception(
            """Missing connection string. Provide SUPABASE_CONNECTION_STRING in
            a .env file or use the command-line option --connection-string"""
        )
    engine = create_engine(con)
    session = Session(engine, future=True)  # type: ignore

    # NOTE: automap_base requires every table to have a primary key
    # https://docs.sqlalchemy.org/en/20/faq/ormconfiguration.html#how-do-i-map-a-table-that-has-no-primary-key
    Base = automap_base()
    Base.prepare(autoload_with=engine)
    Node = Base.classes.node
    Edge = Base.classes.edge

    if seed_only:
        raise NotImplementedError

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

    if load_db:
        rhea_raw: list[dict]
        tmp_pickle = "tmp_rhea_raw.pickle"
        if os.path.exists(join(data_dir, tmp_pickle)):
            with open(join(data_dir, tmp_pickle), "rb") as f:
                rhea_raw = pickle.load(f)
        else:
            rhea = pybiopax.model_from_owl_gz(join(data_dir, "rhea-biopax.owl.gz"))
            rhea_raw = [
                _flatten_rhea_object(obj)
                for obj in rhea.objects.values()
                if obj.__class__.__name__ == "BiochemicalReaction"
            ]
            with open(join(data_dir, tmp_pickle), "wb") as f2:
                pickle.dump(rhea_raw, f2)

        if number:
            rhea_raw = rhea_raw[:number]

        print("loading reactions to db")

        # find the chebi IDs for the reaction participants
        chebi_list: list[str] = []
        for rhea_reaction in rhea_raw:
            for stoich in rhea_reaction["participant_stoichiometry"]:
                chebi_xref = stoich["chebi_xref"]
                if chebi_xref:
                    chebi_list.append(chebi_xref)

        # find the chemicals if they exist
        NodeSynonym = aliased(Node)
        NodeChemical = aliased(Node)
        chebi_to_chem_id_chem_hash: dict[str, tuple[int, str]] = {
            val: (id, hash)
            for val, id, hash in (
                session.query(NodeSynonym.data["value"], NodeChemical.id, NodeChemical.hash)
                .select_from(NodeSynonym)
                .join(Edge, NodeSynonym.id == Edge.destination_id)
                .join(NodeChemical, NodeChemical.id == Edge.source_id)
                .filter(
                    and_(
                        NodeSynonym.data["source"].astext == "chebi",
                        NodeSynonym.data["value"].astext.in_(chebi_list),
                    )
                )
                .all()
            )
        }

        reactions: Final[DataFrame] = pd.DataFrame(columns=["name", "hash", "previous_hash"])
        stoichiometries = pd.DataFrame(
            columns=[
                "reaction_hash",
                "chemical_id",
                "chemical_hash",
                "coefficient",
                "compartment_rule",
            ]
        )
        synonyms = pd.DataFrame(
            columns=["reaction_hash", "hash", "previous_hash", "source", "value", "inchi_key"]
        )

        # collect stoichiometry info, skipping reaction that don't have matches
        # TODO this is super slow ... maybe the pandas append/concat?
        for rhea_reaction in rhea_raw:
            # check that all the members have a chebi record in the database,
            missing_chem = False
            new_stoichiometries = pd.DataFrame(
                columns=["chemical_id", "chemical_hash", "coefficient", "compartment_rule"]
            )
            for stoich in rhea_reaction["participant_stoichiometry"]:
                chebi_xref = stoich["chebi_xref"]
                if not chebi_xref:
                    missing_chem = True
                    break
                try:
                    chemical_id, chemical_hash = chebi_to_chem_id_chem_hash[chebi_xref]
                except KeyError:
                    missing_chem = True
                    break

                coefficient = float(stoich["stoichiometric_coefficient"]) * (  # type: ignore
                    -1 if "left" in stoich["uid"] else 1  # type: ignore
                )

                append(
                    new_stoichiometries,
                    {
                        "chemical_id": chemical_id,
                        "chemical_hash": chemical_hash,
                        "coefficient": coefficient,
                        "compartment_rule": None,
                    },
                )

            if missing_chem:
                continue

            # check the reaction hash
            hash = reaction_hash_fn(new_stoichiometries)
            name = rhea_reaction["display_name"]

            # skip reaction and stoichiometries if the hash already exists in
            # our list, but continue with the synonyms
            if hash not in reactions.hash.values:
                append(
                    reactions,
                    {"name": name, "hash": hash, "previous_hash": hash},
                )
                new_stoichiometries["reaction_hash"] = hash
                stoichiometries = concat(
                    stoichiometries,
                    new_stoichiometries,
                )

            rhea_id: str = re.sub(r".*\/", "", rhea_reaction["uid"])
            append(
                synonyms,
                {
                    "source": "rhea",
                    "value": rhea_id,
                    "reaction_hash": hash,
                },
            )
        # calculate hashes
        synonyms["synonym_hash"] = synonyms.apply(
            lambda x: synonym_hash_fn(x.reaction_hash, x.source, x.value), axis=1
        )
        synonyms["synonym_edge_hash"] = synonyms.apply(
            lambda x: edge_hash_fn(x.reaction_hash, x.synonym_hash, "has_synonym"), axis=1
        )
        # we also make "previous" hashes, in case the hash function has changes
        synonyms["previous_synonym_hash"] = synonyms.synonym_hash
        synonyms["previous_synonym_edge_hash"] = synonyms.synonym_edge_hash

        print("loading reactions")
        reaction_nodes = pd.DataFrame.from_records(
            {
                "node_type_id": "reaction",
                "data": {
                    "name": row.name,
                },
                "hash": row.hash,
                "previous_hash": row.previous_hash,
            }
            for row in reactions.itertuples()
        )
        if len(reaction_nodes) == 0:
            print("No reactions found for currently loaded ChEBI chemicals")
            return
        reaction_id_to_hash = load_with_hash(session, reaction_nodes, Node, upsert, sleep)

        print("loading stoichiometry edges")
        stoichiometry_ids = stoichiometries.rename(columns={"chemical_id": "destination_id"}).merge(
            reaction_id_to_hash.rename(columns={"id": "source_id", "hash": "reaction_hash"}),
            on="reaction_hash",
            how="inner",
        )
        stoichiometry_ids["edge_hash"] = stoichiometry_ids.apply(
            lambda x: edge_hash_fn(x.reaction_hash, x.chemical_hash, "has_reaction_participant"),
            axis=1,
        )
        stoichiometry_ids["previous_edge_hash"] = stoichiometry_ids["edge_hash"]
        stoichiometry_edges = pd.DataFrame.from_records(
            {
                "source_id": row.source_id,
                "destination_id": row.destination_id,
                "relationship": "has_reaction_participant",
                "data": {
                    "coefficient": row.coefficient,
                    "compartment_rule": row.compartment_rule,
                },
                "hash": row.edge_hash,
                "previous_hash": row.previous_edge_hash,
            }
            for row in stoichiometry_ids.itertuples()
        )
        load_with_hash(session, stoichiometry_edges, Edge, upsert, sleep)

        print("loading synonyms")
        synonym_nodes = pd.DataFrame.from_records(
            {
                "node_type_id": "synonym",
                "data": {
                    "source": row.source,
                    "value": row.value,
                },
                "hash": row.synonym_hash,
                "previous_hash": row.previous_synonym_hash,
            }
            for row in synonyms.itertuples()
        )
        synonym_id_to_hash = load_with_hash(session, synonym_nodes, Node, upsert, sleep)

        print("loading synonym edges")
        synonym_ids = (
            synonym_id_to_hash.rename(columns={"id": "destination_id", "hash": "synonym_hash"})
            .merge(synonyms, on="synonym_hash", how="inner")
            .merge(
                reaction_id_to_hash.rename(columns={"hash": "reaction_hash", "id": "source_id"}),
                on="reaction_hash",
                how="inner",
            )
        )
        synonym_edges = pd.DataFrame.from_records(
            {
                "source_id": row.source_id,
                "destination_id": row.destination_id,
                "relationship": "has_synonym",
                "hash": row.synonym_edge_hash,
                "previous_hash": row.previous_synonym_edge_hash,
            }
            for row in synonym_ids.itertuples()
        )
        load_with_hash(session, synonym_edges, Edge, upsert, sleep)

    print("done")


if __name__ == "__main__":
    main()
