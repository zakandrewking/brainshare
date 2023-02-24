from typer import Context
from typing import Any, Type
from os.path import exists, join, dirname, expanduser
import toml

from sqlalchemy import create_engine
from typer import Exit

from .models import Base
from .error import error


def get_engine(data_path: str | None = None, ctx: Context | None = None):
    if not data_path:
        # check config file
        conf_path = expanduser("~/.brainshare.toml")
        if not exists(conf_path):
            error(
                "Could not find a data path. Pass a directory with the option `data_path`, or specify `data_path` in the brainshare config file at ~/.brainshare.toml",
                ctx,
            )
        try:
            with open(conf_path, "r") as f:
                config = toml.load(f)
        except:
            print(f"Could not parse toml file at {conf_path}")
            raise Exit(code=1)
        data_path = config.get("data_path")
        if not data_path:
            print(
                f"""
`data_path` is not specified in {conf_path} and was not passed as an option
"""
            )
            raise Exit(code=1)

    db_path = join(data_path, "brainshare-db.sqlite3")
    new_db = not exists(db_path)
    if new_db and not exists(dirname(db_path)):
        raise Exception(f"Directory {dirname(db_path)} does not exist")

    engine = create_engine(f"sqlite+pysqlite:///{db_path}")

    if new_db:
        print(f"Initializing database {db_path}")
        Base.metadata.create_all(engine)

    return engine


def insert(model: Type[Base], data: Any, update: bool = False, data_path: str | None = None):
    engine = get_engine(data_path=data_path)
    print(engine)
    print(model)
    print(data)
