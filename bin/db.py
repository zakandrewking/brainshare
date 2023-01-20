from typing import Any, Optional
import sys
import time

import numpy as np
import pandas as pd
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session


def append(df: pd.DataFrame, data: dict) -> None:
    """Add a row in place"""
    df.loc[0 if pd.isnull(df.index.max()) else df.index.max() + 1] = pd.Series(data)  # type: ignore


def concat(*dfs: pd.DataFrame) -> pd.DataFrame:
    """Return a concatenated DataFrame"""
    return pd.concat(dfs, ignore_index=True, sort=False)


def chunk_insert(
    session: Session,
    df: pd.DataFrame,
    table: Any,
    chunk_size: int = 1000,
    upsert: bool = False,
    index_elements: Optional[list[str]] = None,
    update: Optional[list[str]] = None,
    returning: Optional[list[str]] = None,
    sleep: Optional[int] = None,
) -> pd.DataFrame:
    """Insert data from a DataFrame in chunks.

    When `returning` is specified, a DataFrame with the specified data is
    returned, including all rows if `upsert=True` and only new rows if
    `upsert=False`.

    """

    # handle NaN; sqlalchemy expects None
    def try_replace(x: Any) -> Any:
        try:
            if np.isnan(x):
                return None
        except TypeError:
            pass
        return x

    df = df.applymap(try_replace)

    if upsert and index_elements is None:
        raise Exception("Need index_elements to upsert")
    if upsert and update is None:
        raise Exception("Need update to upsert")
    results_df = pd.DataFrame(columns=returning)
    for i, (_, chunk) in enumerate(df.groupby(np.arange(len(df)) // chunk_size)):
        sys.stdout.write(f"\rchunk {i + 1}" + (f" ... sleeping {sleep} seconds" if sleep else ""))
        sys.stdout.flush()
        stmt = insert(table).values(chunk.to_dict("records"))
        if upsert and index_elements and update:
            stmt = stmt.on_conflict_do_update(
                index_elements=[getattr(table, r) for r in index_elements],
                set_={k: getattr(stmt.excluded, k) for k in update},
            )
        else:
            stmt = stmt.on_conflict_do_nothing()
        if returning:
            stmt = stmt.returning(*[getattr(table, r) for r in returning])
        res = session.execute(stmt)
        session.commit()
        if returning:
            results_df = concat(results_df, pd.DataFrame.from_records(res, columns=returning))
        if sleep:
            time.sleep(sleep)
    print("")
    return results_df
