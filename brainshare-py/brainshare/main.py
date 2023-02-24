from typer import Typer

from .resource import make_typer_app
from .display_config import top_level_resources

app = Typer()


for name in top_level_resources:
    resource_app = make_typer_app(name)
    app.add_typer(resource_app, name=name)
    setattr(self, "name", resource_app)


@app.callback()
def brainshare():
    """
    Brainshare CLI - https://brainshare.io/metabolism
    """


# @app.login(name="login")
# def _typer_login():
#     """
#     Authenticate with Brainshare
#     """
#     login()
