import asyncio
import sys
import time
from typing import Any, Optional

import numpy
import numpy as np
import pandas as pd
from psycopg2.extensions import AsIs, register_adapter
from sqlalchemy import Table, bindparam, select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session


def adapt_numpy_float64(numpy_float64):
    return AsIs(numpy_float64)


def adapt_numpy_int64(numpy_int64):
    return AsIs(numpy_int64)


register_adapter(numpy.float64, adapt_numpy_float64)
register_adapter(numpy.int64, adapt_numpy_int64)


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


def filter_none(data: list[dict]) -> list[dict]:
    """Remove None values from a list of dicts"""

    def _not_na(v):
        try:
            return not pd.isna(v)
        except (TypeError, ValueError):
            return False

    return [{k: v for k, v in d.items() if _not_na(v)} for d in data]


def try_replace(x: Any) -> Any:
    """handle NaN; sqlalchemy expects None"""
    try:
        if np.isnan(x):
            return None
    except TypeError:
        pass
    return x


def chunk_select(
    session: Session,
    df: pd.DataFrame | dict,
    table: Table,
    returning: list[str],
    where_column=dict[str, str],
    chunk_size: int = 10_000,
    sleep_seconds: float | None = 0.2,
) -> pd.DataFrame:
    """Select data into a DataFrame in chunks.

    df: DataFrame or, if there is only one record, a dict

    table: sqlalchemy table

    returning: list of column names to return

    where_column:

    chunk_size: number of rows to insert at once

    sleep_seconds: wait for `sleep_seconds` between chunks

    """

    if isinstance(df, dict):
        df = pd.DataFrame.from_records([df])

    df = df.applymap(try_replace)

    results_df = pd.DataFrame(columns=returning)
    for i, (_, chunk) in enumerate(df.groupby(np.arange(len(df)) // chunk_size)):
        sys.stdout.write(
            f"\rselecting chunk {i + 1}"
            + (f" ... sleeping {sleep_seconds} seconds" if sleep_seconds else "")
        )
        sys.stdout.flush()
        stmt = select(*[getattr(table, r) for r in returning])
        for k, v in where_column.items():
            stmt = stmt.where(getattr(table, k).in_(chunk[v].values))
        res = session.execute(stmt)
        session.commit()
        results_df = concat(results_df, pd.DataFrame.from_records(res, columns=returning))
        if sleep_seconds:
            time.sleep(sleep_seconds)
    print("")
    return results_df


def chunk_update(
    session: Session,
    df: pd.DataFrame | dict,
    table: Table,
    where_column=dict[str, str],
    update_columns=list[str],
    chunk_size: int = 1000,
    sleep_seconds: float | None = 0.6,
) -> None:
    """Update data from DataFrame in chunks.

    df: DataFrame or, if there is only one record, a dict

    table: sqlalchemy table

    where_column: dict of column names to match

    update_columns: list of column names to update

    chunk_size: number of rows to insert at once

    sleep_seconds: wait for `sleep_seconds` between chunks

    """

    if isinstance(df, dict):
        df = pd.DataFrame.from_records([df])

    df = df.applymap(try_replace)

    for i, (_, chunk) in enumerate(df.groupby(np.arange(len(df)) // chunk_size)):
        sys.stdout.write(
            f"\rupdating chunk {i + 1}"
            + (f" ... sleeping {sleep_seconds} seconds" if sleep_seconds else "")
        )
        sys.stdout.flush()

        stmt = update(table)
        for k, v in where_column.items():
            stmt = stmt.where(getattr(table, k) == bindparam(v))
        stmt = stmt.values(**{k: bindparam(k) for k in update_columns})
        session.execute(stmt, chunk.to_dict("records"))
        session.commit()
        if sleep_seconds:
            time.sleep(sleep_seconds)
    print("")


def chunk_insert(
    session: Session,
    df: pd.DataFrame | dict,
    table: Table,
    chunk_size: int = 1000,
    upsert: bool = False,
    ignore_conflicts: bool = True,
    index_elements: Optional[list[str]] = None,
    update: Optional[list[str]] = None,
    returning: Optional[list[str]] = None,
    sleep_seconds: float = 0.6,
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
            f"\r{'upserting' if upsert else 'inserting'} chunk {i + 1}"
            + (f" ... sleeping {sleep_seconds} seconds" if sleep_seconds else "")
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
    session: Session,
    df: pd.DataFrame,
    table: Any,
    upsert: bool,
):
    """Find existing records, upload new ones, and optionally update existing
    ones.

    session: sqlalchemy session

    df: DataFrame with data to load. should at least have columns data, hash, and
    previous_hash (for upsert) -- previous_hash will not be loaded; only `data`
    and `hash` will be updated.

    table: sqlalchemy table. should at least have columns data and hash.

    upsert: if True, update existing rows with new data and hash

    """
    if len(df) == 0:
        raise Exception("DataFrame is empty")

    if upsert:
        chunk_update(
            session,
            df,
            table,
            where_column={"hash": "previous_hash"},
            update_columns=["data", "hash"],
        )

    id_to_hash = chunk_select(
        session,
        df,
        table,
        where_column={"hash": "hash"},
        returning=["id", "hash"],
    )

    df_new = df[~df.hash.isin(id_to_hash.hash)]
    id_to_hash_new = chunk_insert(
        session,
        df_new,
        table,
        returning=["id", "hash"],
    )
    return pd.concat([id_to_hash, id_to_hash_new])
