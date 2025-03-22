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
from sqlalchemy.dialects.postgresql import OID
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
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("now()")
    )
    has_header: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))

    column_filter: Mapped[List["ColumnFilter"]] = relationship(
        "ColumnFilter", back_populates="table_identification"
    )
    column_identification: Mapped[List["ColumnIdentification"]] = relationship(
        "ColumnIdentification", back_populates="table_identification"
    )
    column_redis_data: Mapped[List["ColumnRedisData"]] = relationship(
        "ColumnRedisData", back_populates="table_identification"
    )
    column_stats: Mapped[List["ColumnStats"]] = relationship(
        "ColumnStats", back_populates="table_identification"
    )
    column_type_options: Mapped[List["ColumnTypeOptions"]] = relationship(
        "ColumnTypeOptions", back_populates="table_identification"
    )
    dirty_custom_type: Mapped[List["DirtyCustomType"]] = relationship(
        "DirtyCustomType", back_populates="table_identification"
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


class Widget(Base):
    __tablename__ = "widget"
    __table_args__ = (
        PrimaryKeyConstraint("id", name="widget_pkey"),
        UniqueConstraint(
            "prefixed_id", "user_id", "widget_id", name="widget_prefixed_id_user_id_widget_id_key"
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
    widget_id: Mapped[str] = mapped_column(Text)
    engine: Mapped[str] = mapped_column(Text)
    type: Mapped[str] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text)
    description: Mapped[str] = mapped_column(Text)
    is_suggested: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("now()")
    )
    display_order: Mapped[Optional[int]] = mapped_column(Integer)
    vega_lite_spec: Mapped[Optional[str]] = mapped_column(Text)
    observable_plot_code: Mapped[Optional[str]] = mapped_column(Text)


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


class ColumnFilter(Base):
    __tablename__ = "column_filter"
    __table_args__ = (
        ForeignKeyConstraint(
            ["table_identification_id"],
            ["table_identification.id"],
            ondelete="CASCADE",
            name="column_filter_table_identification_id_fkey",
        ),
        PrimaryKeyConstraint("id", name="column_filter_pkey"),
        UniqueConstraint(
            "table_identification_id",
            "column_index",
            name="column_filter_table_identification_id_column_index_key",
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    table_identification_id: Mapped[int] = mapped_column(BigInteger)
    column_index: Mapped[int] = mapped_column(Integer)
    filter_type: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("now()")
    )

    table_identification: Mapped["TableIdentification"] = relationship(
        "TableIdentification", back_populates="column_filter"
    )


class ColumnIdentification(Base):
    __tablename__ = "column_identification"
    __table_args__ = (
        ForeignKeyConstraint(
            ["table_identification_id"],
            ["table_identification.id"],
            ondelete="CASCADE",
            name="column_identification_table_identification_id_fkey",
        ),
        PrimaryKeyConstraint("id", name="column_identification_pkey"),
        UniqueConstraint(
            "table_identification_id",
            "column_index",
            name="column_identification_table_identification_id_column_index_key",
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    table_identification_id: Mapped[int] = mapped_column(BigInteger)
    column_index: Mapped[int] = mapped_column(Integer)
    type: Mapped[str] = mapped_column(Text)
    description: Mapped[str] = mapped_column(Text)
    is_custom: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("now()")
    )
    external_id: Mapped[Optional[str]] = mapped_column(Text)
    external_name: Mapped[Optional[str]] = mapped_column(Text)
    external_kind: Mapped[Optional[str]] = mapped_column(Text)
    min_value: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric)
    max_value: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric)
    log_scale: Mapped[Optional[bool]] = mapped_column(Boolean)

    table_identification: Mapped["TableIdentification"] = relationship(
        "TableIdentification", back_populates="column_identification"
    )
    column_suggested_action: Mapped[List["ColumnSuggestedAction"]] = relationship(
        "ColumnSuggestedAction", back_populates="column_identification"
    )


class ColumnRedisData(Base):
    __tablename__ = "column_redis_data"
    __table_args__ = (
        ForeignKeyConstraint(
            ["table_identification_id"],
            ["table_identification.id"],
            ondelete="CASCADE",
            name="column_redis_data_table_identification_id_fkey",
        ),
        PrimaryKeyConstraint("id", name="column_redis_data_pkey"),
        UniqueConstraint(
            "table_identification_id",
            "column_index",
            name="column_redis_data_table_identification_id_column_index_key",
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    table_identification_id: Mapped[int] = mapped_column(BigInteger)
    column_index: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("now()")
    )
    status: Mapped[Optional[str]] = mapped_column(Text)
    matches_count: Mapped[Optional[int]] = mapped_column(Integer)
    total_count: Mapped[Optional[int]] = mapped_column(Integer)

    table_identification: Mapped["TableIdentification"] = relationship(
        "TableIdentification", back_populates="column_redis_data"
    )
    column_redis_info: Mapped["ColumnRedisInfo"] = relationship(
        "ColumnRedisInfo", uselist=False, back_populates="column_redis_data"
    )
    column_redis_match: Mapped[List["ColumnRedisMatch"]] = relationship(
        "ColumnRedisMatch", back_populates="column_redis_data"
    )


class ColumnStats(Base):
    __tablename__ = "column_stats"
    __table_args__ = (
        ForeignKeyConstraint(
            ["table_identification_id"],
            ["table_identification.id"],
            ondelete="CASCADE",
            name="column_stats_table_identification_id_fkey",
        ),
        PrimaryKeyConstraint("id", name="column_stats_pkey"),
        UniqueConstraint(
            "table_identification_id",
            "column_index",
            name="column_stats_table_identification_id_column_index_key",
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    table_identification_id: Mapped[int] = mapped_column(BigInteger)
    column_index: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("now()")
    )
    min_value: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric)
    max_value: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric)

    table_identification: Mapped["TableIdentification"] = relationship(
        "TableIdentification", back_populates="column_stats"
    )


class ColumnTypeOptions(Base):
    __tablename__ = "column_type_options"
    __table_args__ = (
        ForeignKeyConstraint(
            ["table_identification_id"],
            ["table_identification.id"],
            ondelete="CASCADE",
            name="column_type_options_table_identification_id_fkey",
        ),
        PrimaryKeyConstraint("id", name="column_type_options_pkey"),
        UniqueConstraint(
            "table_identification_id",
            "column_index",
            name="column_type_options_table_identification_id_column_index_key",
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    table_identification_id: Mapped[int] = mapped_column(BigInteger)
    column_index: Mapped[int] = mapped_column(Integer)
    logarithmic: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("now()")
    )
    min_value: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric)
    max_value: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric)

    table_identification: Mapped["TableIdentification"] = relationship(
        "TableIdentification", back_populates="column_type_options"
    )


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


class ColumnRedisInfo(Base):
    __tablename__ = "column_redis_info"
    __table_args__ = (
        ForeignKeyConstraint(
            ["column_redis_data_id"],
            ["column_redis_data.id"],
            ondelete="CASCADE",
            name="column_redis_info_column_redis_data_id_fkey",
        ),
        PrimaryKeyConstraint("id", name="column_redis_info_pkey"),
        UniqueConstraint("column_redis_data_id", name="column_redis_info_column_redis_data_id_key"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    column_redis_data_id: Mapped[int] = mapped_column(BigInteger)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("now()")
    )
    link_prefix: Mapped[Optional[str]] = mapped_column(Text)
    description: Mapped[Optional[str]] = mapped_column(Text)
    num_entries: Mapped[Optional[int]] = mapped_column(Integer)
    link: Mapped[Optional[str]] = mapped_column(Text)

    column_redis_data: Mapped["ColumnRedisData"] = relationship(
        "ColumnRedisData", back_populates="column_redis_info"
    )


class ColumnRedisMatch(Base):
    __tablename__ = "column_redis_match"
    __table_args__ = (
        ForeignKeyConstraint(
            ["column_redis_data_id"],
            ["column_redis_data.id"],
            ondelete="CASCADE",
            name="column_redis_match_column_redis_data_id_fkey",
        ),
        PrimaryKeyConstraint("id", name="column_redis_match_pkey"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    column_redis_data_id: Mapped[int] = mapped_column(BigInteger)
    match_value: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("now()")
    )

    column_redis_data: Mapped["ColumnRedisData"] = relationship(
        "ColumnRedisData", back_populates="column_redis_match"
    )


class ColumnSuggestedAction(Base):
    __tablename__ = "column_suggested_action"
    __table_args__ = (
        ForeignKeyConstraint(
            ["column_identification_id"],
            ["column_identification.id"],
            ondelete="CASCADE",
            name="column_suggested_action_column_identification_id_fkey",
        ),
        PrimaryKeyConstraint("id", name="column_suggested_action_pkey"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    column_identification_id: Mapped[int] = mapped_column(BigInteger)
    action: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("now()")
    )

    column_identification: Mapped["ColumnIdentification"] = relationship(
        "ColumnIdentification", back_populates="column_suggested_action"
    )
