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
import sys

from structures import save_svg


dir = dirname(realpath(__file__))
data_dir = join(dir, "..", "data")

# for jupyter %run
export: Any = {}


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
    if seed_only:
        print("writing a few chemicals to the DB")
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

        session.add(
            Chemical(
                name="hydron",
                inchi="InChI=1S/p+1",
                inchi_key="GPRLSGONYQIRFK-UHFFFAOYSA-N",
                synonym_collection=[Synonym(source="chebi", value="15378")],
            )
        )
        session.add(
            Chemical(
                name="S-adenosyl-L-homocysteine zwitterion",
                inchi="InChI=1S/C14H20N6O5S/c15-6(14(23)24)1-2-26-3-7-9(21)10(22)13(25-7)20-5-19-8-11(16)17-4-18-12(8)20/h4-7,9-10,13,21-22H,1-3,15H2,(H,23,24)(H2,16,17,18)/t6-,7+,9+,10+,13+/m0/s1",
                inchi_key="ZJUKTBDSGOFHSH-WFMPWKQPSA-N",
                synonym_collection=[Synonym(source="chebi", value="57856")],
            )
        )
        session.add(
            Chemical(
                name="S-adenosyl-L-methionine zwitterion",
                inchi="InChI=1S/C15H22N6O5S/c1-27(3-2-7(16)15(24)25)4-8-10(22)11(23)14(26-8)21-6-20-9-12(17)18-5-19-13(9)21/h5-8,10-11,14,22-23H,2-4,16H2,1H3,(H2-,17,18,19,24,25)/p+1/t7-,8+,10+,11+,14+,27?/m0/s1",
                inchi_key="MEFKEPWMEQBLKI-AIRLBKTGSA-O",
                synonym_collection=[Synonym(source="chebi", value="59789")],
            )
        )
        session.add(
            Chemical(
                name="t1",
                inchi="t1",
                inchi_key="t1",
                synonym_collection=[Synonym(source="chebi", value="57610")],
            )
        )
        session.add(
            Chemical(
                name="t2",
                inchi="t2",
                inchi_key="t2",
                synonym_collection=[Synonym(source="chebi", value="75895")],
            )
        )
        session.commit()

        print("exiting")
        return

    if load_svg and not load_db:
        raise Exception("currently, you need to --load-db to run --load-svg")

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

    print("reading files")

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
    export["chemicals"] = chemicals

    synonyms = df_unique.loc[:, ["inchi_key", "chebi"]].dropna()
    synonyms["source"] = "chebi"
    synonyms = synonyms.rename(
        columns={
            "chebi": "value",
        }
    )
    export["synonyms"] = synonyms

    print("reading ontology")

    if load_db:

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

        print("writing chemicals to db")

        inchi_key_to_id = pd.DataFrame()

        for i, (_, chunk) in enumerate(chemicals.groupby(np.arange(len(chemicals)) // 1000)):
            sys.stdout.write(f"\rchunk {i + 1}")
            sys.stdout.flush()
            stmt = insert(Chemical).values(chunk.to_dict("records"))
            stmt = stmt.on_conflict_do_update(
                index_elements=[Chemical.inchi_key],
                set_=dict(name=stmt.excluded.name),
            ).returning(Chemical.id, Chemical.inchi_key)
            res = session.execute(stmt)
            inchi_key_to_id = pd.concat(
                [
                    inchi_key_to_id,
                    pd.DataFrame.from_records(res, columns=["chemical_id", "inchi_key"]),
                ]
            )
            session.commit()
        print("")

        if export_all:
            export["inchi_key_to_id"] = inchi_key_to_id

        print("writing synonyms to db")

        synonyms_to_load = synonyms.merge(inchi_key_to_id).loc[
            :, ["source", "value", "chemical_id"]
        ]
        export["synonyms_to_load"] = synonyms_to_load

        for i, (_, chunk) in enumerate(
            synonyms_to_load.groupby(np.arange(len(synonyms_to_load)) // 1000)
        ):
            sys.stdout.write(f"\rchunk {i + 1}")
            sys.stdout.flush()
            stmt = insert(Synonym).values(chunk.to_dict("records")).on_conflict_do_nothing()
            session.execute(stmt)
            session.commit()
        print("")

        session.close()

    if load_svg:
        print("saving SVG")

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
                id = inchi_key_to_id[inchi_key_to_id.inchi_key == inchi_key].chemical_id.iloc[0]
                save_svg(
                    m,
                    id,
                    supabase_url,
                    supabase_key,
                )

    print("done")


if __name__ == "__main__":
    main()
