from typing import List, Optional

from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    Double,
    ForeignKeyConstraint,
    Identity,
    Integer,
    LargeBinary,
    Numeric,
    PrimaryKeyConstraint,
    Table,
    Text,
    UniqueConstraint,
    Uuid,
    text,
)
from sqlalchemy.dialects.postgresql import OID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
import datetime
import uuid


class Base(DeclarativeBase):
    pass


class File(Base):
    __tablename__ = "file"
    __table_args__ = (PrimaryKeyConstraint("id", name="file_pkey"),)

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    name: Mapped[str] = mapped_column(Text)
    size: Mapped[int] = mapped_column(BigInteger)
    bucket_id: Mapped[str] = mapped_column(Text)
    object_path: Mapped[str] = mapped_column(Text)
    user_id: Mapped[str] = mapped_column(Text)
    mime_type: Mapped[Optional[str]] = mapped_column(Text)
    latest_task_id: Mapped[Optional[str]] = mapped_column(Text)


class Notes(Base):
    __tablename__ = "notes"
    __table_args__ = (PrimaryKeyConstraint("id", name="notes_pkey"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[str] = mapped_column(Text)
    title: Mapped[Optional[str]] = mapped_column(Text)


t_pg_stat_statements = Table(
    "pg_stat_statements",
    Base.metadata,
    Column("userid", OID),
    Column("dbid", OID),
    Column("toplevel", Boolean),
    Column("queryid", BigInteger),
    Column("query", Text),
    Column("plans", BigInteger),
    Column("total_plan_time", Double(53)),
    Column("min_plan_time", Double(53)),
    Column("max_plan_time", Double(53)),
    Column("mean_plan_time", Double(53)),
    Column("stddev_plan_time", Double(53)),
    Column("calls", BigInteger),
    Column("total_exec_time", Double(53)),
    Column("min_exec_time", Double(53)),
    Column("max_exec_time", Double(53)),
    Column("mean_exec_time", Double(53)),
    Column("stddev_exec_time", Double(53)),
    Column("rows", BigInteger),
    Column("shared_blks_hit", BigInteger),
    Column("shared_blks_read", BigInteger),
    Column("shared_blks_dirtied", BigInteger),
    Column("shared_blks_written", BigInteger),
    Column("local_blks_hit", BigInteger),
    Column("local_blks_read", BigInteger),
    Column("local_blks_dirtied", BigInteger),
    Column("local_blks_written", BigInteger),
    Column("temp_blks_read", BigInteger),
    Column("temp_blks_written", BigInteger),
    Column("blk_read_time", Double(53)),
    Column("blk_write_time", Double(53)),
    Column("temp_blk_read_time", Double(53)),
    Column("temp_blk_write_time", Double(53)),
    Column("wal_records", BigInteger),
    Column("wal_fpi", BigInteger),
    Column("wal_bytes", Numeric),
    Column("jit_functions", BigInteger),
    Column("jit_generation_time", Double(53)),
    Column("jit_inlining_count", BigInteger),
    Column("jit_inlining_time", Double(53)),
    Column("jit_optimization_count", BigInteger),
    Column("jit_optimization_time", Double(53)),
    Column("jit_emission_count", BigInteger),
    Column("jit_emission_time", Double(53)),
)


t_pg_stat_statements_info = Table(
    "pg_stat_statements_info",
    Base.metadata,
    Column("dealloc", BigInteger),
    Column("stats_reset", DateTime(True)),
)


class TaskLink(Base):
    __tablename__ = "task_link"
    __table_args__ = (PrimaryKeyConstraint("id", name="task_link_pkey"),)

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    user_id: Mapped[str] = mapped_column(Text)
    task_id: Mapped[str] = mapped_column(Text)
    task_created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("(now() AT TIME ZONE 'utc'::text)")
    )
    type: Mapped[Optional[str]] = mapped_column(Text)
    task_finished_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    task_error: Mapped[Optional[str]] = mapped_column(Text)

    app: Mapped[List["App"]] = relationship("App", back_populates="deploy_app_task_link")


class Tool(Base):
    __tablename__ = "tool"
    __table_args__ = (
        PrimaryKeyConstraint("id", name="tool_pkey"),
        UniqueConstraint("name", "user_id", name="tool_name_user_id_key"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    name: Mapped[str] = mapped_column(Text)
    user_id: Mapped[str] = mapped_column(Text)


class App(Base):
    __tablename__ = "app"
    __table_args__ = (
        ForeignKeyConstraint(
            ["deploy_app_task_link_id"], ["task_link.id"], name="app_deploy_app_task_link_id_fkey"
        ),
        PrimaryKeyConstraint("id", name="app_pkey"),
        UniqueConstraint("name", "user_id", name="app_name_user_id_key"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, server_default=text("uuid_generate_v4()")
    )
    name: Mapped[str] = mapped_column(Text)
    user_id: Mapped[str] = mapped_column(Text)
    deploy_subdomain_ready: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    deploy_subdomain: Mapped[Optional[str]] = mapped_column(Text)
    deploy_app_task_link_id: Mapped[Optional[int]] = mapped_column(BigInteger)

    deploy_app_task_link: Mapped["TaskLink"] = relationship("TaskLink", back_populates="app")
    app_files: Mapped[List["AppFiles"]] = relationship("AppFiles", back_populates="app")


class AppFiles(Base):
    __tablename__ = "app_files"
    __table_args__ = (
        ForeignKeyConstraint(["app_id"], ["app.id"], name="app_files_app_id_fkey"),
        PrimaryKeyConstraint("id", name="app_files_pkey"),
        UniqueConstraint("app_id", "name", name="app_files_app_id_name_key"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, server_default=text("uuid_generate_v4()")
    )
    app_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    name: Mapped[str] = mapped_column(Text)
    file: Mapped[bytes] = mapped_column(LargeBinary)

    app: Mapped["App"] = relationship("App", back_populates="app_files")
