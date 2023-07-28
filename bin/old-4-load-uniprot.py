#!/usr/bin/env python

# TODO also update reaction names and EC numbers where we have reaction matches

from dataclasses import dataclass
import gzip
import hashlib
import itertools as it
import os
from os.path import dirname, realpath, join
import re
import subprocess
import sys
from typing import cast

from Bio import SeqIO  # type: ignore
import click
import pandas as pd
from sqlalchemy import create_engine, and_
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session

from db import chunk_insert, append

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
    return m.group(1).strip() if m else None


def parse_description(description: str) -> tuple[str | None, str | None]:
    name = re.search("Full=([^;{]+)", description)
    short_name = re.search("Short=([^;{]+)", description)
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
    session = Session(engine, future=True)  # type: ignore

    # NOTE: automap_base requires every table to have a primary key
    # https://docs.sqlalchemy.org/en/20/faq/ormconfiguration.html#how-do-i-map-a-table-that-has-no-primary-key
    Base = automap_base()
    Base.prepare(autoload_with=engine)
    Protein = Base.classes.protein
    Synonym = Base.classes.synonym
    Species = Base.classes.species
    Reaction = Base.classes.reaction
    ProteinSpecies = Base.metadata.tables["protein_species"]
    ProteinReaction = Base.metadata.tables["protein_reaction"]

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

        proteins = pd.DataFrame(columns=["sequence", "name", "short_name", "hash"])
        synonyms = pd.DataFrame(columns=["source", "value", "hash"])
        protein_species = pd.DataFrame(columns=["ncbi_taxonomy_id", "hash"])
        protein_reaction = pd.DataFrame(columns=["rhea_id", "hash"])
        # rhea did not have EC numbers in the OWl dump, so we'll get them from uniprot
        ec_numbers = pd.DataFrame(columns=["rhea_id", "ec_number"])

        i = 0
        with gzip.open(join(data_dir, "uniprot_sprot.dat.gz"), "r") as f:
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

                hash = hashlib.md5(sequence.encode("utf-8")).hexdigest()

                # link to tax IDs
                for ncbi_taxonomy_id in nbci_taxonomy_ids:
                    append(
                        protein_species,
                        {"ncbi_taxonomy_id": ncbi_taxonomy_id, "hash": hash},
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
                        # rhea_id = None
                        # ec_number = None
                        for source, value in comment.synonyms.items():
                            if source.lower() == "rhea":
                                has_rhea = True  # TODO link to reaction & TODO rename reaction
                                append(protein_reaction, {"rhea_id": value, "hash": hash})
                            #     rhea_id = value
                            # elif source.lower() == "ec":
                            #     ec_number = value
                        # if rhea_id and ec_number:
                        #     append(
                        #         reaction_synonyms,
                        #         {"rhea_id": rhea_id, "source": "ec_number", "ec_number": ec_number},
                        #     )

                # only enzymes for now
                if not has_rhea:
                    continue

                i += 1
                sys.stdout.write(f"\rfound {i} proteins")
                sys.stdout.flush()

                append(
                    proteins,
                    {"sequence": sequence, "name": name, "short_name": short_name, "hash": hash},
                )
                append(synonyms, {"source": "uniprot", "value": uniprot_id, "hash": hash})
        print("")

        print("Loading proteins")
        # sequence is the special sauce for proteins
        proteins = proteins.drop_duplicates(subset="sequence")
        print(f"{len(proteins)} proteins with unique sequences")
        protein_id_to_hash = chunk_insert(
            session,
            proteins,
            Protein,
            upsert=True,
            index_elements=["hash"],
            update=["name", "short_name"],
            returning=["id", "hash"],
        ).rename(columns={"id": "protein_id"})

        print("Loading synonyms")
        synonyms_to_load = (
            synonyms.merge(protein_id_to_hash, how="inner", on="hash")
            .loc[:, ["protein_id", "source", "value"]]
            .drop_duplicates()
        )
        chunk_insert(session, synonyms_to_load, Synonym)

        print("Loading protein-species relationships")
        tax_id_to_species = pd.DataFrame(
            session.query(Species.id, Synonym.value)
            .join(Synonym)
            .filter(
                and_(
                    Synonym.source == "ncbi_taxonomy",
                    Synonym.value.in_(protein_species.ncbi_taxonomy_id.values),
                )
            )
            .all(),
            columns=["species_id", "ncbi_taxonomy_id"],
        )
        protein_species_to_load = (
            protein_species.merge(protein_id_to_hash, how="inner", on="hash")
            .merge(tax_id_to_species, how="inner", on="ncbi_taxonomy_id")
            .loc[:, ["protein_id", "species_id"]]
        )
        chunk_insert(session, protein_species_to_load, ProteinSpecies)

        print("Loading protein-reaction relationships")
        rhea_to_reaction_id = pd.DataFrame(
            session.query(Reaction.id, Synonym.value)
            .join(Synonym)
            .filter(
                and_(Synonym.source == "rhea", Synonym.value.in_(protein_reaction.rhea_id.values))
            )
            .all(),
            columns=["reaction_id", "rhea_id"],
        )
        protein_reaction_to_load = (
            protein_reaction.merge(protein_id_to_hash, how="inner", on="hash")
            .merge(rhea_to_reaction_id, how="inner", on="rhea_id")
            .loc[:, ["protein_id", "reaction_id"]]
        )
        chunk_insert(session, protein_reaction_to_load, ProteinReaction)

    print("done")


if __name__ == "__main__":
    main()
