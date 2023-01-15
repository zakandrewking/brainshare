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

from os.path import dirname, realpath, join
from rdkit import Chem
from sqlalchemy import create_engine
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from typing import Any, Optional
import click
import gzip
import itertools as it
import numpy as np
import os
import pandas as pd
import subprocess

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
@click.option("--supabase-url", type=str, help="Supabase URL")
@click.option("--supabase-key", type=str, help="Supabase service key")
def main(
    seed_only: bool,
    download: bool,
    load_db: bool,
    load_svg: bool,
    export_all: bool,
    number: Optional[int],
    connection_string: Optional[str],
    supabase_url: Optional[str],
    supabase_key: Optional[str],
):
    engine = create_engine(
        connection_string or "postgresql+psycopg2://postgres:postgres@localhost:54322/postgres"
    )
    session = Session(engine)

    # NOTE: automap_base requires every table to have a primary key
    # https://docs.sqlalchemy.org/en/20/faq/ormconfiguration.html#how-do-i-map-a-table-that-has-no-primary-key
    Base = automap_base()
    Base.prepare(autoload_with=engine)
    Chemical = Base.classes.chemical
    Synonym = Base.classes.synonym

    if seed_only:
        print("writing a few chemicals to the DB")

        # NOTE: automap_base requires every table to have a primary key
        # https://docs.sqlalchemy.org/en/20/faq/ormconfiguration.html#how-do-i-map-a-table-that-has-no-primary-key
        Base = automap_base()
        Base.prepare(autoload_with=engine)
        Chemical = Base.classes.chemical
        Synonym = Base.classes.synonym

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
            upload_svg(svg, f"{t.chemical_id}.svg", supabase_url, supabase_key)
            upload_svg(svg_dark, f"{t.chemical_id}_dark.svg", supabase_url, supabase_key)

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

        session.close()

    if load_svg:
        print("saving SVG")

        if not load_db:
            inchi_key_to_id = pd.DataFrame.from_records(
                session.query(Chemical.id, Chemical.inchi_key).all(),
                columns=["chemical_id", "inchi_key"],
            )

        if export_all:
            export["inchi_key_to_id"] = inchi_key_to_id

        with gzip.open(join(data_dir, "ChEBI_complete.sdf.gz"), "rb") as f:
            # limit loading to the specified number. numbers = None means all
            suppl = it.islice(Chem.ForwardSDMolSupplier(f), 0, number)
            for m in suppl:
                if not m:
                    continue
                try:
                    # TODO use inchi key
                    inchi_key: str = m.GetProp("InChIKey")
                except KeyError:
                    continue
                # get the ID
                match = inchi_key_to_id[inchi_key_to_id.inchi_key == inchi_key].chemical_id
                if len(match) == 0:
                    # print(f"Chemical with InChI Key ${inchi_key} not found in database")
                    continue
                id = match.iloc[0]
                try:
                    save_svg(
                        m,
                        id,
                        supabase_url,
                        supabase_key,
                    )
                except NoPathException:
                    print(f"No path found in SVG for ${inchi_key}")
                    continue

    print("done")


if __name__ == "__main__":
    main()
