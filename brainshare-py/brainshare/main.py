def set_project(project: str):
    pass


class Query:
    columns: list[str] = []

    def _execute_query(self):
        if len(self.columns) == 0:
            raise Exception("Must specify at least one column")
        pass

    def to_dataframe(self):
        self._execute_query()

        import pandas as pd  # type: ignore

        return pd.DataFrame([{"id": 1, "name": "test"}])

    def to_pd(self):
        self._execute_query()
        return self.to_dataframe()

    def to_pl(self):
        self._execute_query()

        import polars as pl  # type: ignore

        return pl.DataFrame({"id": [1], "name": ["test"]})

    def to_networkx(self):
        self._execute_query()

        import networkx as nx  # type: ignore

        G = nx.Graph()
        G.add_node(1, name="test")
        return G

    def select(self, *columns):
        """Select columns to return from the query"""
        if len(columns) > 0:
            raise Exception("select() cannot be called multiple times")
        if len(columns) == 0:
            raise Exception("Must specify at least one column")
        self.columns = columns
        return self


def query(type: str | None = None, join: str | None = None):
    return Query()
