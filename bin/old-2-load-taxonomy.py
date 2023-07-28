#!/usr/bin/env python

from os.path import dirname, realpath, join
from shutil import unpack_archive
import sys
from tempfile import TemporaryDirectory
import time
from typing import Optional

import click
import numpy as np
import os
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
import subprocess

from db import chunk_insert, concat
from hash import taxonomy_hash_fn

ncbi_dir = "https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/"
ncbi_file = "taxdump.tar.gz"

ncbi_tax_id_subset = []  # type: ignore

dir = dirname(realpath(__file__))
data_dir = join(dir, "..", "data")
seed_dir = join(dir, "..", "seed_data")


def read_dmp(filepath, column_names):
    """*.dmp files are bcp-like dump from GenBank taxonomy database."""
    return (
        pd.read_csv(filepath, sep="|", header=None)
        .iloc[:, :-1]
        .applymap(lambda x: x.strip() if isinstance(x, str) else x)
        .rename(columns={i: name for i, name in enumerate(column_names)})
    )


@click.command()
@click.option("--seed-only", is_flag=True, help="Just seed a few entries")
@click.option("--download", is_flag=True, help="Download NCBI data again")
@click.option("--load-db", is_flag=True, help="Write to the database")
@click.option("--number", type=int, help="Load the first 'number' chemicals")
@click.option("--connection-string", type=str, help="Select another postgres connection string")
@click.option("--sleep", type=int, default=1, help="Delay in seconds between chunks")
def main(
    seed_only: bool,
    download: bool,
    load_db: bool,
    number: Optional[int],
    connection_string: Optional[str],
    sleep: int,
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
    Species = Base.classes.species
    Synonym = Base.classes.synonym

    if seed_only:
        print("writing a few chemicals to the DB")
        chunk_insert(session, pd.read_table(join(seed_dir, "species.tsv")), Species)
        synonyms = pd.read_table(join(seed_dir, "synonym.tsv")).dropna(subset=["species_id"])
        chunk_insert(session, synonyms, Synonym)

        print("exiting")
        return

    if download:
        print("deleting old files")
        try:
            os.remove(join(data_dir, ncbi_file))
        except:
            pass

        print("downloading files")
        subprocess.run(
            [
                "axel",
                ncbi_dir + ncbi_file,
            ],
            cwd=data_dir,
        )

    print("reading files")

    with TemporaryDirectory() as d:
        unpack_archive(join(data_dir, ncbi_file), d)
        names = read_dmp(join(d, "names.dmp"), ["tax_id", "name", "name_unique", "class"])
        nodes = read_dmp(
            join(d, "nodes.dmp"),
            [
                "tax_id",
                "parent_tax_id",
                "rank",
                "embl_code",
                "division_id",
                "inherited_div_flag",
                "genetic_code_id",
                "inherited_GC_flag",
                "mitochondrial_genetic_code_id",
                "inherited_mgc_flag",
                "genbank_hidden_flag",
                "hidden_subtree_root_flag",
                "comments",
            ],
        )
        divisions = read_dmp(
            join(d, "division.dmp"), ["division_id", "division_cde", "division_name", "comments"]
        )
        genetic_codes = read_dmp(
            join(d, "gencode.dmp"), ["genetic_code_id", "abbreviation", "name", "cde", "starts"]
        )

    tax_names = (
        names[names["class"] == "scientific name"]
        .merge(nodes.loc[:, ["tax_id", "rank"]])
        .loc[:, ["tax_id", "name", "rank"]]
        .rename(columns={"tax_id": "ncbi_tax_id"})
    )

    # make sure ncbi_tax_id is a string, to match DB
    tax_names.ncbi_tax_id = tax_names.ncbi_tax_id.astype(str)

    # drop root
    tax_names = tax_names[tax_names.name != "root"]

    if number:
        tax_names = tax_names.iloc[:number]

    if load_db:
        print("writing species to db")
        print(
            """NOTE: this script assumes that all entries have a
              ncbi tax ID. Other entries are ignored"""
        )

        print(
            f"""

        NOTE: We're only loading a subset of these right now. Searching 2m
        species is unnecessarily slow.

        {ncbi_tax_id_subset}

        """
        )
        tax_names = tax_names[tax_names.ncbi_tax_id.isin(ncbi_tax_id_subset)]

        # first get ncbi tax IDs with species IDs to find what to update
        ncbi_tax_to_species_id = pd.DataFrame(columns=["species_id", "ncbi_taxonomy_id"])
        sleep2 = 0.2
        for i, (_, chunk) in enumerate(tax_names.groupby(np.arange(len(tax_names)) // 1000)):
            sys.stdout.write(
                f"\rchunk {i + 1}" + (f" ... sleeping {sleep2} seconds" if sleep else "")
            )
            sys.stdout.flush()
            df = pd.DataFrame(
                session.query(Species.id, Synonym.value)
                .join(Synonym)
                .filter(Synonym.source == "ncbi_taxonomy")
                .filter(Synonym.value.in_(chunk.ncbi_tax_id.values))
                .all(),
                columns=["species_id", "ncbi_taxonomy_id"],
            )
            ncbi_tax_to_species_id = concat(ncbi_tax_to_species_id, df)
            time.sleep(sleep2)
        print("")

        # create the hashes
        tax_names["hash"] = tax_names["ncbi_tax_id"].apply(taxonomy_hash_fn)

        # Insert entries for new NCBI Tax IDs
        new_tax = tax_names[
            ~tax_names.ncbi_tax_id.isin(ncbi_tax_to_species_id.ncbi_taxonomy_id.values)
        ]
        print(f"Found {len(new_tax)} new species")

        hash_to_species_id = chunk_insert(
            session,
            new_tax[["name", "rank", "hash"]],
            Species,
            returning=["id", "hash"],
            sleep=sleep,
        ).rename(columns={"id": "species_id"})
        synonyms_to_load = (
            new_tax.merge(hash_to_species_id, how="inner", on="hash")
            .loc[:, ["ncbi_tax_id", "species_id"]]
            .rename(columns={"ncbi_tax_id": "value"})
        )
        synonyms_to_load["source"] = "ncbi_taxonomy"
        chunk_insert(session, synonyms_to_load, Synonym, sleep=sleep)
        print(f"Loaded {len(new_tax)} new species and {len(synonyms_to_load)} synonyms")

        # for existing entries, update name, hash, and rank
        old_tax = tax_names[
            tax_names.ncbi_tax_id.isin(ncbi_tax_to_species_id.ncbi_taxonomy_id.values)
        ].rename(columns={"ncbi_tax_id": "ncbi_taxonomy_id"})
        print(f"Found {len(old_tax)} existing species")
        old_tax_to_load = (
            old_tax.merge(ncbi_tax_to_species_id, how="inner", on="ncbi_taxonomy_id")
            .rename(columns={"species_id": "id"})
            .loc[:, ["name", "rank", "hash", "id"]]
        )
        chunk_insert(
            session,
            old_tax_to_load,
            Species,
            upsert=True,
            index_elements=["id"],
            update=["name", "rank", "hash"],
            sleep=sleep,
        )
        print(f"Updated {len(old_tax_to_load)} species")
        # TODO once everything has a hash, we can go back to upserting based on that

    print("done")


if __name__ == "__main__":
    main()
