#!/usr/bin/env python

from sqlalchemy import create_engine
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session
from sqlalchemy.ext.automap import automap_base
from typing import Any, Optional
import click

# get latest from seed.sql
config = {
    "topLevelResources": ["chemical", "species"],
    "listProperties": {"chemical": ["name", "structure"], "species": ["name"]},
    "detailProperties": {
        "chemical": ["name", "inchi", "structure", "synonym"],
        "species": ["name"],
    },
    "propertyTypes": {
        "structure": {"type": "svg", "bucket": "structure_images_svg"},
        "synonym": {
            "type": "key_value",
            "value_link": "https://www.ebi.ac.uk/chebi/searchId.do?chebiId=${value}",
        },
    },
    "joinResources": {"chemical": ["synonym"]},
    "plural": {"chemical": "chemicals", "species": "species", "synonym": "synonyms"},
    "specialCapitalize": {"inchi": "InChI"},
    "icon": {"chemical": "co2", "species": "emojinature"},
}


@click.command()
@click.option("--connection-string", type=str, help="Select another postgres connection string")
@click.option("--supabase-url", type=str, help="Supabase URL")
@click.option("--supabase-key", type=str, help="Supabase service key")
def main(
    connection_string: Optional[str],
    supabase_url: Optional[str],
    supabase_key: Optional[str],
):

    engine = create_engine(
        connection_string or "postgresql+psycopg2://postgres:postgres@localhost:54322/postgres"
    )

    Base = automap_base()
    Base.prepare(autoload_with=engine)
    DisplayConfig = Base.classes.display_config

    session = Session(engine)
    stmt = insert(DisplayConfig).values({"id": 1, "config": config})
    stmt = stmt.on_conflict_do_update(
        index_elements=[DisplayConfig.id], set_=dict(config=stmt.excluded.config)
    )
    session.execute(stmt)
    session.commit()
    session.close()

    print("done")


if __name__ == "__main__":
    main()
