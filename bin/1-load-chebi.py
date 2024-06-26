#!/usr/bin/env python

import asyncio
import datetime
import gzip
import itertools as it
import os
import pickle
import subprocess
import sys
from os.path import dirname, join, realpath
from typing import Any, Final

import click
import pandas as pd
from dotenv import load_dotenv
from pandas import DataFrame
from rdkit import Chem
from sqlalchemy import MetaData, create_engine, or_
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from storage3 import AsyncStorageClient, create_client
from storage3.utils import StorageException
from pytz import UTC

from db import chunk_insert, chunk_select, load_with_hash, semaphore_gather
from hash import chemical_hash_fn, edge_hash_fn, synonym_hash_fn
from structures import NoPathException, save_svg

# get environment variables from .env
load_dotenv()


dir = dirname(realpath(__file__))
data_dir = join(dir, "..", "data")
seed_dir = join(dir, "..", "seed_data")


def _try_get_synonyms(v: Any) -> list[str]:
    """Expects input to be a string with newlines separating synonyms"""
    try:
        return [x.strip() for x in v.split("\n")]
    except:
        print(f"Could not parse Synonyms: {v}")
        return []


def filter_dict(d):
    res = {}
    for k, v in d.items():
        if k == "InChI":
            res["inchi"] = v
        if k == "InChIKey":
            res["inchi_key"] = v
        if k == "ChEBI Name":
            res["name"] = v
        if k == "ChEBI ID":
            res["chebi"] = v.lstrip("CHEBI:")
        if k == "SMILES":
            res["smiles"] = v
        if k == "Formulae":
            res["formula"] = v
        if k == "Charge":
            res["charge"] = v
        if k == "Mass":
            res["mass"] = v
        if k == "IUPAC Names":
            res["iupac_name"] = v
        if k == "Synonyms":
            res["synonyms"] = _try_get_synonyms(v)
    return res


@click.command()
@click.option("--seed-only", is_flag=True, help="Just seed a few entries")
@click.option("--download", is_flag=True, help="Download ChEBI data again")
@click.option("--load-db", is_flag=True, help="Write to the database")
@click.option("--load-svg", is_flag=True, help="Write SVG structures to storage.")
@click.option("--connection-string", type=str, help="Select another postgres connection string")
@click.option("--number", type=int, help="Load the first 'number' records in the Chebi dump file")
@click.option("--concurrency", type=int, default=10, help="Simultaneous connections for SVG upload")
@click.option("--supabase-url", type=str, help="Supabase URL")
@click.option("--supabase-key", type=str, help="Supabase service key")
@click.option("--upsert", is_flag=True, help="Update existing rows")
def main(*args, **kwargs):
    asyncio.run(async_main(*args, **kwargs))


async def async_main(
    seed_only: bool,
    download: bool,
    load_db: bool,
    load_svg: bool,
    number: int | None,
    concurrency: int,
    connection_string: str | None,
    supabase_url: str | None,
    supabase_key: str | None,
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

    url = supabase_url or os.environ.get("SUPABASE_URL")
    if not url:
        raise Exception("Missing environment variable SUPABASE_URL")
    key = supabase_key or os.environ.get("SUPABASE_KEY")
    if not key:
        raise Exception("Missing environment variable SUPABASE_KEY")

    storage: AsyncStorageClient = create_client(
        url=f"{url}/storage/v1",
        is_async=True,
        headers={"apiKey": key, "Authorization": f"Bearer {key}"},
    )
    bucket = "structure_images_svg_graph"

    # NOTE: automap_base requires every table to have a primary key
    # https://docs.sqlalchemy.org/en/20/faq/ormconfiguration.html#how-do-i-map-a-table-that-has-no-primary-key
    Base = automap_base()
    Base.prepare(autoload_with=engine)
    Node = Base.classes.node
    Edge = Base.classes.edge
    NodeHistory = Base.classes.node_history

    StorageBase = automap_base(metadata=MetaData(schema="storage"))
    StorageBase.prepare(autoload_with=engine)
    Object = StorageBase.classes.objects
    Bucket = StorageBase.classes.buckets

    if load_svg or seed_only:
        try:
            await storage.get_bucket(bucket)
        except StorageException:
            await asyncio.sleep(1)
            await storage.create_bucket(bucket, public=True)

    if seed_only:
        raise NotImplementedError()

    if download:
        print("deleting old files")

        try:
            os.remove(join(data_dir, "ChEBI_complete.sdf.gz"))
        except:
            pass

        print("downloading files")

        subprocess.run(
            [
                "axel",
                "https://ftp.ebi.ac.uk/pub/databases/chebi/SDF/ChEBI_complete.sdf.gz",
            ],
            cwd=data_dir,
        )

    if load_db:
        print("reading files")

        chebi_raw: list[dict[Any, Any]]
        tmp_pickle = "tmp_chebi_raw.pickle"
        if os.path.exists(join(data_dir, tmp_pickle)):
            with open(join(data_dir, tmp_pickle), "rb") as f3:
                chebi_raw = pickle.load(f3)
        else:
            with gzip.open(join(data_dir, "ChEBI_complete.sdf.gz"), "rb") as f2:
                # limit loading to the specified number. numbers = None means all
                suppl = Chem.ForwardSDMolSupplier(f2)
                chebi_raw = [m.GetPropsAsDict() for m in suppl if m]
            with open(join(data_dir, tmp_pickle), "wb") as f4:
                pickle.dump(chebi_raw, f4)

        # TODO all parsing should follow this pattern of first parsing into a
        # format that's easy to serialize and read sequentially/in parallel,
        # then normalize into dataframes, then load. Doesn't really matter if
        # those steps are save to disk or DB.

        chemicals = pd.DataFrame.from_records(
            filter_dict(x) for x in it.islice(chebi_raw, 0, number)
        )

        print("dropping duplicates & nans")

        chemicals_unique: Final[DataFrame] = (
            chemicals.drop_duplicates("chebi")
            .drop_duplicates("inchi_key")
            .drop_duplicates("inchi")
            # these are the requires columns
            .loc[
                :,
                [
                    "inchi",
                    "inchi_key",
                    "name",
                    "smiles",
                    "formula",
                    "mass",
                    "charge",
                    "chebi",
                    "iupac_name",
                    "synonyms",
                ],
            ]
            .dropna()
        )

        # calculate hashes
        chemicals_unique["hash"] = chemicals_unique.inchi_key.apply(chemical_hash_fn)

        # we also make "previous" hashes, in case the hash function has changes
        chemicals_unique["previous_hash"] = chemicals_unique.hash

        print("loading chemicals")
        chemical_nodes = pd.DataFrame.from_records(
            {
                "node_type_id": "chemical",
                "data": {
                    "inchi": row.inchi,
                    "inchi_key": row.inchi_key,
                    "name": row.name,
                    "smiles": row.smiles,
                    "formula": row.formula,
                    "mass": row.mass,
                    "charge": row.charge,
                },
                "hash": row.hash,
                "previous_hash": row.previous_hash,
            }
            for row in chemicals_unique.itertuples()
        )
        chemical_id_to_hash = load_with_hash(session, chemical_nodes, Node, upsert)

        # Create synonym dataframes

        # chebi synonyms
        chebi = chemicals_unique.loc[:, ["inchi_key", "chebi"]].dropna()
        chebi["source"] = "chebi"
        chebi = chebi.rename(
            columns={
                "chebi": "value",
            }
        )
        # IUPAC names
        iupac = chemicals_unique.loc[:, ["inchi_key", "iupac_name"]].dropna()
        iupac["source"] = "iupac"
        iupac = iupac.rename(
            columns={
                "iupac_name": "value",
            }
        )
        # synonym names: pull out from list
        synonym_names = chemicals_unique.loc[:, ["inchi_key", "synonyms"]].dropna()
        synonym_names["source"] = "synonym"
        synonym_names = synonym_names.explode("synonyms").dropna()
        synonym_names = synonym_names.rename(
            columns={
                "synonyms": "value",
            }
        )
        synonyms = pd.concat([chebi, iupac, synonym_names])

        # calculate hashes
        synonyms["chemical_hash"] = synonyms.inchi_key.apply(chemical_hash_fn)
        synonyms["synonym_hash"] = synonyms.apply(
            lambda x: synonym_hash_fn(x.chemical_hash, x.source, x.value), axis=1
        )
        synonyms["synonym_edge_hash"] = synonyms.apply(
            lambda x: edge_hash_fn(x.chemical_hash, x.synonym_hash, "has_synonym"), axis=1
        )

        # we also make "previous" hashes, in case the hash function has changes
        synonyms["previous_synonym_hash"] = synonyms.synonym_hash
        synonyms["previous_synonym_edge_hash"] = synonyms.synonym_edge_hash

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
        synonym_id_to_hash = load_with_hash(session, synonym_nodes, Node, upsert)

        print("loading synonym edges")
        synonym_ids = (
            synonym_id_to_hash.rename(columns={"id": "destination_id", "hash": "synonym_hash"})
            .merge(synonyms, on="synonym_hash", how="inner")
            .merge(
                chemical_id_to_hash.rename(columns={"hash": "chemical_hash", "id": "source_id"}),
                on="chemical_hash",
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
        all_id_to_hash = pd.concat([chemical_id_to_hash, synonym_id_to_hash])
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
                "source": "chebi",
                "source_details": "ChEBI_complete.sdf.gz accessed Dec 31, 2022",
                "change_type": "create",
            }
            for id in ids_needing_history
        )
        chunk_insert(session, node_history, NodeHistory)

    if load_svg:
        print("saving SVG")

        chemical_id_to_inchi_key = pd.DataFrame.from_records(
            session.query(Node.id, Node.data["inchi_key"])
            .filter(Node.node_type_id == "chemical")
            .all(),
            columns=["chemical_id", "inchi_key"],
        )

        # find existing files
        files = [
            x[0]
            for x in session.query(Object.name).join(Bucket).filter(Bucket.name == bucket).all()
        ]

        async def process_supplier(m):
            if not m:
                return
            try:
                inchi_key = m.GetProp("InChIKey")
            except KeyError:
                return

            # get the ID
            match = chemical_id_to_inchi_key[
                chemical_id_to_inchi_key.inchi_key == inchi_key
            ].chemical_id
            if len(match) == 0:
                return
            id = match.iloc[0]

            # see if it exists
            if f"{id}.svg" in files and f"{id}_dark.svg" in files:
                sys.stdout.write(f"\rsvg {id} already exists")
                sys.stdout.flush()
                return
            sys.stdout.write(f"\rsvg {id}               ")
            sys.stdout.flush()

            try:
                await save_svg(m, id, storage, bucket)
            except NoPathException:
                print(f"No path found in SVG for ${inchi_key}")
                return

        with gzip.open(join(data_dir, "ChEBI_complete.sdf.gz"), "rb") as f2:
            # limit loading to the specified number. numbers = None means all
            suppl = it.islice(Chem.ForwardSDMolSupplier(f2), 0, number)
            errors = await semaphore_gather(concurrency, (process_supplier(m) for m in suppl), True)

    print("done")


if __name__ == "__main__":
    main()
