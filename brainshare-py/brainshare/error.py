from typer import Context, Exit

from . import context


def error(message: str, ctx: Context | None):
    """Exit typer if in a typer context. Otherwise raise a normal Exception."""
    if context.is_typer:
        print(f"\n{message}\n")
        raise Exit(code=1)
    else:
        raise Exception(message)
