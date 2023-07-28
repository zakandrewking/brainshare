#!/usr/bin/env python

"""Pull seed data from the database for specific reactions"""

import asyncio
import os
import pickle
from collections import defaultdict
from os.path import dirname, join, realpath
from typing import Any, Set

import click
import pandas as pd
from sqlalchemy import and_, create_engine
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session, aliased
from storage3 import AsyncStorageClient
from storage3 import create_client as create_storage_client

# what to start with
rhea_ids = ["10300", "16654", "38566", "25277"]
uniprot_ids = ["P53429", "Q5FTU6"]
ncbi_tax_ids = ["5741", "290633", "83333", "562", "1718", "4932"]

# cAMP (chebi:17489) is conjugate acid of 3',5'-cyclic AMP(1-) (chebi:58165).
# The latter is a component in reactions, e.g. rhea:25277. We need to deal with
# these, and load common names ("cyclic AMP", "cAMP") for the right thing if
# we're going to match from literature.
chebi_ids = ["17489"]

dir = dirname(realpath(__file__))
seed_dir = join(dir, "..", "seed_data_graph")


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
            with open(join(seed_dir, f"{type}.pickle"), "wb") as f:
                pickle.dump(df, f)


@click.command()
@click.option(
    "--connection-string", type=str, required=True, help="Select another postgres connection string"
)
@click.option("--supabase-url", type=str, required=True, help="Supabase URL")
@click.option("--supabase-key", type=str, required=True, help="Supabase service key")
def main(*args, **kwargs):
    asyncio.run(async_main(*args, **kwargs))


async def async_main(
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
    Node = Base.classes.node
    Edge = Base.classes.edge

    url = supabase_url
    key = supabase_key

    storage: AsyncStorageClient = create_storage_client(
        url=f"{url}/storage/v1",
        is_async=True,
        headers={"apiKey": key, "Authorization": f"Bearer {key}"},
    )
    bucket = "structure_images_svg_graph"
    await storage.get_bucket(bucket)

    to_save = ToSave()

    # drop existing SVGs
    for f in os.listdir(join(seed_dir, "structures")):
        os.remove(join(seed_dir, "structures", f))

    # look up reactions
    NodeSynonym = aliased(Node)
    NodeReaction = aliased(Node)
    reactions = (
        x[1]
        for x in (
            session.query(NodeSynonym, NodeReaction)
            .select_from(NodeSynonym)
            .join(Edge, Edge.destination_id == NodeSynonym.id)
            .join(NodeReaction, NodeReaction.id == Edge.source_id)
            .filter(
                and_(
                    NodeSynonym.data["source"].astext == "rhea",
                    NodeSynonym.data["value"].astext.in_(rhea_ids),
                )
            )
            .all()
        )
    )
    added_chemical_ids: Set = set()
    # for reaction in reactions:
    #     to_save.add(reaction)

    #     for syn in reaction.synonym_collection:
    #         to_save.add(syn)

    #     for stoich in reaction.stoichiometry_collection:
    #         to_save.add(stoich)
    #         to_save.add(stoich.chemical)
    #         for syn in stoich.chemical.synonym_collection:
    #             to_save.add(syn)
    #         for hist in stoich.chemical.chemical_history_collection:
    #             to_save.add(hist)

    #         # skip these in the next step
    #         added_chemical_ids.add(stoich.chemical.id)

    #         # save SVGs
    #         for file_name in [f"{stoich.chemical.id}.svg", f"{stoich.chemical.id}_dark.svg"]:
    #             with open(join(seed_dir, "structures", file_name), "wb") as f2:
    #                 f2.write(await storage.from_(bucket).download(file_name))

    # look up chemicals
    NodeSynonym = aliased(Node)
    NodeChemical = aliased(Node)
    results = (
        session.query(NodeSynonym, NodeChemical, Edge)
        .select_from(NodeSynonym)
        .join(Edge, Edge.destination_id == NodeSynonym.id)
        .join(NodeChemical, NodeChemical.id == Edge.source_id)
        .filter(
            and_(
                NodeSynonym.data["source"].astext == "chebi",
                NodeSynonym.data["value"].astext.in_(chebi_ids),
            )
        )
        .all()
    )
    for synonym, chemical, edge in results:
        if chemical.id in added_chemical_ids:
            print(f"Skipping {chemical.id} because it's already in a reaction")
            continue
        to_save.add(chemical)
        to_save.add(synonym)
        to_save.add(edge)
        for hist in chemical.node_history_collection + synonym.node_history_collection:
            to_save.add(hist)
        # save SVGs
        for file_name in [f"{chemical.id}.svg", f"{chemical.id}_dark.svg"]:
            with open(join(seed_dir, "structures", file_name), "wb") as f2:
                f2.write(await storage.from_(bucket).download(file_name))

    to_save.save()


if __name__ == "__main__":
    main()
