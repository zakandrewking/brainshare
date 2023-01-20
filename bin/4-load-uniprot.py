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
    return _first_group(name), _first_group(short_name)


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

    if seed_only:
        print("writing a few proteins to the DB")

        # https://www.uniprot.org/uniprotkb/A0R5M8/entry

        session.add(Protein(name="test"))
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
        # rels = pd.DataFrame(columns=[])

        i = 0
        with gzip.open(join(data_dir, "uniprot_sprot.dat.gz"), "r") as f:
            seq = it.islice(SeqIO.parse(f, "swiss"), 0, number)
            for record in seq:

                comments = parse_comments(record.annotations.get("comment"))
                name, short_name = parse_description(record.description)
                sequence = str(record.seq) if record.seq else None

                # just the common ones for now
                if not name or not short_name or not sequence:
                    continue

                has_rhea = False
                for comment in comments:
                    # general synonyms
                    for source, value in comment.synonyms.items():
                        if source.lower() in ["pubmed"]:
                            append(
                                synonyms,
                                {"source": source.lower(), "value": value, "sequence": sequence},
                            )
                    # TODO record.annotations.ncbi_taxid[]
                    # TODO record.annotations.gene_name[]
                    # reaction-specific updates
                    if comment.type == "CATALYTIC ACTIVITY":
                        for source, value in comment.synonyms.items():
                            if source.lower() == "rhea":
                                has_rhea = True  # TODO link to reaction & TODO rename reaction
                            elif source.lower() == "ec":
                                pass  # TODO add EC annotation to the reaction

                # only enzymes for now
                if not has_rhea:
                    continue

                i += 1
                sys.stdout.write(f"\rfound {i} proteins")
                sys.stdout.flush()

                append(proteins, {"sequence": sequence, "name": name, "short_name": short_name})
                append(synonyms, {"source": "uniprot", "value": record.id, "sequence": sequence})

        print("Loading proteins")
        # sequence is the special sauce for proteins
        proteins = proteins.drop_duplicates(subset="sequence")
        print(f"{len(proteins)} proteins with unique sequences")
        # TODO hash the sequence so we can index on it and upsert
        reaction_id_to_sequence = chunk_insert(
            session, proteins, Protein, returning=["id", "sequence"]
        )
        reaction_id_to_sequence = reaction_id_to_sequence.rename(columns={"id": "protein_id"})

        print("Loading synonyms")
        synonyms_to_load = (
            synonyms.merge(reaction_id_to_sequence, how="inner", on="sequence")
            .loc[:, ["protein_id", "source", "value"]]
            .drop_duplicates()
        )
        chunk_insert(session, synonyms_to_load, Synonym)

        # print("Loading relationships")
        # rels_to_load = rels_to_load.merge(reaction_id_to_sequence, how="inner", on="sequence").loc[
        #     :, ["protein_id", "reaction_id"]
        # ]

    print("done")


if __name__ == "__main__":
    main()
