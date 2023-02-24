import inflect
from typer import Typer

from . import db
from . import context
from . import models
from .supabase import supabase

plural = inflect.engine().plural


def to_title_case(snake_string):
    return snake_string.title().replace("_", "")


def get_table(name: str) -> type[models.Base]:
    try:
        return getattr(models, to_title_case(name))
    except AttributeError:
        raise Exception(f"Could not find database model for {name},  i.e. {to_title_case(name)}")


def make_typer_app(name: str) -> Typer:
    app = Typer()

    @app.callback()
    def _callback():
        f"""
        Work with {plural(name)}
        """

    @app.command(name="pull")
    def _typer_pull(id: str, update: bool = False, data_path: str | None = None):
        f"""
        Pull {name} from Brainshare
        """
        context.is_typer = True
        pull(id, update, data_path)

    def pull(id: str, update: bool = False, data_path: str | None = None):
        print(f"pulling {name} {id}")
        data = supabase.table(name).select("*").eq("id", id).single()
        db.insert(get_table(name), data, update=update, data_path=data_path)

    return app
