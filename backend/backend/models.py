from typing import List, Optional

from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Column,
    Computed,
    DateTime,
    Double,
    ForeignKeyConstraint,
    Identity,
    Integer,
    Numeric,
    PrimaryKeyConstraint,
    Table,
    Text,
    UniqueConstraint,
    Uuid,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, OID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
import datetime
import decimal
import uuid


class Base(DeclarativeBase):
    pass


class CustomType(Base):
    __tablename__ = "custom_type"
    __table_args__ = (
        CheckConstraint(
            "kind = ANY (ARRAY['decimal'::text, 'integer'::text, 'enum'::text, 'date'::text, 'time'::text])",
            name="custom_type_kind_check",
        ),
        PrimaryKeyConstraint("id", name="custom_type_pkey"),
        UniqueConstraint("name", "user_id", name="custom_type_name_user_id_key"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, server_default=text("gen_random_uuid()")
    )
    kind: Mapped[str] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text)
    description: Mapped[str] = mapped_column(Text)
    rules: Mapped[list] = mapped_column(ARRAY(Text()), server_default=text("'{}'::text[]"))
    examples: Mapped[list] = mapped_column(ARRAY(Text()), server_default=text("'{}'::text[]"))
    not_examples: Mapped[list] = mapped_column(ARRAY(Text()), server_default=text("'{}'::text[]"))
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    min_value: Mapped[decimal.Decimal] = mapped_column(
        Numeric, server_default=text("'-Infinity'::numeric")
    )
    max_value: Mapped[decimal.Decimal] = mapped_column(
        Numeric, server_default=text("'Infinity'::numeric")
    )
    log_scale: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    public: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("now()")
    )
    values_key: Mapped[Optional[str]] = mapped_column(
        Text,
        Computed(
            "\nCASE\n    WHEN (kind = 'enum'::text) THEN ('br-values-'::text || id)\n    ELSE NULL::text\nEND",
            persisted=True,
        ),
    )

    dirty_custom_type: Mapped[List["DirtyCustomType"]] = relationship(
        "DirtyCustomType", back_populates="type"
    )


class File(Base):
    __tablename__ = "file"
    __table_args__ = (PrimaryKeyConstraint("id", name="file_pkey"),)

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(Text)
    size: Mapped[int] = mapped_column(BigInteger)
    bucket_id: Mapped[str] = mapped_column(Text)
    object_path: Mapped[str] = mapped_column(Text)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    mime_type: Mapped[Optional[str]] = mapped_column(Text)
    latest_task_id: Mapped[Optional[str]] = mapped_column(Text)


class Notes(Base):
    __tablename__ = "notes"
    __table_args__ = (PrimaryKeyConstraint("id", name="notes_pkey"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid)
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


class TableIdentification(Base):
    __tablename__ = "table_identification"
    __table_args__ = (
        PrimaryKeyConstraint("id", name="table_identification_pkey"),
        UniqueConstraint(
            "prefixed_id", "user_id", name="table_identification_prefixed_id_user_id_key"
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    prefixed_id: Mapped[str] = mapped_column(Text)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    identifications: Mapped[dict] = mapped_column(JSONB)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("now()")
    )

    dirty_custom_type: Mapped[List["DirtyCustomType"]] = relationship(
        "DirtyCustomType", back_populates="table_identification"
    )


class TableWidgets(Base):
    __tablename__ = "table_widgets"
    __table_args__ = (
        PrimaryKeyConstraint("id", name="table_widgets_pkey"),
        UniqueConstraint("prefixed_id", "user_id", name="table_widgets_prefixed_id_user_id_key"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    prefixed_id: Mapped[str] = mapped_column(Text)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    widgets: Mapped[dict] = mapped_column(JSONB)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("now()")
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
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    task_id: Mapped[str] = mapped_column(Text)
    task_created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("(now() AT TIME ZONE 'utc'::text)")
    )
    type: Mapped[Optional[str]] = mapped_column(Text)
    task_finished_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    task_error: Mapped[Optional[str]] = mapped_column(Text)


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
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid)


class WidgetPreferences(Base):
    __tablename__ = "widget_preferences"
    __table_args__ = (
        PrimaryKeyConstraint("id", name="widget_preferences_pkey"),
        UniqueConstraint(
            "prefixed_id", "user_id", name="widget_preferences_prefixed_id_user_id_key"
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    prefixed_id: Mapped[str] = mapped_column(Text)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("now()")
    )
    active_engine: Mapped[Optional[str]] = mapped_column(Text)
    sidebar_width: Mapped[Optional[int]] = mapped_column(Integer)


class DirtyCustomType(Base):
    __tablename__ = "dirty_custom_type"
    __table_args__ = (
        ForeignKeyConstraint(
            ["table_identification_id"],
            ["table_identification.id"],
            ondelete="CASCADE",
            name="dirty_custom_type_table_identification_id_fkey",
        ),
        ForeignKeyConstraint(
            ["type_id"],
            ["custom_type.id"],
            ondelete="CASCADE",
            name="dirty_custom_type_type_id_fkey",
        ),
        PrimaryKeyConstraint("id", name="dirty_custom_type_pkey"),
        UniqueConstraint(
            "type_id",
            "table_identification_id",
            "user_id",
            name="dirty_custom_type_type_id_table_identification_id_user_id_key",
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    type_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    table_identification_id: Mapped[int] = mapped_column(BigInteger)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    marked_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("now()")
    )

    table_identification: Mapped["TableIdentification"] = relationship(
        "TableIdentification", back_populates="dirty_custom_type"
    )
    type: Mapped["CustomType"] = relationship("CustomType", back_populates="dirty_custom_type")
