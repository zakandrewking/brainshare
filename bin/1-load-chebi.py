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

from structures import load_svg


dir = dirname(realpath(__file__))
data_dir = join(dir, "..", "data")

# for jupyter %run
export: Any = {}


@click.command()
@click.option("--download", is_flag=True, help="Download ChEBI data again")
@click.option("--load-db", is_flag=True, help="Write to the database")
@click.option(
    "--save-svg", is_flag=True, help="Save SVG structures to storage. Needs --load-db."
)
@click.option("--number", type=int, help="Load the first 'number' chemicals")
def main(download: bool, load_db: bool, save_svg: bool, number: Optional[int]):
    if save_svg and not load_db:
        raise Exception("currently, you need to --load-db to run --save-svg")

    if download:
        print("deleting old files")

        try:
            os.remove(join(data_dir, "ChEBI_complete.sdf.gz"))
        except:
            pass

        # # additional database links
        # try:
        #     os.remove(join(data_dir, "names.tsv.gz"))
        # except:
        #     pass

        print("downloading files")

        subprocess.run(
            [
                "axel",
                "https://ftp.ebi.ac.uk/pub/databases/chebi/SDF/ChEBI_complete.sdf.gz",
            ],
            cwd=data_dir,
        )
        # subprocess.run(
        #     [
        #         "axel",
        #         "https://ftp.ebi.ac.uk/pub/databases/chebi/Flat_file_tab_delimited/names.tsv.gz",
        #     ],
        #     cwd=data_dir,
        # )

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
                res["chebi_id"] = v.lstrip("CHEBI:")
        return res

    with gzip.open("data/ChEBI_complete.sdf.gz", "rb") as f:
        # limit loading to the specified number. numbers = None means all
        suppl = it.islice(Chem.ForwardSDMolSupplier(f), 0, number)
        inchi = pd.DataFrame.from_records(
            filter_dict(m.GetPropsAsDict()) for m in suppl if m
        )

    # names = pd.read_table(join(data_dir, "names.tsv.gz"))
    # df = inchi.merge(names, left_on="chebi_id", right_on="COMPOUND_ID", how="left")

    print("parsing & dropping duplicates")

    # drop duplicate names with preference
    # source_list = ["Chemical Ontology", "ChEBI", "KEGG COMPOUND", "IUPAC", "SUBMITTER"]
    # for x in df.SOURCE.value_counts().index:
    #     if x not in source_list:
    #         source_list.append(x)
    # df = df[df.SOURCE.isin(source_list)]
    # df["SOURCE"] = df["SOURCE"].astype("category")
    # df["SOURCE"] = df["SOURCE"].cat.set_categories(source_list, ordered=True)
    # df.sort_values(["SOURCE"], inplace=True, ascending=True)

    df_unique = inchi.drop_duplicates("chebi_id").drop_duplicates("inchi")

    chemicals = df_unique.loc[:, ["inchi", "name"]]
    export["chemicals"] = chemicals

    synonyms = df_unique.loc[:, ["inchi", "chebi_id"]]
    synonyms["source"] = "chebi_id"
    synonyms = synonyms.rename(
        columns={
            "chebi_id": "value",
        }
    )
    export["synonyms"] = synonyms

    if load_db:

        engine = create_engine(
            "postgresql+psycopg2://postgres:postgres@localhost:54322/postgres"
        )
        session = Session(engine)

        Base = automap_base()
        Base.prepare(autoload_with=engine)
        Chemical = Base.classes.chemical
        Synonym = Base.classes.synonym

        # drop long inchi's TODO stop when we have inchi_keys
        chemicals = chemicals[chemicals.inchi.str.len() < 2000]

        print("writing chemicals to db")

        inchi_to_id: dict[str, int] = {}

        for i, (_, chunk) in enumerate(
            chemicals.groupby(np.arange(len(chemicals)) // 1000)
        ):
            sys.stdout.write(f"\rchunk {i + 1}")
            sys.stdout.flush()
            stmt = insert(Chemical).values(chunk.to_dict("records"))
            stmt = stmt.on_conflict_do_update(
                index_elements=[Chemical.inchi],
                set_=dict(name=stmt.excluded.name),
            ).returning(Chemical.id, Chemical.inchi)
            res = session.execute(stmt)
            for id, inchi_str in res.fetchall():
                inchi_to_id[inchi_str] = id
            session.commit()
        print("")

        print("writing synonyms to db")

        res = session.query(Chemical.id, Chemical.inchi).all()
        inchi_df = pd.DataFrame(res).rename(columns={"id": "chemical_id"})
        synonyms_to_load = synonyms.merge(inchi_df)[["source", "value", "chemical_id"]]
        export["synonyms_to_load"] = synonyms_to_load

        for i, (_, chunk) in enumerate(
            synonyms_to_load.groupby(np.arange(len(synonyms_to_load)) // 1000)
        ):
            sys.stdout.write(f"\rchunk {i + 1}")
            sys.stdout.flush()
            stmt = (
                insert(Synonym)
                .values(chunk.to_dict("records"))
                .on_conflict_do_nothing()
            )
            session.execute(stmt)
            session.commit()
        print("")

        session.close()

    if save_svg:
        with gzip.open("data/ChEBI_complete.sdf.gz", "rb") as f:
            # limit loading to the specified number. numbers = None means all
            suppl = it.islice(Chem.ForwardSDMolSupplier(f), 0, number)
            for m in suppl:
                if not m:
                    continue
                try:
                    inchi_val: str = m.GetProp("InChI")
                except KeyError:
                    continue
                # get the ID
                load_svg(m, inchi_to_id[inchi_val])

        print("saving SVG")

    print("done")


if __name__ == "__main__":
    main()
