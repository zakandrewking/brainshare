from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import pandas as pd  # type: ignore


def set_project(project: str):
    pass


class Query:
    columns: list[str] = []

    def _execute(self):
        if len(self.columns) == 0:
            raise Exception("Must specify at least one column")
        pass

    def single_dataframe(self) -> "pd.DataFrame":
        self._execute()

        import pandas as pd  # type: ignore

        return pd.DataFrame([{"id": 1, "name": "test"}])

    def dataframes(self) -> "list[pd.DataFrame]":
        import pandas as pd  # type: ignore

        self._execute()

        return [pd.DataFrame([{"id": 1, "name": "test"}])]

    def to_pd(self):
        self._execute()
        return self.to_dataframe()

    # def to_pl(self):
    #     self._execute()

    #     import polars as pl  # type: ignore

    #     return pl.DataFrame({"id": [1], "name": ["test"]})

    # def networkx_graph(self):
    #     self._execute()

    #     import networkx as nx  # type: ignore

    #     G = nx.Graph()
    #     G.add_node(1, name="test")
    #     return G

    def select(self, *columns):
        """Select columns to return from the query"""
        if len(self.columns) > 0:
            raise Exception("select() cannot be called multiple times")
        if len(columns) == 0:
            raise Exception("Must specify at least one column")
        self.columns = columns
        return self


def query(resource: str | None = None):
    return Query()


def list_resources():
    return []
