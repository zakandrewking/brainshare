#!/usr/bin/env python

from os.path import dirname, realpath, join
from sqlalchemy import create_engine
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session
from sqlalchemy.ext.automap import automap_base
from typing import Any, Optional
import click
import json

dir = dirname(realpath(__file__))
data_dir = join(dir, "..", "data")

# get latest from seed.sql
with open(join(data_dir, "display-config.json"), "r") as f:
    config = json.load(f)


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
