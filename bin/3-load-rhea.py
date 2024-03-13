#!/usr/bin/env python

import datetime
import os
import pickle
import re
import subprocess
import sys
from os.path import dirname, join, realpath
from typing import Any, Optional, cast

import click
import numpy as np
import pandas as pd
import pybiopax
from pybiopax.biopax import BiochemicalReaction
from sqlalchemy import and_, create_engine, Table, Column, Integer
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session, aliased
from pytz import UTC

from db import chunk_insert, chunk_select, concat, load_with_hash
from hash import edge_hash_fn, reaction_hash_fn, synonym_hash_fn

dir = dirname(realpath(__file__))
data_dir = join(dir, "..", "data")


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
@click.option("--download", is_flag=True, help="Download Rhea data again")
@click.option("--load-db", is_flag=True, help="Write to the database")
@click.option("--number", type=int, help="Load the first 'number' chemicals")
@click.option("--connection-string", type=str, help="Select another postgres connection string")
@click.option("--upsert", is_flag=True, help="Update existing rows")
def main(
    download: bool,
    load_db: bool,
    number: int | None,
    connection_string: str,
    upsert: bool,
):
    print("creating database session")
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
    # https://stackoverflow.com/a/61939524
    Table(
        "node_search",
        Base.metadata,
        Column("id", Integer, primary_key=True),
        autoload=True,
        autoload_with=engine,
    )
    Base.prepare(autoload_with=engine)
    Node = Base.classes.node
    Edge = Base.classes.edge
    NodeHistory = Base.classes.node_history
    NodeSearch = Base.classes.node_search

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
        print("reading files")

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

        print("loading reactions")

        # find the chebi IDs for the reaction participants
        chebi_ids = []
        for rhea_reaction in rhea_raw:
            for stoich in rhea_reaction["participant_stoichiometry"]:
                chebi_xref = stoich["chebi_xref"]
                if chebi_xref:
                    chebi_ids.append(chebi_xref)
        chebi_ids_df = pd.DataFrame(chebi_ids, columns=["chebi_id"])

        # find the chemicals if they exist
        chebi_to_chem_id_chem_hash: dict[str, tuple[int, str]] = {}
        chunk_size = 1000
        sleep_seconds = 0.2
        for i, (_, chunk) in enumerate(
            chebi_ids_df.groupby(np.arange(len(chebi_ids_df)) // chunk_size)
        ):
            sys.stdout.write(
                f"\rselecting chunk {i + 1}"
                + (f" ... sleeping {sleep_seconds} seconds" if sleep_seconds else "")
            )
            sys.stdout.flush()
            query = (
                session.query(NodeSearch.value, Node.id, Node.hash)
                .select_from(NodeSearch)
                .join(Node, Node.id == NodeSearch.id)
                .where(
                    and_(NodeSearch.source == "chebi", NodeSearch.value.in_(chunk.chebi_id.values)),
                )
            )
            res = query.all()
            for val, chem_id, chem_hash in res:
                chebi_to_chem_id_chem_hash[val] = (chem_id, chem_hash)

        hash_to_reaction = {}
        stoichiometries = pd.DataFrame(
            columns=[
                "reaction_hash",
                "chemical_id",
                "chemical_hash",
                "coefficient",
                "compartment_rule",
            ]
        )
        synonyms = []

        # collect stoichiometry info, skipping reaction that don't have matches
        for rhea_reaction in rhea_raw:
            # check that all the members have a chebi record in the database,
            missing_chem = False
            new_stoichiometries = []
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

                new_stoichiometries.append(
                    {
                        "chemical_id": chemical_id,
                        "chemical_hash": chemical_hash,
                        "coefficient": coefficient,
                        "compartment_rule": None,
                    },
                )
            new_stoichiometries_df = pd.DataFrame.from_records(new_stoichiometries)

            if missing_chem:
                continue

            # check the reaction hash
            hash = reaction_hash_fn(new_stoichiometries_df)
            name = rhea_reaction["display_name"]

            # skip reaction and stoichiometries if the hash already exists in
            # our list, but continue with the synonyms
            if hash not in hash_to_reaction:
                hash_to_reaction[hash] = {"name": name, "hash": hash, "previous_hash": hash}
                new_stoichiometries_df["reaction_hash"] = hash
                stoichiometries = concat(
                    stoichiometries,
                    new_stoichiometries_df,
                )

            rhea_id: str = re.sub(r".*\/", "", rhea_reaction["uid"])
            synonyms.append(
                {
                    "source": "rhea",
                    "value": rhea_id,
                    "reaction_hash": hash,
                }
            )
        reactions_df = pd.DataFrame.from_records(list(hash_to_reaction.values()))
        synonyms_df = pd.DataFrame.from_records(synonyms)

        # calculate hashes
        synonyms_df["synonym_hash"] = synonyms_df.apply(
            lambda x: synonym_hash_fn(x.reaction_hash, x.source, x.value), axis=1
        )
        synonyms_df["synonym_edge_hash"] = synonyms_df.apply(
            lambda x: edge_hash_fn(x.reaction_hash, x.synonym_hash, "has_synonym"), axis=1
        )
        # we also make "previous" hashes, in case the hash function has changes
        synonyms_df["previous_synonym_hash"] = synonyms_df.synonym_hash
        synonyms_df["previous_synonym_edge_hash"] = synonyms_df.synonym_edge_hash

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
            for row in reactions_df.itertuples()
        )
        if len(reaction_nodes) == 0:
            print("No reactions found for currently loaded ChEBI chemicals")
            return
        reaction_id_to_hash = load_with_hash(session, reaction_nodes, Node, upsert)

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
        load_with_hash(session, stoichiometry_edges, Edge, upsert)

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
            for row in synonyms_df.itertuples()
        )
        synonym_id_to_hash = load_with_hash(session, synonym_nodes, Node, upsert)

        print("loading synonym edges")
        synonym_ids = (
            synonym_id_to_hash.rename(columns={"id": "destination_id", "hash": "synonym_hash"})
            .merge(synonyms_df, on="synonym_hash", how="inner")
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
        load_with_hash(session, synonym_edges, Edge, upsert)

        print("loading history")
        all_id_to_hash = pd.concat([reaction_id_to_hash, synonym_id_to_hash])
        node_ids_with_history_df = chunk_select(
            session,
            all_id_to_hash,
            NodeHistory,
            where_column={"node_id": "id"},
            returning=["node_id"],
        )
        ids_needing_history = set(all_id_to_hash.id.values) - set(
            node_ids_with_history_df.node_id.values
        )
        node_history = pd.DataFrame.from_records(
            {
                "time": datetime.datetime.now(UTC),
                "node_id": id,
                "source": "rhea",
                "source_details": "rhea-biopax.owl.gz accessed Dec 12, 2022",
                "change_type": "create",
            }
            for id in ids_needing_history
        )
        chunk_insert(session, node_history, NodeHistory)

    print("done")


if __name__ == "__main__":
    main()
