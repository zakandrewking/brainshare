#!/usr/bin/env python

# TODO also update reaction names and EC numbers where we have reaction matches

from dataclasses import dataclass
import gzip
import itertools as it
import os
from os.path import dirname, realpath, join
import re
import subprocess
import sys
from typing import cast

from Bio import SeqIO  # type: ignore
import click
from dotenv import load_dotenv
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session

from db import chunk_insert, append

# get environment variables from .env
load_dotenv()


dir = dirname(realpath(__file__))
data_dir = join(dir, "..", "data")
seed_dir = join(dir, "..", "seed_data")


@dataclass
class CommentData:
    type: str  # CATALYTIC ACTIVITY, FUNCTION, MISCELLANEOUS, SUBCELLULAR LOCATION,
    #            COFACTOR, TISSUE SPECIFICITY, SIMILARITY, PATHWAY, SUBUNIT
    detail: str
    synonyms: dict[str, str]  # CHEBI, ECO, EC, PROSITE-ProRule, RHEA, PubMed


def _get_syn(detail: str) -> dict[str, str]:
    matches = re.findall(r"(?:[a-zA-Z-]+:)?([a-zA-Z-]+)(?:=|:)([a-zA-Z0-9.]+)(?:[^:=]|$)", detail)
    return {m[0]: m[1] for m in matches}


def parse_comments(comments: str | None) -> list[CommentData]:
    if not comments:
        return []
    comments = comments.replace("RHEA-   COMP", "RHEA-COMP")
    matches = re.findall(r"(?:^|\n)([A-Z ]+):\s*([^\n]+)", comments)
    return [CommentData(type=m[0], detail=m[1], synonyms=_get_syn(m[1])) for m in matches]


def _first_group(m: re.Match[str] | None) -> str | None:
    return m.group(1) if m else None


def parse_description(description: str) -> tuple[str | None, str | None]:
    name = re.search("Full=([^;]+)", description)
    short_name = re.search("Short=([^;]+)", description)
    # ignore the ec_number in RecName because it's not specific to one catalytic
    # activity, i.e.. ec_number = re.search("EC=([^;]+)", description)
    return _first_group(name), _first_group(short_name)


def parse_xrefs(xrefs: list[str]) -> dict[str, str]:
    reg = r"^(?:.+:)?(.+):\s*(.+)$"
    return {m.group(1): m.group(2) for m in (re.match(reg, x) for x in xrefs) if m}


@click.command()
@click.option("--seed-only", is_flag=True, help="Just seed a few entries")
@click.option("--download", is_flag=True, help="Download Rhea data again")
@click.option("--load-db", is_flag=True, help="Write to the database")
@click.option("--connection-string", type=str, help="Select another postgres connection string")
@click.option("--number", type=int, help="Load the first 'number' chemicals")
def main(
    seed_only: bool,
    download: bool,
    load_db: bool,
    connection_string: str,
    number: int | None,
):
    engine = create_engine(
        connection_string or "postgresql+psycopg2://postgres:postgres@localhost:54322/postgres"
    )
    session = Session(engine)

    # NOTE: automap_base requires every table to have a primary key
    # https://docs.sqlalchemy.org/en/20/faq/ormconfiguration.html#how-do-i-map-a-table-that-has-no-primary-key
    Base = automap_base()
    Base.prepare(autoload_with=engine)
    Protein = Base.classes.protein
    Synonym = Base.classes.synonym
    Species = Base.classes.species
    ProteinSpecies = Base.metadata.tables["protein_species"]

    if seed_only:
        print("writing a few proteins to the DB")
        chunk_insert(session, pd.read_table(join(seed_dir, "protein.tsv")), Protein)
        chunk_insert(
            session,
            pd.read_table(join(seed_dir, "synonym.tsv")).dropna(subset=["protein_id"]),
            Synonym,
        )
        session.commit()

    if download:
        print("deleting old files")

        try:
            os.remove(join(data_dir, "uniprot_sprot.dat.gz"))
            # uniprot_trembl.dat.gz
        except:
            pass

        print("downloading files")

        subprocess.run(
            [
                "axel",
                "https://ftp.uniprot.org/pub/databases/uniprot/current_release/knowledgebase/complete/uniprot_sprot.dat.gz",
                # https://ftp.uniprot.org/pub/databases/uniprot/current_release/knowledgebase/complete/uniprot_trembl.dat.gz
            ],
            cwd=data_dir,
        )

    if load_db:
        print("reading files")

        proteins = pd.DataFrame(columns=["sequence", "name", "short_name"])
        synonyms = pd.DataFrame(columns=["source", "value", "sequence"])
        protein_species = pd.DataFrame(columns=["ncbi_taxonomy_id", "sequence"])
        # get a bunch of new info for reactions. there will be some duplicates
        # here, which we'll have to deal with below
        reactions = pd.DataFrame(columns=["sequence", "rhea_id", "name", "short_name", "ec_number"])
        reaction_synonyms = pd.DataFrame(columns=["rhea_id", "source", "value"])

        i = 0
        with open(join(data_dir, "g3p.txt"), "r") as f:
            seq = it.islice(SeqIO.parse(f, "swiss"), 0, number)
            for record in seq:

                comments = parse_comments(record.annotations.get("comment"))
                name, short_name = parse_description(record.description)
                sequence = str(record.seq) if record.seq else None
                uniprot_id = record.id
                nbci_taxonomy_ids = record.annotations.get("ncbi_taxid", [])
                gene_names = [
                    x["Name"] for x in record.annotations.get("gene_name", []) if "Name" in x
                ]
                xrefs = parse_xrefs(record.dbxrefs)

                # just the common ones for now
                if not name or not short_name or not sequence:
                    continue

                # link to tax IDs
                for ncbi_taxonomy_id in nbci_taxonomy_ids:
                    append(
                        protein_species,
                        {"ncbi_taxonomy_id": ncbi_taxonomy_id, "sequence": sequence},
                    )

                has_rhea = False
                for comment in comments:
                    # general synonyms
                    for source, value in comment.synonyms.items():
                        if source.lower() in ["pubmed"]:
                            append(
                                synonyms,
                                {"source": source.lower(), "value": value, "sequence": sequence},
                            )
                    # reaction-specific updates
                    if comment.type == "CATALYTIC ACTIVITY":
                        rhea_id = None
                        ec_number = None
                        for source, value in comment.synonyms.items():
                            if source.lower() == "rhea":
                                has_rhea = True  # TODO link to reaction & TODO rename reaction
                                rhea_id = value
                            elif source.lower() == "ec":
                                ec_number = value
                        if rhea_id and ec_number:
                            append(
                                reaction_synonyms,
                                {"rhea_id": rhea_id, "source": "ec_number", "ec_number": ec_number},
                            )

                # only enzymes for now
                if not has_rhea:
                    continue

                i += 1
                sys.stdout.write(f"\rfound {i} proteins")
                sys.stdout.flush()

                append(proteins, {"sequence": sequence, "name": name, "short_name": short_name})
                append(synonyms, {"source": "uniprot", "value": uniprot_id, "sequence": sequence})

        print("Loading proteins")
        # sequence is the special sauce for proteins
        proteins = proteins.drop_duplicates(subset="sequence")
        print(f"{len(proteins)} proteins with unique sequences")
        # TODO hash the sequence so we can index on it and upsert
        protein_id_to_sequence = chunk_insert(
            session, proteins, Protein, returning=["id", "sequence"]
        )
        protein_id_to_sequence = protein_id_to_sequence.rename(columns={"id": "protein_id"})

        # print("Loading synonyms")
        # synonyms_to_load = (
        #     synonyms.merge(reaction_id_to_sequence, how="inner", on="sequence")
        #     .loc[:, ["protein_id", "source", "value"]]
        #     .drop_duplicates()
        # )
        # chunk_insert(session, synonyms_to_load, Synonym)

        print("Loading protein-species relationships")
        tax_id_to_species = pd.DataFrame(
            session.query(Species.id, Synonym.value)
            .join(Synonym)
            .filter(Synonym.source == "ncbi_taxonomy")
            .all(),
            columns=["species_id", "ncbi_taxonomy_id"],
        )
        protein_species_to_load = (
            protein_species.merge(protein_id_to_sequence, how="inner", on="sequence")
            .merge(tax_id_to_species, how="inner", on="ncbi_taxonomy_id")
            .loc[:, ["protein_id", "species_id"]]
        )
        chunk_insert(session, protein_species_to_load, ProteinSpecies)

    print("done")


if __name__ == "__main__":
    main()
