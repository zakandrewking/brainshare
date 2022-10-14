#!/usr/bin/env python

import os
from os.path import dirname, realpath, join
import subprocess
import sys

import click
import pandas as pd
import numpy as np
from sqlalchemy import create_engine
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert

dir = dirname(realpath(__file__))
data_dir = join(dir, "..", "data")

# for jupyter %run
export = {}


@click.command()
@click.option("--download", is_flag=True, help="Download ChEBI data again")
@click.option("--load", is_flag=True, help="Write to the database")
def main(download: bool, load: bool):
    if download:
        print("deleting old files")

        os.remove(join(data_dir, "chebiId_inchi.tsv"))
        os.remove(join(data_dir, "names.tsv.gz"))

        print("downloading files")

        subprocess.run(
            [
                "axel",
                "https://ftp.ebi.ac.uk/pub/databases/chebi/Flat_file_tab_delimited/chebiId_inchi.tsv",
            ],
            cwd=data_dir,
        )
        subprocess.run(
            [
                "axel",
                "https://ftp.ebi.ac.uk/pub/databases/chebi/Flat_file_tab_delimited/names.tsv.gz",
            ],
            cwd=data_dir,
        )

        # TODO download with inchi keys and more
        # https://ftp.ebi.ac.uk/pub/databases/chebi/ontology/chebi_core.owl.gz

    print("reading files")

    inchi = pd.read_table(join(data_dir, "chebiId_inchi.tsv"))
    names = pd.read_table(join(data_dir, "names.tsv.gz"))
    df = inchi.merge(names, left_on="CHEBI_ID", right_on="COMPOUND_ID")

    print("parsing & dropping duplicates")

    # drop duplicate names with preference
    source_list = ["Chemical Ontology", "ChEBI", "KEGG COMPOUND", "IUPAC", "SUBMITTER"]
    for x in df.SOURCE.value_counts().index:
        if x not in source_list:
            source_list.append(x)
    df = df[df.SOURCE.isin(source_list)]
    df["SOURCE"] = df["SOURCE"].astype("category")
    df["SOURCE"] = df["SOURCE"].cat.set_categories(source_list, ordered=True)
    df.sort_values(["SOURCE"], inplace=True, ascending=True)

    df_unique = df.drop_duplicates("CHEBI_ID").drop_duplicates("InChI")

    chemicals = df_unique.loc[:, ("InChI", "NAME")].rename(
        columns={
            "InChI": "inchi",
            "NAME": "name",
        }
    )
    export["chemicals"] = chemicals

    synonyms = df_unique.loc[:, ("InChI", "CHEBI_ID")]
    synonyms["source"] = "chebi_id"
    synonyms = synonyms.rename(
        columns={
            "CHEBI_ID": "value",
            "InChI": "inchi",
        }
    )
    export["synonyms"] = synonyms

    if load:

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

        for i, (_, chunk) in enumerate(
            chemicals.groupby(np.arange(len(chemicals)) // 1000)
        ):
            sys.stdout.write(f"\rchunk {i + 1}")
            sys.stdout.flush()
            stmt = insert(Chemical).values(chunk.to_dict("records"))
            stmt = stmt.on_conflict_do_update(
                index_elements=[Chemical.inchi],
                set_=dict(name=stmt.excluded.name),
            )
            session.execute(stmt)
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

    print("done")


if __name__ == "__main__":
    main()
