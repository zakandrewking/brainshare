#!/usr/bin/env python

# TODO also update reaction names and EC numbers where we have reaction matches

from dataclasses import dataclass
import gzip
import itertools as it
import os
from os.path import dirname, realpath, join
import re
import subprocess
from typing import Any, Optional, cast

from Bio import SeqIO  # type: ignore
import click
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session

from db import chunk_insert, append, concat


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


def parse_comments(comments: Optional[str]) -> list[CommentData]:
    if not comments:
        return []
    comments = comments.replace("RHEA-   COMP", "RHEA-COMP")
    matches = re.findall(r"(?:^|\n)([A-Z ]+):\s*([^\n]+)", comments)
    return [CommentData(type=m[0], detail=m[1], synonyms=_get_syn(m[1])) for m in matches]


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
    number: Optional[int],
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

        proteins = pd.DataFrame(columns=["sequence", "name"])
        synonyms = pd.DataFrame(columns=["source", "value", "uniprot_id"])

        with open(join(data_dir, "g3p.txt"), "r") as f:
            seq = it.islice(SeqIO.parse(f, "swiss"), 0, number)
            for record in seq:
                comments = parse_comments(record.annotations.get("comment"))
                # TODO parse names from record.description
                # RecName: Full=Glyceraldehyde-3-phosphate dehydrogenase 1;
                #  Short=GAPDH;
                #  EC=1.2.1.12;
                append(proteins, {"sequence": str(record.seq), "name": record.name})
                append(synonyms, {"source": "uniprot", "value": record.id, "uniprot_id": record.id})
                for comment in comments:
                    # general synonyms
                    for source, value in comment.synonyms.items():
                        if source.lower() in ["pubmed"]:
                            append(
                                synonyms,
                                {"source": source.lower(), "value": value, "uniprot_id": record.id},
                            )
                    # TODO record.annotations.ncbi_taxid[]
                    # TODO record.annotations.gene_name[]
                    # reaction-specific updates
                    if comment.type == "CATALYTIC ACTIVITY":
                        for source, value in comment.synonyms.items():
                            if source.lower() == "rhea":
                                pass  # TODO link to reaction & TODO rename reaction
                            elif source.lower() == "ec":
                                pass  # TODO add EC annotation to the reaction
                pass

        # chunk_insert(session, Protein, proteins)

        # chunk_insert(session, Synonym, synonyms)

    print("done")


if __name__ == "__main__":
    main()
