import asyncio
from typing import Any, Optional
import sys
import time

import numpy as np
import pandas as pd
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session


async def semaphore_gather(num, coros, return_exceptions=False):
    """Limit number of coroutines"""
    semaphore = asyncio.Semaphore(num)

    async def _wrap_coro(coro):
        async with semaphore:
            return await coro

    return await asyncio.gather(
        *(_wrap_coro(coro) for coro in coros), return_exceptions=return_exceptions
    )


def append(df: pd.DataFrame, data: dict) -> None:
    """Add a row in place"""
    df.loc[0 if pd.isnull(df.index.max()) else df.index.max() + 1] = pd.Series(data)  # type: ignore


def concat(*dfs: pd.DataFrame) -> pd.DataFrame:
    """Return a concatenated DataFrame"""
    return pd.concat(dfs, ignore_index=True, sort=False)


# def filter_none(data: list[dict]) -> list[dict]:
#     """Remove None values from a list of dicts"""

#     def _not_na(v):
#         try:
#             return not pd.isna(v)
#         except (TypeError, ValueError):
#             return False

#     return [{k: v for k, v in d.items() if _not_na(v)} for d in data]


def chunk_insert(
    session: Session,
    df: pd.DataFrame | dict,
    table: Any,
    chunk_size: int = 1000,
    upsert: bool = False,
    ignore_conflicts: bool = True,
    index_elements: Optional[list[str]] = None,
    update: Optional[list[str]] = None,
    returning: Optional[list[str]] = None,
    sleep_seconds: Optional[float] = None,
) -> pd.DataFrame:
    """Insert data from a DataFrame in chunks.

    When `returning` is specified, a DataFrame with the specified data is
    returned, including all rows if `upsert=True` and only new rows if
    `upsert=False`.

    df: DataFrame or, if there is only one record, a dict

    table: sqlalchemy table

    chunk_size: number of rows to insert at once

    upsert: if True, insert or update on conflict. Requires index_elements and
    update.

    ignore_conflicts: if True, ignore conflicts on insert. If upsert=True, this
    is ignored.

    index_elements: list of column names to use as index for upsert

    update: list of column names to update on conflict

    returning: list of column names to return. Cannot be used with upsert=True
    (sqlalchemy2 should change this, but it is not compatible with our
    dependencies)

    sleep_seconds: wait for `sleep_seconds` between chunks

    """

    # handle NaN; sqlalchemy expects None
    def try_replace(x: Any) -> Any:
        try:
            if np.isnan(x):
                return None
        except TypeError:
            pass
        return x

    if isinstance(df, dict):
        df = pd.DataFrame.from_records([df])

    df = df.applymap(try_replace)

    if upsert and index_elements is None:
        raise Exception("Need index_elements to upsert")
    if upsert and update is None:
        raise Exception("Need update to upsert")
    if upsert and returning:
        raise Exception("Cannot use returning with upsert")
    results_df = pd.DataFrame(columns=returning)
    for i, (_, chunk) in enumerate(df.groupby(np.arange(len(df)) // chunk_size)):
        sys.stdout.write(
            f"\rchunk {i + 1}" + (f" ... sleeping {sleep_seconds} seconds" if sleep_seconds else "")
        )
        sys.stdout.flush()
        stmt = insert(table)
        if upsert and index_elements and update:
            stmt = stmt.on_conflict_do_update(
                index_elements=[getattr(table, r) for r in index_elements],
                set_={k: getattr(stmt.excluded, k) for k in update},
            )
        elif ignore_conflicts:
            stmt = stmt.on_conflict_do_nothing()
        if returning:
            stmt = stmt.returning(*[getattr(table, r) for r in returning])
        res = session.execute(stmt, chunk.to_dict("records"))
        session.commit()
        if returning:
            results_df = concat(results_df, pd.DataFrame.from_records(res, columns=returning))
        if sleep_seconds:
            time.sleep(sleep_seconds)
    print("")
    return results_df


def load_with_hash(
    session: Session, df: pd.DataFrame, table: Any, upsert: bool, sleep_seconds: float
):
    """Find existing records, upload new ones, and optionally update existing
    ones.

    session: sqlalchemy session

    df: DataFrame with data to load. should at least have columns data, hash, and
    previous_hash -- previous_hash will not be loaded; only `data` and `hash`
    will be updated.

    table: sqlalchemy table. should at least have columns id, data, and hash.

    upsert: if True, update existing rows with new data and hash

    sleep_seconds: wait for `sleep` seconds between chunks

    """
    if len(df) == 0:
        raise Exception("DataFrame is empty")

    existing_id_to_hash = pd.DataFrame.from_records(
        session.query(table.id, table.hash).filter(table.hash.in_(df.previous_hash.values)).all(),
        columns=["id", "hash"],
    ).rename(columns={"hash": "previous_hash"})

    # add the IDs for existing rows
    rows_to_load = df.merge(
        existing_id_to_hash,
        on="previous_hash",
        how="left",
    ).drop(columns=["previous_hash"])

    # need to add existing and new rows separately, so that we can upsert
    # on ID for existing rows, and insert new rows without including IDs
    # as None which would lead to an error
    new_rows = rows_to_load[rows_to_load.id.isna()].drop(columns=["id"])
    id_to_hash = chunk_insert(
        session,
        new_rows,
        table,
        returning=["id", "hash"],
        sleep_seconds=sleep_seconds,
    )
    existing_rows = rows_to_load.dropna(subset=["id"])
    id_to_hash = pd.concat([id_to_hash, existing_rows.loc[:, ["id", "hash"]]])
    if upsert:
        chunk_insert(
            session,
            existing_rows,
            table,
            upsert=True,
            index_elements=["id"],
            update=["data", "hash"],
            sleep_seconds=sleep_seconds,
        )
    return id_to_hash
