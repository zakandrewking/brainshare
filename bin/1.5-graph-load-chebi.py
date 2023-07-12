#!/usr/bin/env python

import asyncio
import gzip
import hashlib
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
from sqlalchemy import MetaData, create_engine
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from storage3 import AsyncStorageClient, create_client
from storage3.utils import StorageException

from db import chunk_insert
from structures import NoPathException, save_svg, upload_svg

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


async def semaphore_gather(num, coros, return_exceptions=False):
    """Limit number of coroutines"""
    semaphore = asyncio.Semaphore(num)

    async def _wrap_coro(coro):
        async with semaphore:
            return await coro

    return await asyncio.gather(
        *(_wrap_coro(coro) for coro in coros), return_exceptions=return_exceptions
    )


def chemical_node_hash_fn(inchi_key: str) -> str:
    """For now, a chemical is uniquely identified by its InChIKey. For
    consistency, we generate a MD5 hash."""
    return hashlib.md5(inchi_key.encode("utf-8")).hexdigest()


@click.command()
@click.option("--seed-only", is_flag=True, help="Just seed a few entries")
@click.option("--download", is_flag=True, help="Download ChEBI data again")
@click.option("--load-db", is_flag=True, help="Write to the database")
@click.option("--load-svg", is_flag=True, help="Write SVG structures to storage. Needs --load-db.")
@click.option("--connection-string", type=str, help="Select another postgres connection string")
@click.option("--number", type=int, help="Load the first 'number' records in the Chebi dump file")
@click.option("--concurrency", type=int, default=10, help="Simultaneous connections for SVG upload")
@click.option("--supabase-url", type=str, help="Supabase URL")
@click.option("--supabase-key", type=str, help="Supabase service key")
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
):
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
    NodeType = Base.classes.node_type
    Node = Base.classes.node
    NodeHistory = Base.classes.node_history
    Edge = Base.classes.edge
    EdgeHistory = Base.classes.edge_history

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
        print("lazy loading node_types")
        # TODO upsert
        session.execute(
            insert(NodeType)
            .values(name="chemical", icon="co2", top_level=True)
            .on_conflict_do_nothing()
        )

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
                ["inchi", "inchi_key", "name", "smiles", "formula", "mass", "charge"],
            ]
            .dropna()
        )
        nodes_to_load = pd.DataFrame.from_records(
            {
                "type": "chemical",
                "data": {
                    "inchi": row.inchi,
                    "inchi_key": row.inchi_key,
                    "name": row.name,
                    "smiles": row.smiles,
                    "formula": row.formula,
                    "mass": row.mass,
                    "charge": row.charge,
                },
                "hash": chemical_node_hash_fn(row.inchi_key),
            }
            for row in chemicals_unique.itertuples()
        )
        # basic chemical node loading
        # TODO upsert
        chunk_insert(session, nodes_to_load, Node)

        print()

        # # chebi synonyms
        # chebi = df_unique.loc[:, ["inchi_key", "chebi"]].dropna()
        # chebi["source"] = "chebi"
        # chebi = chebi.rename(
        #     columns={
        #         "chebi": "value",
        #     }
        # )
        # # IUPAC names
        # iupac = df_unique.loc[:, ["inchi_key", "iupac_name"]].dropna()
        # iupac["source"] = "iupac"
        # iupac = iupac.rename(
        #     columns={
        #         "iupac_name": "value",
        #     }
        # )
        # # synonym names: pull out from list
        # synonym_names = df_unique.loc[:, ["inchi_key", "synonyms"]].dropna()
        # synonym_names["source"] = "synonym"
        # synonym_names = synonym_names.explode("synonyms").dropna()
        # synonym_names = synonym_names.rename(
        #     columns={
        #         "synonyms": "value",
        #     }
        # )
        # synonyms = pd.concat([chebi, iupac, synonym_names])

        # print("getting current chemical hashes")

        # chemical_id_to_hash = pd.DataFrame.from_records(
        #     session.query(Node.id, Node.hash).filter(Node.type == "chemical").all()
        # )

        # print()

        # TODO filter this for just the inchi_keys we need. Just synonyms for
        # today
        # old_inchi_key_to_id: Final[DataFrame] = pd.DataFrame.from_records(
        #     session.query(Chemical.inchi_key, Chemical.id)
        #     .filter(Chemical.inchi_key.in_(synonyms.inchi_key.values))
        #     .all(),
        #     columns=["inchi_key", "id"],
        # )

        # new_chemicals: Final[DataFrame] = final_chemicals[
        #     ~final_chemicals.inchi_key.isin(old_inchi_key_to_id.inchi_key.values)
        # ]

        # print(f"writing {len(new_chemicals)} chemicals to db")

        # should be empty today
        # new_inchi_key_to_id = pd.DataFrame(columns=["inchi_key", "id"])
        # new_inchi_key_to_id: Final[DataFrame] = chunk_insert(
        #     session,
        #     new_chemicals,
        #     Chemical,
        #     1000,
        #     ignore_conflicts=False,
        #     returning=["inchi_key", "id"],
        # )

        # TODO insert history just for new chemicals. for now, insert for old ones
        # because this is the first go
        # chem_history: Final[DataFrame] = old_inchi_key_to_id.copy()
        # # drop those that already have a "created" history
        # chem_history.drop(chem_history[~chem_history["change_type"].isna()].index, inplace=True)
        # chem_history["source"] = "chebi"
        # chem_history["source_details"] = "ChEBI_complete.sdf.gz accessed Dec 31, 2022"
        # chem_history["change_type"] = "create"
        # chem_history["time"] = datetime.datetime.utcnow()
        # chem_history["chemical_id"] = chem_history["id"]
        # chunk_insert(
        #     session,
        #     chem_history[["source", "source_details", "change_type", "time", "chemical_id"]],
        #     ChemicalHistory,
        #     1000,
        #     # TODO ignore existing chemical_id's
        # )

        # TODO -- for now we are just inserting
        # print("updating existing chemicals")
        # updated_inchi_key_to_id = chunk_insert(
        #     session,
        #     new_chemicals,
        #     Chemical,
        #     1000,
        #     True,
        #     ['inchi_key'],
        #     ['name']
        #     returning=["inchi_key", "id"],
        # )
        # # TODO insert history

        # TODO bring back synonyms for new chemicals
        # old_inchi_key_to_id["chemical_id"] = old_inchi_key_to_id["id"]
        # synonyms_to_load = synonyms.merge(old_inchi_key_to_id).loc[
        #     :, ["source", "value", "chemical_id"]
        # ]

        # print(f"writing {len(synonyms_to_load)} synonyms to db")

        # For now we are only appending new synonyms and ignoring conflicts
        # TODO need a better story for updating content, with and without
        # history changes (e.g. better version from same "upload" vs. new")
        # chunk_insert(session, synonyms_to_load, Synonym, 1000)

    if load_svg:
        print("saving SVG")

        if load_db:
            raise NotImplementedError

        # TODO did not load_db
        chemical_id_to_inchi_key = pd.DataFrame.from_records(
            session.query(Node.id, Node.data["inchi_key"]).filter(Node.type == "chemical").all(),
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
                await save_svg(m, id, storage)
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
