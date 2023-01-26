#!/usr/bin/env python

import hashlib
from os.path import dirname, realpath, join
from shutil import unpack_archive
from tempfile import TemporaryDirectory
from typing import Any, Optional

import click
import os
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
import subprocess

from db import chunk_insert

ncbi_dir = "https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/"
ncbi_file = "taxdump.tar.gz"

dir = dirname(realpath(__file__))
data_dir = join(dir, "..", "data")
seed_dir = join(dir, "..", "seed_data")

# for jupyter %run
export: Any = {}


def hash_tax(tax_id: int) -> str:
    return hashlib.md5(str(tax_id).encode("utf-8")).hexdigest()


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
    engine = create_engine(
        connection_string or "postgresql+psycopg2://postgres:postgres@localhost:54322/postgres"
    )
    session = Session(engine)

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

    # drop root
    tax_names = tax_names[tax_names.name != "root"]

    if number:
        tax_names = tax_names.iloc[:number]

    export["names"] = names
    export["nodes"] = nodes
    export["divisions"] = divisions
    export["genetic_codes"] = genetic_codes
    export["tax_names"] = tax_names

    if load_db:
        print("writing species to db")

        # first get ncbi tax IDs with species IDs to find what to update
        ncbi_tax_to_species_id = pd.DataFrame(
            session.query(Species.id, Synonym.value)
            .join(Synonym)
            .filter(Synonym.source == "ncbi_taxonomy")
            .all(),
            columns=["species_id", "ncbi_taxonomy_id"],
        )

        # Delete database entries that don't have a tax ID
        # TODO remove this after we make hash non-null
        broken_q = session.query(Species).filter(
            Species.id.not_in(ncbi_tax_to_species_id.species_id)
        )
        count = broken_q.count()
        if count > 0:
            raise Exception(f"Are you sure you want to delete {count} species?")
            broken_q.delete(synchronize_session=False)
            session.commit()

        tax_names["hash"] = tax_names["ncbi_tax_id"].apply(hash_tax)

        # Insert taxonomy entries for new NCBI Tax IDs
        new_tax = tax_names[
            ~tax_names.ncbi_tax_id.isin(ncbi_tax_to_species_id.ncbi_taxonomy_id.astype(int).values)
        ]
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

        # for existing entries, update name, hash, and rank
        old_tax = tax_names[
            tax_names.ncbi_tax_id.isin(ncbi_tax_to_species_id.ncbi_taxonomy_id.astype(int).values)
        ].rename(columns={"ncbi_tax_id": "ncbi_taxonomy_id"})
        old_tax.ncbi_taxonomy_id = old_tax.ncbi_taxonomy_id.astype(int)
        old_tax.ncbi_taxonomy_id = old_tax.ncbi_taxonomy_id.astype(int)
        old_tax_to_load = (
            old_tax.merge(ncbi_tax_to_species_id, how="inner", on="ncbi_taxonomy_id")
            .rename(columns={"species_id": "id"})
            .loc[:, ["name", "rank", "hash", "id"]]
        )
        chunk_insert(
            session,
            old_tax_to_load,
            Species,
            1000,
            True,
            ["id"],
            ["name", "rank", "hash"],
        )

    print("done")


if __name__ == "__main__":
    main()
