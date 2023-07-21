#!/usr/bin/env python

import asyncio
import os

import click
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session

from db import chunk_insert


@click.command()
@click.option("--connection-string", type=str, help="Select another postgres connection string")
def main(*args, **kwargs):
    asyncio.run(async_main(*args, **kwargs))


async def async_main(
    connection_string: str | None,
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
    NodeType = Base.classes.node_type
    Definition = Base.classes.definition

    print("loading node_types")
    chunk_insert(
        session,
        pd.DataFrame.from_records(
            [
                {
                    "id": "chemical",
                    "icon": "co2",
                    "top_level": True,
                    "list_definition_ids": ["structure", "name"],
                    "detail_definition_ids": [
                        "name",
                        "structure",
                        "inchi",
                        "inchi_key",
                        "synonym",
                        "reaction",
                        "hash",
                    ],
                },
                {
                    "id": "synonym",
                    "top_level": False,
                    "list_definition_ids": ["hash"],
                    "detail_definition_ids": ["hash"],
                },
                {
                    "id": "taxonomy",
                    "icon": "emojiNature",
                    "top_level": True,
                    "list_definition_ids": ["name"],
                    "detail_definition_ids": ["name", "rank", "parent", "synonym", "hash"],
                },
            ]
        ),
        NodeType,
        upsert=True,
        index_elements=["id"],
        # TODO fill in update automatically
        update=["icon", "top_level", "list_definition_ids", "detail_definition_ids"],
    )

    print("loading property definitions")
    chunk_insert(
        session,
        pd.DataFrame.from_records(
            [
                {
                    "id": "hash",
                    "component_id": "text",
                    "options": {
                        "dataKey": "hash",
                        "displayName": "Hash",
                    },
                },
                {
                    "id": "inchi",
                    "component_id": "text",
                    "options": {
                        "dataKey": "inchi",
                        "displayName": "InChI",
                    },
                },
                {
                    "id": "name",
                    "component_id": "text",
                    "options": {
                        "dataKey": "name",
                        "displayName": "Name",
                        "gridSize": 6,
                    },
                },
                {
                    "id": "parent",
                    "component_id": "internalLink",
                    "options": {
                        "dataKey": "taxonomy",
                        "displayName": "Parents",
                        "nameTemplate": "${rank}: ${name}",
                        "linkTemplate": "/node/taxonomy/${id}",
                    },
                },
                {
                    "id": "rank",
                    "component_id": "text",
                    "options": {
                        "dataKey": "rank",
                        "displayName": "Rank",
                    },
                },
                {
                    "id": "structure",
                    "component_id": "svg",
                    "options": {
                        "bucket": "structure_images_svg_graph",
                        "displayName": "",
                        "gridSize": 6,
                        "width": 150,
                        "pathTemplate": "${id}${BRAINSHARE_UNDERSCORE_DARK}.svg",
                    },
                },
                {
                    "id": "synonym",
                    "component_id": "sourceValue",
                    "options": {
                        "dataKey": "synonym",
                        "displayName": "Synonyms",
                        "optionsTable": {
                            "chebi": {
                                "linkTemplate": "https://www.ebi.ac.uk/chebi/searchId.do?chebiId=${value}",
                            },
                            "rhea": {
                                "linkTemplate": "https://www.rhea-db.org/rhea/${value}",
                            },
                            "metacyc": {
                                "linkTemplate": "https://metacyc.org/gene?orgid=META&id=${value}",
                            },
                            "uniprot": {
                                "linkTemplate": "https://www.uniprot.org/uniprotkb/${value}",
                            },
                            "pubmed": {
                                "linkTemplate": "https://pubmed.ncbi.nlm.nih.gov/${value}",
                            },
                            "ncbi_taxonomy": {
                                "linkTemplate": "https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=${value}",
                            },
                        },
                    },
                },
            ]
        ),
        Definition,
        upsert=True,
        index_elements=["id"],
        update=["component_id", "options"],
    )


if __name__ == "__main__":
    main()
