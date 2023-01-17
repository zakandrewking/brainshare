#!/usr/bin/env python

"""

TODO enable caching of images by setting cache-control on supabase storage

To run in Jupyter, use this first:

```
from rdkit.Chem.Draw import IPythonConsole
IPythonConsole.UninstallIPythonRenderer()
```

and this after:

```
IPythonConsole.InstallIPythonRenderer()
```

Also useful:

```
from IPython.display import SVG, display
display(SVG(svg))
```

"""

import asyncio
import gzip
import itertools as it
import os
from os.path import dirname, realpath, join
import subprocess
import sys
from typing import Any, Optional

import click
import pandas as pd
from rdkit import Chem
from sqlalchemy import create_engine, MetaData
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from storage3 import create_client, AsyncStorageClient  # type: ignore
from storage3.utils import StorageException  # type: ignore

from db import chunk_insert
from structures import save_svg, upload_svg, NoPathException

dir = dirname(realpath(__file__))
data_dir = join(dir, "..", "data")
seed_dir = join(dir, "..", "seed_data")

# for jupyter %run
export: Any = {}


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


@click.command()
@click.option("--seed-only", is_flag=True, help="Just seed a few entries")
@click.option("--download", is_flag=True, help="Download ChEBI data again")
@click.option("--load-db", is_flag=True, help="Write to the database")
@click.option("--load-svg", is_flag=True, help="Write SVG structures to storage. Needs --load-db.")
@click.option(
    "--export-all", is_flag=True, help="Read all chebi data into an export dataframe (for jupyter)"
)
@click.option("--connection-string", type=str, help="Select another postgres connection string")
@click.option("--number", type=int, help="Load the first 'number' chemicals")
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
    export_all: bool,
    number: Optional[int],
    concurrency: int,
    connection_string: Optional[str],
    supabase_url: Optional[str],
    supabase_key: Optional[str],
):
    engine = create_engine(
        connection_string or "postgresql+psycopg2://postgres:postgres@localhost:54322/postgres",
    )
    session = Session(engine)

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
    bucket = "structure_images_svg"

    # NOTE: automap_base requires every table to have a primary key
    # https://docs.sqlalchemy.org/en/20/faq/ormconfiguration.html#how-do-i-map-a-table-that-has-no-primary-key
    Base = automap_base()
    Base.prepare(autoload_with=engine)
    Chemical = Base.classes.chemical
    Synonym = Base.classes.synonym

    StorageBase = automap_base(metadata=MetaData(schema="storage"))
    StorageBase.prepare(autoload_with=engine)
    Object = StorageBase.classes.objects
    Bucket = StorageBase.classes.buckets

    if seed_only:
        print("writing a few chemicals to the DB")

        chemicals = pd.read_table(join(seed_dir, "chemicals.tsv"))
        inchi_key_to_id = chunk_insert(
            session,
            chemicals[["name", "inchi_key", "inchi"]],
            Chemical,
            upsert=True,
            index_elements=["inchi_key"],
            update=["name"],
            returning=["id", "inchi_key"],
        )
        chemicals = chemicals.merge(
            inchi_key_to_id.rename(columns={"id": "chemical_id"}), on="inchi_key"
        )
        chemicals["source"] = "chebi"
        chemicals = chemicals.rename(columns={"chebi_id": "value"})
        chunk_insert(session, chemicals[["source", "value", "chemical_id"]], Synonym)

        for t in chemicals.itertuples():
            with open(join(seed_dir, f"{t.inchi_key}.svg"), "rb") as f:
                svg = f.read()
            with open(join(seed_dir, f"{t.inchi_key}_dark.svg"), "rb") as f:
                svg_dark = f.read()

            try:
                await storage.get_bucket(bucket)
            except StorageException:
                await asyncio.sleep(1)
                await storage.create_bucket(bucket, public=True)

            await upload_svg(svg, f"{t.chemical_id}.svg", storage)
            await upload_svg(svg_dark, f"{t.chemical_id}_dark.svg", storage)

        print("exiting")
        return

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

        with gzip.open(join(data_dir, "ChEBI_complete.sdf.gz"), "rb") as f:
            # limit loading to the specified number. numbers = None means all
            suppl = it.islice(Chem.ForwardSDMolSupplier(f), 0, number)
            inchi = pd.DataFrame.from_records(filter_dict(m.GetPropsAsDict()) for m in suppl if m)

            if export_all:
                suppl = it.islice(Chem.ForwardSDMolSupplier(f), 0, number)
                chebi_all = pd.DataFrame.from_records(m.GetPropsAsDict() for m in suppl if m)
                export["chebi_all"] = chebi_all

        print("parsing & dropping duplicates")

        df_unique = inchi.drop_duplicates("chebi").drop_duplicates("inchi")

        chemicals = df_unique.loc[:, ["inchi", "inchi_key", "name"]].dropna()
        if export_all:
            export["chemicals"] = chemicals

        synonyms = df_unique.loc[:, ["inchi_key", "chebi"]].dropna()
        synonyms["source"] = "chebi"
        synonyms = synonyms.rename(
            columns={
                "chebi": "value",
            }
        )
        if export_all:
            export["synonyms"] = synonyms

        print("writing chemicals to db")

        inchi_key_to_id = chunk_insert(
            session, chemicals, Chemical, 1000, True, ["inchi_key"], ["name"], ["id", "inchi_key"]
        )

        if export_all:
            export["inchi_key_to_id"] = inchi_key_to_id

        print("writing synonyms to db")

        inchi_key_to_id["chemical_id"] = inchi_key_to_id["id"]
        synonyms_to_load = synonyms.merge(inchi_key_to_id).loc[
            :, ["source", "value", "chemical_id"]
        ]
        if export_all:
            export["synonyms_to_load"] = synonyms_to_load

        chunk_insert(session, synonyms_to_load, Synonym, 1000)

    if load_svg:
        print("saving SVG")

        if not load_db:
            inchi_key_to_id = pd.DataFrame.from_records(
                session.query(Chemical.id, Chemical.inchi_key).all(),
                columns=["chemical_id", "inchi_key"],
            )

        if export_all:
            export["inchi_key_to_id"] = inchi_key_to_id

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
            match = inchi_key_to_id[inchi_key_to_id.inchi_key == inchi_key].chemical_id
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

        with gzip.open(join(data_dir, "ChEBI_complete.sdf.gz"), "rb") as f:
            # limit loading to the specified number. numbers = None means all
            suppl = it.islice(Chem.ForwardSDMolSupplier(f), 0, number)
            errors = await semaphore_gather(concurrency, (process_supplier(m) for m in suppl), True)

    print("")

    print("done")


if __name__ == "__main__":
    main()
