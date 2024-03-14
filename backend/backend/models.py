from typing import List, Optional

from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy import (
    BigInteger,
    Boolean,
    CHAR,
    CheckConstraint,
    Column,
    Computed,
    DateTime,
    Double,
    ForeignKeyConstraint,
    Identity,
    Index,
    Integer,
    Numeric,
    PrimaryKeyConstraint,
    SmallInteger,
    String,
    Table,
    Text,
    UniqueConstraint,
    Uuid,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, OID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
import datetime
import uuid


class Base(DeclarativeBase):
    pass


class Users(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            "email_change_confirm_status >= 0 AND email_change_confirm_status <= 2",
            name="users_email_change_confirm_status_check",
        ),
        PrimaryKeyConstraint("id", name="users_pkey"),
        UniqueConstraint("phone", name="users_phone_key"),
        Index("confirmation_token_idx", "confirmation_token", unique=True),
        Index("email_change_token_current_idx", "email_change_token_current", unique=True),
        Index("email_change_token_new_idx", "email_change_token_new", unique=True),
        Index("reauthentication_token_idx", "reauthentication_token", unique=True),
        Index("recovery_token_idx", "recovery_token", unique=True),
        Index("users_email_partial_key", "email", unique=True),
        Index("users_instance_id_email_idx", "instance_id"),
        Index("users_instance_id_idx", "instance_id"),
        {"comment": "Auth: Stores user login data within a secure schema.", "schema": "auth"},
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    is_sso_user: Mapped[bool] = mapped_column(
        Boolean,
        server_default=text("false"),
        comment="Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.",
    )
    instance_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    aud: Mapped[Optional[str]] = mapped_column(String(255))
    role: Mapped[Optional[str]] = mapped_column(String(255))
    email: Mapped[Optional[str]] = mapped_column(String(255))
    encrypted_password: Mapped[Optional[str]] = mapped_column(String(255))
    email_confirmed_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    invited_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    confirmation_token: Mapped[Optional[str]] = mapped_column(String(255))
    confirmation_sent_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    recovery_token: Mapped[Optional[str]] = mapped_column(String(255))
    recovery_sent_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    email_change_token_new: Mapped[Optional[str]] = mapped_column(String(255))
    email_change: Mapped[Optional[str]] = mapped_column(String(255))
    email_change_sent_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    last_sign_in_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    raw_app_meta_data: Mapped[Optional[dict]] = mapped_column(JSONB)
    raw_user_meta_data: Mapped[Optional[dict]] = mapped_column(JSONB)
    is_super_admin: Mapped[Optional[bool]] = mapped_column(Boolean)
    created_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    updated_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    phone: Mapped[Optional[str]] = mapped_column(
        Text, server_default=text("NULL::character varying")
    )
    phone_confirmed_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    phone_change: Mapped[Optional[str]] = mapped_column(
        Text, server_default=text("''::character varying")
    )
    phone_change_token: Mapped[Optional[str]] = mapped_column(
        String(255), server_default=text("''::character varying")
    )
    phone_change_sent_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    confirmed_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        DateTime(True), Computed("LEAST(email_confirmed_at, phone_confirmed_at)", persisted=True)
    )
    email_change_token_current: Mapped[Optional[str]] = mapped_column(
        String(255), server_default=text("''::character varying")
    )
    email_change_confirm_status: Mapped[Optional[int]] = mapped_column(
        SmallInteger, server_default=text("0")
    )
    banned_until: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    reauthentication_token: Mapped[Optional[str]] = mapped_column(
        String(255), server_default=text("''::character varying")
    )
    reauthentication_sent_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    deleted_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))

    dataset_history_metadata: Mapped[List["DatasetHistoryMetadata"]] = relationship(
        "DatasetHistoryMetadata", back_populates="user"
    )
    djt_history_metadata: Mapped[List["DjtHistoryMetadata"]] = relationship(
        "DjtHistoryMetadata", back_populates="user"
    )
    oauth2_connection: Mapped[List["Oauth2Connection"]] = relationship(
        "Oauth2Connection", back_populates="user"
    )
    project: Mapped[List["Project"]] = relationship("Project", back_populates="user")
    task_link: Mapped[List["TaskLink"]] = relationship("TaskLink", back_populates="user")
    dataset_metadata: Mapped[List["DatasetMetadata"]] = relationship(
        "DatasetMetadata", back_populates="user"
    )
    file: Mapped[List["File"]] = relationship("File", back_populates="user")
    graph: Mapped[List["Graph"]] = relationship("Graph", back_populates="user")
    sync_options: Mapped[List["SyncOptions"]] = relationship("SyncOptions", back_populates="user")
    synced_folder: Mapped[List["SyncedFolder"]] = relationship(
        "SyncedFolder", back_populates="user"
    )
    node: Mapped[List["Node"]] = relationship("Node", back_populates="user")
    synced_file: Mapped[List["SyncedFile"]] = relationship("SyncedFile", back_populates="user")
    edge: Mapped[List["Edge"]] = relationship("Edge", back_populates="user")
    file_data: Mapped[List["FileData"]] = relationship("FileData", back_populates="user")
    graph_draft: Mapped[List["GraphDraft"]] = relationship("GraphDraft", back_populates="user")
    node_history: Mapped[List["NodeHistory"]] = relationship("NodeHistory", back_populates="user")
    synced_file_dataset_metadata: Mapped[List["SyncedFileDatasetMetadata"]] = relationship(
        "SyncedFileDatasetMetadata", back_populates="user"
    )
    edge_history: Mapped[List["EdgeHistory"]] = relationship("EdgeHistory", back_populates="user")
    graph_draft_node: Mapped[List["GraphDraftNode"]] = relationship(
        "GraphDraftNode", back_populates="user"
    )
    graph_draft_edge: Mapped[List["GraphDraftEdge"]] = relationship(
        "GraphDraftEdge", back_populates="user"
    )


class Chemical(Base):
    __tablename__ = "chemical"
    __table_args__ = (
        PrimaryKeyConstraint("id", name="chemical_pkey"),
        UniqueConstraint("inchi_key", name="chemical_inchi_key_key"),
        Index("chemical_inchi_key_idx", "inchi_key"),
        Index("chemical_name_search_idx", "name"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    inchi: Mapped[str] = mapped_column(Text)
    inchi_key: Mapped[str] = mapped_column(Text)
    name: Mapped[Optional[str]] = mapped_column(Text)

    stoichiometry: Mapped[List["Stoichiometry"]] = relationship(
        "Stoichiometry", back_populates="chemical"
    )
    synonym: Mapped[List["Synonym"]] = relationship("Synonym", back_populates="chemical")
    chemical_history: Mapped[List["ChemicalHistory"]] = relationship(
        "ChemicalHistory", back_populates="chemical"
    )


class Definition(Base):
    __tablename__ = "definition"
    __table_args__ = (
        CheckConstraint(
            'jsonb_matches_schema(\'{\n    "type": "object",\n    "properties": {\n      "bucket": {"type": "string"},\n      "bucketKey": {"type": "string"},\n      "buttonText": {"type": "string"},\n      "dataKey": {"type": "string"},\n      "displayName": {"type": "string"},\n      "gridSize": {"type": "number"},\n      "height": {"type": "number"},\n      "linkTemplate": {"type": "string"},\n      "nameTemplate": {"type": "string"},\n      "pathTemplate": {"type": "string"},\n      "sizeKeyBytes": {"type": "string"},\n      "width": {"type": "number"},\n      "optionsTable": {\n        "type": "object",\n        "patternProperties": {\n          "^[a-zA-Z0-9_]+$": {\n            "type": "object",\n            "properties": {\n              "nameKey": {"type": "string"},\n              "linkTemplate": {"type": "string"}\n            },\n            "additionalProperties": false\n          }\n        }\n      }\n    },\n    "additionalProperties": false\n  }\'::json, options)',
            name="definition_options_check",
        ),
        PrimaryKeyConstraint("id", name="definition_pkey"),
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    component_id: Mapped[str] = mapped_column(Text)
    options: Mapped[dict] = mapped_column(JSONB, server_default=text("'{}'::jsonb"))


t_node_search = Table(
    "node_search",
    Base.metadata,
    Column("id", BigInteger),
    Column("node_type_id", Text),
    Column("name", Text),
    Column("value", Text),
    Column("source", Text),
    Index("node_search_value_exact_idx", "value"),
    Index("node_search_value_idx", "value"),
)


class NodeType(Base):
    __tablename__ = "node_type"
    __table_args__ = (
        CheckConstraint(
            'jsonb_matches_schema(\'{\n    "type": "object",\n    "properties": {\n      "joinLimits": {\n        "patternProperties": {\n          "^[a-zA-Z0-9_]+$": {"type": "integer"}\n        }\n      }\n    }\n  }\'::json, options)',
            name="node_type_options_check",
        ),
        PrimaryKeyConstraint("id", name="node_type_pkey"),
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    top_level: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    list_definition_ids: Mapped[list] = mapped_column(ARRAY(Text()))
    detail_definition_ids: Mapped[list] = mapped_column(ARRAY(Text()))
    options: Mapped[dict] = mapped_column(JSONB, server_default=text("'{}'::jsonb"))
    icon: Mapped[Optional[str]] = mapped_column(Text)

    node: Mapped[List["Node"]] = relationship("Node", back_populates="node_type")


t_pg_all_foreign_keys = Table(
    "pg_all_foreign_keys",
    Base.metadata,
    Column("fk_schema_name", String),
    Column("fk_table_name", String),
    Column("fk_constraint_name", String),
    Column("fk_table_oid", OID),
    Column("fk_columns", ARRAY(String())),
    Column("pk_schema_name", String),
    Column("pk_table_name", String),
    Column("pk_constraint_name", String),
    Column("pk_table_oid", OID),
    Column("pk_index_name", String),
    Column("pk_columns", ARRAY(String())),
    Column("match_type", Text),
    Column("on_delete", Text),
    Column("on_update", Text),
    Column("is_deferrable", Boolean),
    Column("is_deferred", Boolean),
)


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


class Protein(Base):
    __tablename__ = "protein"
    __table_args__ = (
        PrimaryKeyConstraint("id", name="protein_pkey"),
        UniqueConstraint("hash", name="protein_hash_key"),
        Index("protein_name_search_idx", "name"),
        Index("protein_short_name_search_idx", "short_name"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    sequence: Mapped[str] = mapped_column(Text)
    hash: Mapped[str] = mapped_column(Text)
    name: Mapped[Optional[str]] = mapped_column(Text)
    short_name: Mapped[Optional[str]] = mapped_column(Text)

    reaction: Mapped[List["Reaction"]] = relationship(
        "Reaction", secondary="protein_reaction", back_populates="protein"
    )
    species: Mapped[List["Species"]] = relationship(
        "Species", secondary="protein_species", back_populates="protein"
    )
    synonym: Mapped[List["Synonym"]] = relationship("Synonym", back_populates="protein")
    protein_history: Mapped[List["ProteinHistory"]] = relationship(
        "ProteinHistory", back_populates="protein"
    )


class Reaction(Base):
    __tablename__ = "reaction"
    __table_args__ = (
        PrimaryKeyConstraint("id", name="reaction_pkey"),
        UniqueConstraint("hash", name="reaction_hash_key"),
        Index("reaction_name_search_idx", "name"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    hash: Mapped[str] = mapped_column(Text)
    name: Mapped[Optional[str]] = mapped_column(Text)

    protein: Mapped[List["Protein"]] = relationship(
        "Protein", secondary="protein_reaction", back_populates="reaction"
    )
    stoichiometry: Mapped[List["Stoichiometry"]] = relationship(
        "Stoichiometry", back_populates="reaction"
    )
    synonym: Mapped[List["Synonym"]] = relationship("Synonym", back_populates="reaction")
    reaction_history: Mapped[List["ReactionHistory"]] = relationship(
        "ReactionHistory", back_populates="reaction"
    )


class ResourceType(Base):
    __tablename__ = "resource_type"
    __table_args__ = (PrimaryKeyConstraint("id", name="resource_type_pkey"),)

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )


class Species(Base):
    __tablename__ = "species"
    __table_args__ = (
        PrimaryKeyConstraint("id", name="species_pkey"),
        UniqueConstraint("hash", name="species_hash_key"),
        Index("species_name_search_idx", "name"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    hash: Mapped[str] = mapped_column(Text)
    name: Mapped[Optional[str]] = mapped_column(Text)
    rank: Mapped[Optional[str]] = mapped_column(Text)

    protein: Mapped[List["Protein"]] = relationship(
        "Protein", secondary="protein_species", back_populates="species"
    )
    genome: Mapped[List["Genome"]] = relationship("Genome", back_populates="species")
    synonym: Mapped[List["Synonym"]] = relationship("Synonym", back_populates="species")
    species_history: Mapped[List["SpeciesHistory"]] = relationship(
        "SpeciesHistory", back_populates="species"
    )


t_tap_funky = Table(
    "tap_funky",
    Base.metadata,
    Column("oid", OID),
    Column("schema", String),
    Column("name", String),
    Column("owner", String),
    Column("args", Text),
    Column("returns", Text),
    Column("langoid", OID),
    Column("is_strict", Boolean),
    Column("kind", String),
    Column("is_definer", Boolean),
    Column("returns_set", Boolean),
    Column("volatility", CHAR(1)),
    Column("is_visible", Boolean),
)


class DatasetHistoryMetadata(Base):
    __tablename__ = "dataset_history_metadata"
    __table_args__ = (
        CheckConstraint(
            "change_type = ANY (ARRAY['create'::text, 'modify'::text, 'delete'::text])",
            name="dataset_history_metadata_change_type_check",
        ),
        ForeignKeyConstraint(
            ["user_id"], ["auth.users.id"], name="dataset_history_metadata_user_id_fkey"
        ),
        PrimaryKeyConstraint("id", name="dataset_history_metadata_pkey"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    dataset_table_name: Mapped[str] = mapped_column(Text)
    dataset_row_id: Mapped[int] = mapped_column(BigInteger)
    source: Mapped[str] = mapped_column(Text)
    source_details: Mapped[str] = mapped_column(Text)
    change_type: Mapped[str] = mapped_column(Text)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    time: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    change_column: Mapped[Optional[str]] = mapped_column(Text)

    user: Mapped["Users"] = relationship("Users", back_populates="dataset_history_metadata")


class DjtHistoryMetadata(Base):
    __tablename__ = "djt_history_metadata"
    __table_args__ = (
        CheckConstraint(
            "change_type = ANY (ARRAY['create'::text, 'modify'::text, 'delete'::text])",
            name="djt_history_metadata_change_type_check",
        ),
        ForeignKeyConstraint(
            ["user_id"], ["auth.users.id"], name="djt_history_metadata_user_id_fkey"
        ),
        PrimaryKeyConstraint("id", name="djt_history_metadata_pkey"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    djt_table_name: Mapped[str] = mapped_column(Text)
    djt_row_id: Mapped[int] = mapped_column(BigInteger)
    source: Mapped[str] = mapped_column(Text)
    source_details: Mapped[str] = mapped_column(Text)
    change_type: Mapped[str] = mapped_column(Text)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    time: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    change_column: Mapped[Optional[str]] = mapped_column(Text)

    user: Mapped["Users"] = relationship("Users", back_populates="djt_history_metadata")


class Genome(Base):
    __tablename__ = "genome"
    __table_args__ = (
        ForeignKeyConstraint(["species_id"], ["species.id"], name="genome_species_id_fkey"),
        PrimaryKeyConstraint("id", name="genome_pkey"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    bucket: Mapped[str] = mapped_column(Text, server_default=text("'genome_sequences'::text"))
    species_id: Mapped[int] = mapped_column(BigInteger)
    strain_name: Mapped[Optional[str]] = mapped_column(Text)
    genbank_gz_object: Mapped[Optional[str]] = mapped_column(Text)
    genbank_gz_file_size_bytes: Mapped[Optional[int]] = mapped_column(BigInteger)

    species: Mapped["Species"] = relationship("Species", back_populates="genome")
    genome_history: Mapped[List["GenomeHistory"]] = relationship(
        "GenomeHistory", back_populates="genome"
    )
    genome_synonym: Mapped[List["GenomeSynonym"]] = relationship(
        "GenomeSynonym", back_populates="genome"
    )


class Oauth2Connection(Base):
    __tablename__ = "oauth2_connection"
    __table_args__ = (
        CheckConstraint("name = 'google'::text", name="oauth2_connection_name_check"),
        CheckConstraint("token_type = 'Bearer'::text", name="oauth2_connection_token_type_check"),
        ForeignKeyConstraint(
            ["user_id"],
            ["auth.users.id"],
            ondelete="CASCADE",
            name="oauth2_connection_user_id_fkey",
        ),
        PrimaryKeyConstraint("id", name="oauth2_connection_pkey"),
        UniqueConstraint("user_id", "name", name="oauth2_connection_user_id_name_key"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    name: Mapped[str] = mapped_column(Text)
    needs_reconnect: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    access_token: Mapped[Optional[str]] = mapped_column(Text)
    refresh_token: Mapped[Optional[str]] = mapped_column(Text)
    expires_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    scope: Mapped[Optional[list]] = mapped_column(
        ARRAY(Text()), server_default=text("'{}'::text[]")
    )
    token_type: Mapped[Optional[str]] = mapped_column(Text)
    state: Mapped[Optional[str]] = mapped_column(Text)

    user: Mapped["Users"] = relationship("Users", back_populates="oauth2_connection")


class Profile(Users):
    __tablename__ = "profile"
    __table_args__ = (
        ForeignKeyConstraint(["id"], ["auth.users.id"], ondelete="CASCADE", name="profile_id_fkey"),
        PrimaryKeyConstraint("id", name="profile_pkey"),
        UniqueConstraint("username", name="profile_username_key"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    username: Mapped[Optional[str]] = mapped_column(Text)

    article: Mapped[List["Article"]] = relationship("Article", back_populates="user")
    chemical_history: Mapped[List["ChemicalHistory"]] = relationship(
        "ChemicalHistory", back_populates="user"
    )
    genome_history: Mapped[List["GenomeHistory"]] = relationship(
        "GenomeHistory", back_populates="user"
    )
    protein_history: Mapped[List["ProteinHistory"]] = relationship(
        "ProteinHistory", back_populates="user"
    )
    reaction_history: Mapped[List["ReactionHistory"]] = relationship(
        "ReactionHistory", back_populates="user"
    )
    species_history: Mapped[List["SpeciesHistory"]] = relationship(
        "SpeciesHistory", back_populates="user"
    )
    user_role: Mapped[List["UserRole"]] = relationship("UserRole", back_populates="user")


class Project(Base):
    __tablename__ = "project"
    __table_args__ = (
        ForeignKeyConstraint(
            ["user_id"], ["auth.users.id"], ondelete="CASCADE", name="project_user_id_fkey"
        ),
        PrimaryKeyConstraint("id", name="project_pkey"),
        UniqueConstraint("user_id", "name", name="project_user_id_name_key"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    name: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("(now() AT TIME ZONE 'utc'::text)")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid)

    user: Mapped["Users"] = relationship("Users", back_populates="project")
    file: Mapped[List["File"]] = relationship("File", back_populates="project")
    graph: Mapped[List["Graph"]] = relationship("Graph", back_populates="project")
    sync_options: Mapped[List["SyncOptions"]] = relationship(
        "SyncOptions", back_populates="project"
    )
    synced_folder: Mapped[List["SyncedFolder"]] = relationship(
        "SyncedFolder", back_populates="project"
    )


t_protein_reaction = Table(
    "protein_reaction",
    Base.metadata,
    Column("protein_id", BigInteger, primary_key=True, nullable=False),
    Column("reaction_id", BigInteger, primary_key=True, nullable=False),
    ForeignKeyConstraint(
        ["protein_id"], ["protein.id"], ondelete="CASCADE", name="protein_reaction_protein_id_fkey"
    ),
    ForeignKeyConstraint(
        ["reaction_id"],
        ["reaction.id"],
        ondelete="CASCADE",
        name="protein_reaction_reaction_id_fkey",
    ),
    PrimaryKeyConstraint("protein_id", "reaction_id", name="protein_reaction_pkey"),
    Index("protein_reaction_reverse_idx", "reaction_id", "protein_id"),
)


t_protein_species = Table(
    "protein_species",
    Base.metadata,
    Column("protein_id", BigInteger, primary_key=True, nullable=False),
    Column("species_id", BigInteger, primary_key=True, nullable=False),
    ForeignKeyConstraint(
        ["protein_id"], ["protein.id"], ondelete="CASCADE", name="protein_species_protein_id_fkey"
    ),
    ForeignKeyConstraint(
        ["species_id"], ["species.id"], ondelete="CASCADE", name="protein_species_species_id_fkey"
    ),
    PrimaryKeyConstraint("protein_id", "species_id", name="protein_species_pkey"),
    Index("protein_species_reverse_idx", "species_id", "protein_id"),
)


class Stoichiometry(Base):
    __tablename__ = "stoichiometry"
    __table_args__ = (
        ForeignKeyConstraint(
            ["chemical_id"],
            ["chemical.id"],
            ondelete="CASCADE",
            name="stoichiometry_chemical_id_fkey",
        ),
        ForeignKeyConstraint(
            ["reaction_id"],
            ["reaction.id"],
            ondelete="CASCADE",
            name="stoichiometry_reaction_id_fkey",
        ),
        PrimaryKeyConstraint("chemical_id", "reaction_id", name="stoichiometry_pkey"),
        Index("stoichiometry_reaction_id_idx", "reaction_id"),
        Index("stoichiometry_reverse_idx", "reaction_id", "chemical_id"),
    )

    chemical_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    reaction_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    coefficient: Mapped[float] = mapped_column(Double(53))
    compartment_rule: Mapped[Optional[str]] = mapped_column(Text)

    chemical: Mapped["Chemical"] = relationship("Chemical", back_populates="stoichiometry")
    reaction: Mapped["Reaction"] = relationship("Reaction", back_populates="stoichiometry")


class Synonym(Base):
    __tablename__ = "synonym"
    __table_args__ = (
        ForeignKeyConstraint(
            ["chemical_id"], ["chemical.id"], ondelete="CASCADE", name="synonym_chemical_id_fkey"
        ),
        ForeignKeyConstraint(
            ["protein_id"], ["protein.id"], ondelete="CASCADE", name="synonym_protein_id_fkey"
        ),
        ForeignKeyConstraint(
            ["reaction_id"], ["reaction.id"], ondelete="CASCADE", name="synonym_reaction_id_fkey"
        ),
        ForeignKeyConstraint(
            ["species_id"], ["species.id"], ondelete="CASCADE", name="synonym_species_id_fkey"
        ),
        PrimaryKeyConstraint("id", name="synonym_pkey"),
        UniqueConstraint(
            "chemical_id", "value", "source", name="synonym_chemical_id_value_source_key"
        ),
        UniqueConstraint(
            "protein_id", "value", "source", name="synonym_protein_id_value_source_key"
        ),
        UniqueConstraint(
            "reaction_id", "value", "source", name="synonym_reaction_id_value_source_key"
        ),
        UniqueConstraint(
            "species_id", "value", "source", name="synonym_species_id_value_source_key"
        ),
        Index("synonym_value_idx", "value"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    source: Mapped[str] = mapped_column(Text)
    value: Mapped[str] = mapped_column(Text)
    chemical_id: Mapped[Optional[int]] = mapped_column(BigInteger)
    reaction_id: Mapped[Optional[int]] = mapped_column(BigInteger)
    protein_id: Mapped[Optional[int]] = mapped_column(BigInteger)
    species_id: Mapped[Optional[int]] = mapped_column(BigInteger)

    chemical: Mapped["Chemical"] = relationship("Chemical", back_populates="synonym")
    protein: Mapped["Protein"] = relationship("Protein", back_populates="synonym")
    reaction: Mapped["Reaction"] = relationship("Reaction", back_populates="synonym")
    species: Mapped["Species"] = relationship("Species", back_populates="synonym")


class TaskLink(Base):
    __tablename__ = "task_link"
    __table_args__ = (
        ForeignKeyConstraint(["user_id"], ["auth.users.id"], name="task_link_user_id_fkey"),
        PrimaryKeyConstraint("id", name="task_link_pkey"),
    )

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

    user: Mapped["Users"] = relationship("Users", back_populates="task_link")
    dataset_metadata: Mapped[List["DatasetMetadata"]] = relationship(
        "DatasetMetadata", back_populates="sync_folder_task_link"
    )
    synced_folder: Mapped[List["SyncedFolder"]] = relationship(
        "SyncedFolder", back_populates="sync_folder_task_link"
    )
    synced_file: Mapped[List["SyncedFile"]] = relationship(
        "SyncedFile", back_populates="sync_file_to_dataset_task_link"
    )
    synced_file_dataset_metadata: Mapped[List["SyncedFileDatasetMetadata"]] = relationship(
        "SyncedFileDatasetMetadata", back_populates="sync_file_to_dataset_task_link"
    )


class Article(Base):
    __tablename__ = "article"
    __table_args__ = (
        ForeignKeyConstraint(["user_id"], ["profile.id"], name="article_user_id_fkey"),
        PrimaryKeyConstraint("id", name="article_pkey"),
        UniqueConstraint("user_id", "doi", name="article_user_id_doi_key"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    title: Mapped[str] = mapped_column(Text)
    authors: Mapped[dict] = mapped_column(JSONB)
    doi: Mapped[str] = mapped_column(Text)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    public: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    journal: Mapped[Optional[str]] = mapped_column(Text)

    user: Mapped["Profile"] = relationship("Profile", back_populates="article")


class ChemicalHistory(Base):
    __tablename__ = "chemical_history"
    __table_args__ = (
        CheckConstraint(
            "change_type = ANY (ARRAY['create'::text, 'update'::text, 'delete'::text])",
            name="chemical_history_change_type_check",
        ),
        ForeignKeyConstraint(
            ["chemical_id"],
            ["chemical.id"],
            ondelete="CASCADE",
            name="chemical_history_chemical_id_fkey",
        ),
        ForeignKeyConstraint(["user_id"], ["profile.id"], name="chemical_history_user_id_fkey"),
        PrimaryKeyConstraint("id", name="chemical_history_pkey"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    time: Mapped[datetime.datetime] = mapped_column(DateTime(True))
    chemical_id: Mapped[int] = mapped_column(BigInteger)
    change_type: Mapped[str] = mapped_column(Text)
    source: Mapped[Optional[str]] = mapped_column(Text)
    source_details: Mapped[Optional[str]] = mapped_column(Text)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    new_values: Mapped[Optional[dict]] = mapped_column(JSONB)

    chemical: Mapped["Chemical"] = relationship("Chemical", back_populates="chemical_history")
    user: Mapped["Profile"] = relationship("Profile", back_populates="chemical_history")


class DatasetMetadata(Base):
    __tablename__ = "dataset_metadata"
    __table_args__ = (
        ForeignKeyConstraint(
            ["sync_folder_task_link_id"],
            ["task_link.id"],
            name="dataset_metadata_sync_folder_task_link_id_fkey",
        ),
        ForeignKeyConstraint(["user_id"], ["auth.users.id"], name="dataset_metadata_user_id_fkey"),
        PrimaryKeyConstraint("id", name="dataset_metadata_pkey"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    project: Mapped[str] = mapped_column(Text, server_default=text("'default'::text"))
    table_name: Mapped[str] = mapped_column(Text)
    schema_name: Mapped[str] = mapped_column(Text)
    sync_folder_task_link_id: Mapped[Optional[int]] = mapped_column(BigInteger)

    sync_folder_task_link: Mapped["TaskLink"] = relationship(
        "TaskLink", back_populates="dataset_metadata"
    )
    user: Mapped["Users"] = relationship("Users", back_populates="dataset_metadata")
    synced_file_dataset_metadata: Mapped[List["SyncedFileDatasetMetadata"]] = relationship(
        "SyncedFileDatasetMetadata", back_populates="dataset_metadata"
    )


class File(Base):
    __tablename__ = "file"
    __table_args__ = (
        ForeignKeyConstraint(
            ["project_id"], ["project.id"], ondelete="CASCADE", name="file_project_id_fkey"
        ),
        ForeignKeyConstraint(
            ["user_id"], ["auth.users.id"], ondelete="CASCADE", name="file_user_id_fkey"
        ),
        PrimaryKeyConstraint("id", name="file_pkey"),
    )

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
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    project_id: Mapped[Optional[int]] = mapped_column(BigInteger)
    mime_type: Mapped[Optional[str]] = mapped_column(Text)
    tokens: Mapped[Optional[int]] = mapped_column(Integer)
    latest_task_id: Mapped[Optional[str]] = mapped_column(Text)

    project: Mapped["Project"] = relationship("Project", back_populates="file")
    user: Mapped["Users"] = relationship("Users", back_populates="file")


class GenomeHistory(Base):
    __tablename__ = "genome_history"
    __table_args__ = (
        CheckConstraint(
            "change_type = ANY (ARRAY['create'::text, 'modify'::text, 'delete'::text])",
            name="genome_history_change_type_check",
        ),
        ForeignKeyConstraint(
            ["genome_id"], ["genome.id"], ondelete="CASCADE", name="genome_history_genome_id_fkey"
        ),
        ForeignKeyConstraint(["user_id"], ["profile.id"], name="genome_history_user_id_fkey"),
        PrimaryKeyConstraint("id", name="genome_history_pkey"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    genome_id: Mapped[int] = mapped_column(BigInteger)
    source: Mapped[str] = mapped_column(Text)
    source_details: Mapped[str] = mapped_column(Text)
    change_type: Mapped[str] = mapped_column(Text)
    time: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    change_column: Mapped[Optional[str]] = mapped_column(Text)

    genome: Mapped["Genome"] = relationship("Genome", back_populates="genome_history")
    user: Mapped["Profile"] = relationship("Profile", back_populates="genome_history")


class GenomeSynonym(Base):
    __tablename__ = "genome_synonym"
    __table_args__ = (
        ForeignKeyConstraint(
            ["genome_id"], ["genome.id"], ondelete="CASCADE", name="genome_synonym_genome_id_fkey"
        ),
        PrimaryKeyConstraint("genome_id", "value", "source", name="genome_synonym_pkey"),
        Index("genome_synonym_value_idx", "value"),
    )

    source: Mapped[str] = mapped_column(Text, primary_key=True)
    value: Mapped[str] = mapped_column(Text, primary_key=True)
    genome_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    genome: Mapped["Genome"] = relationship("Genome", back_populates="genome_synonym")


class Graph(Base):
    __tablename__ = "graph"
    __table_args__ = (
        ForeignKeyConstraint(
            ["project_id"], ["project.id"], ondelete="CASCADE", name="graph_project_id_fkey"
        ),
        ForeignKeyConstraint(
            ["user_id"], ["auth.users.id"], ondelete="CASCADE", name="graph_user_id_fkey"
        ),
        PrimaryKeyConstraint("id", name="graph_pkey"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    name: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("(now() AT TIME ZONE 'utc'::text)")
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    project_id: Mapped[Optional[int]] = mapped_column(BigInteger)

    project: Mapped["Project"] = relationship("Project", back_populates="graph")
    user: Mapped["Users"] = relationship("Users", back_populates="graph")
    node: Mapped[List["Node"]] = relationship("Node", back_populates="graph")


class ProteinHistory(Base):
    __tablename__ = "protein_history"
    __table_args__ = (
        CheckConstraint(
            "change_type = ANY (ARRAY['create'::text, 'modify'::text, 'delete'::text])",
            name="protein_history_change_type_check",
        ),
        ForeignKeyConstraint(
            ["protein_id"],
            ["protein.id"],
            ondelete="CASCADE",
            name="protein_history_protein_id_fkey",
        ),
        ForeignKeyConstraint(["user_id"], ["profile.id"], name="protein_history_user_id_fkey"),
        PrimaryKeyConstraint("id", name="protein_history_pkey"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    protein_id: Mapped[int] = mapped_column(BigInteger)
    source: Mapped[str] = mapped_column(Text)
    source_details: Mapped[str] = mapped_column(Text)
    change_type: Mapped[str] = mapped_column(Text)
    time: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    change_column: Mapped[Optional[str]] = mapped_column(Text)

    protein: Mapped["Protein"] = relationship("Protein", back_populates="protein_history")
    user: Mapped["Profile"] = relationship("Profile", back_populates="protein_history")


class ReactionHistory(Base):
    __tablename__ = "reaction_history"
    __table_args__ = (
        CheckConstraint(
            "change_type = ANY (ARRAY['create'::text, 'update'::text, 'delete'::text])",
            name="reaction_history_change_type_check",
        ),
        ForeignKeyConstraint(
            ["reaction_id"],
            ["reaction.id"],
            ondelete="CASCADE",
            name="reaction_history_reaction_id_fkey",
        ),
        ForeignKeyConstraint(["user_id"], ["profile.id"], name="reaction_history_user_id_fkey"),
        PrimaryKeyConstraint("id", name="reaction_history_pkey"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    time: Mapped[datetime.datetime] = mapped_column(DateTime(True))
    reaction_id: Mapped[int] = mapped_column(BigInteger)
    change_type: Mapped[str] = mapped_column(Text)
    source: Mapped[Optional[str]] = mapped_column(Text)
    source_details: Mapped[Optional[str]] = mapped_column(Text)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    new_values: Mapped[Optional[dict]] = mapped_column(JSONB)

    reaction: Mapped["Reaction"] = relationship("Reaction", back_populates="reaction_history")
    user: Mapped["Profile"] = relationship("Profile", back_populates="reaction_history")


class SpeciesHistory(Base):
    __tablename__ = "species_history"
    __table_args__ = (
        CheckConstraint(
            "change_type = ANY (ARRAY['create'::text, 'modify'::text, 'delete'::text])",
            name="species_history_change_type_check",
        ),
        ForeignKeyConstraint(
            ["species_id"],
            ["species.id"],
            ondelete="CASCADE",
            name="species_history_species_id_fkey",
        ),
        ForeignKeyConstraint(["user_id"], ["profile.id"], name="species_history_user_id_fkey"),
        PrimaryKeyConstraint("id", name="species_history_pkey"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    species_id: Mapped[int] = mapped_column(BigInteger)
    source: Mapped[str] = mapped_column(Text)
    source_details: Mapped[str] = mapped_column(Text)
    change_type: Mapped[str] = mapped_column(Text)
    time: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    change_column: Mapped[Optional[str]] = mapped_column(Text)

    species: Mapped["Species"] = relationship("Species", back_populates="species_history")
    user: Mapped["Profile"] = relationship("Profile", back_populates="species_history")


class SyncOptions(Base):
    __tablename__ = "sync_options"
    __table_args__ = (
        CheckConstraint("source = 'google_drive'::text", name="sync_options_source_check"),
        ForeignKeyConstraint(
            ["project_id"], ["project.id"], ondelete="CASCADE", name="sync_options_project_id_fkey"
        ),
        ForeignKeyConstraint(["user_id"], ["auth.users.id"], name="sync_options_user_id_fkey"),
        PrimaryKeyConstraint("id", name="sync_options_pkey"),
        UniqueConstraint(
            "user_id", "project_id", "source", name="sync_options_user_id_project_id_source_key"
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    source: Mapped[str] = mapped_column(Text)
    auto_sync_extensions: Mapped[list] = mapped_column(
        ARRAY(Text()), server_default=text("'{.csv,.tsv}'::text[]")
    )
    has_seen_sync_options: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    project_id: Mapped[Optional[int]] = mapped_column(BigInteger)

    project: Mapped["Project"] = relationship("Project", back_populates="sync_options")
    user: Mapped["Users"] = relationship("Users", back_populates="sync_options")


class SyncedFolder(Base):
    __tablename__ = "synced_folder"
    __table_args__ = (
        CheckConstraint("source = 'google_drive'::text", name="synced_folder_source_check"),
        ForeignKeyConstraint(
            ["project_id"], ["project.id"], ondelete="CASCADE", name="synced_folder_project_id_fkey"
        ),
        ForeignKeyConstraint(
            ["sync_folder_task_link_id"],
            ["task_link.id"],
            name="synced_folder_sync_folder_task_link_id_fkey",
        ),
        ForeignKeyConstraint(
            ["user_id"], ["auth.users.id"], ondelete="CASCADE", name="synced_folder_user_id_fkey"
        ),
        PrimaryKeyConstraint("id", name="synced_folder_pkey"),
        UniqueConstraint(
            "user_id", "source", "remote_id", name="synced_folder_user_id_source_remote_id_key"
        ),
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
    source: Mapped[str] = mapped_column(Text)
    remote_id: Mapped[str] = mapped_column(Text)
    project_id: Mapped[Optional[int]] = mapped_column(BigInteger)
    sync_folder_task_link_id: Mapped[Optional[int]] = mapped_column(BigInteger)

    project: Mapped["Project"] = relationship("Project", back_populates="synced_folder")
    sync_folder_task_link: Mapped["TaskLink"] = relationship(
        "TaskLink", back_populates="synced_folder"
    )
    user: Mapped["Users"] = relationship("Users", back_populates="synced_folder")
    synced_file: Mapped[List["SyncedFile"]] = relationship(
        "SyncedFile", back_populates="synced_folder"
    )


class UserRole(Base):
    __tablename__ = "user_role"
    __table_args__ = (
        CheckConstraint(
            "role = ANY (ARRAY['admin'::text, 'curator'::text])", name="user_role_role_check"
        ),
        ForeignKeyConstraint(
            ["user_id"], ["profile.id"], ondelete="CASCADE", name="user_role_user_id_fkey"
        ),
        PrimaryKeyConstraint("user_id", "role", name="user_role_pkey"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    role: Mapped[str] = mapped_column(Text, primary_key=True)

    user: Mapped["Profile"] = relationship("Profile", back_populates="user_role")


class Node(Base):
    __tablename__ = "node"
    __table_args__ = (
        CheckConstraint(
            'jsonb_matches_schema(\'{\n    "type": "object"\n  }\'::json, data)',
            name="node_data_check",
        ),
        ForeignKeyConstraint(
            ["graph_id"], ["graph.id"], ondelete="CASCADE", name="node_graph_id_fkey"
        ),
        ForeignKeyConstraint(["node_type_id"], ["node_type.id"], name="node_node_type_id_fkey"),
        ForeignKeyConstraint(
            ["user_id"], ["auth.users.id"], ondelete="CASCADE", name="node_user_id_fkey"
        ),
        PrimaryKeyConstraint("id", name="node_pkey"),
        UniqueConstraint("hash", name="node_hash_key"),
        Index("node_node_type_id_idx", "node_type_id"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    node_type_id: Mapped[str] = mapped_column(Text)
    data: Mapped[dict] = mapped_column(JSONB, server_default=text("'{}'::jsonb"))
    hash: Mapped[str] = mapped_column(Text)
    graph_id: Mapped[Optional[int]] = mapped_column(BigInteger)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)

    graph: Mapped["Graph"] = relationship("Graph", back_populates="node")
    node_type: Mapped["NodeType"] = relationship("NodeType", back_populates="node")
    user: Mapped["Users"] = relationship("Users", back_populates="node")
    edge: Mapped[List["Edge"]] = relationship(
        "Edge", foreign_keys="[Edge.destination_id]", back_populates="destination"
    )
    edge_: Mapped[List["Edge"]] = relationship(
        "Edge", foreign_keys="[Edge.source_id]", back_populates="source"
    )
    node_history: Mapped[List["NodeHistory"]] = relationship("NodeHistory", back_populates="node")


class SyncedFile(Base):
    __tablename__ = "synced_file"
    __table_args__ = (
        CheckConstraint("source = 'google_drive'::text", name="synced_file_source_check"),
        ForeignKeyConstraint(
            ["sync_file_to_dataset_task_link_id"],
            ["task_link.id"],
            name="synced_file_sync_file_to_dataset_task_link_id_fkey",
        ),
        ForeignKeyConstraint(
            ["synced_folder_id"],
            ["synced_folder.id"],
            ondelete="CASCADE",
            name="synced_file_synced_folder_id_fkey",
        ),
        ForeignKeyConstraint(
            ["user_id"], ["auth.users.id"], ondelete="CASCADE", name="synced_file_user_id_fkey"
        ),
        PrimaryKeyConstraint("id", name="synced_file_pkey"),
        UniqueConstraint(
            "user_id", "source", "remote_id", name="synced_file_user_id_source_remote_id_key"
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    name: Mapped[str] = mapped_column(Text)
    mime_type: Mapped[str] = mapped_column(Text)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    synced_folder_id: Mapped[int] = mapped_column(BigInteger)
    is_folder: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    parent_ids: Mapped[list] = mapped_column(
        ARRAY(BigInteger()), server_default=text("'{}'::bigint[]")
    )
    source: Mapped[str] = mapped_column(Text)
    deleted: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    remote_id: Mapped[Optional[str]] = mapped_column(Text)
    conflict_details: Mapped[Optional[dict]] = mapped_column(JSONB)
    sync_file_to_dataset_task_link_id: Mapped[Optional[int]] = mapped_column(BigInteger)

    sync_file_to_dataset_task_link: Mapped["TaskLink"] = relationship(
        "TaskLink", back_populates="synced_file"
    )
    synced_folder: Mapped["SyncedFolder"] = relationship(
        "SyncedFolder", back_populates="synced_file"
    )
    user: Mapped["Users"] = relationship("Users", back_populates="synced_file")
    file_data: Mapped[List["FileData"]] = relationship("FileData", back_populates="synced_file")
    graph_draft: Mapped[List["GraphDraft"]] = relationship(
        "GraphDraft", back_populates="synced_file"
    )
    synced_file_dataset_metadata: Mapped[List["SyncedFileDatasetMetadata"]] = relationship(
        "SyncedFileDatasetMetadata", back_populates="synced_file"
    )


class Edge(Base):
    __tablename__ = "edge"
    __table_args__ = (
        ForeignKeyConstraint(
            ["destination_id"], ["node.id"], ondelete="CASCADE", name="edge_destination_id_fkey"
        ),
        ForeignKeyConstraint(
            ["source_id"], ["node.id"], ondelete="CASCADE", name="edge_source_id_fkey"
        ),
        ForeignKeyConstraint(
            ["user_id"], ["auth.users.id"], ondelete="CASCADE", name="edge_user_id_fkey"
        ),
        PrimaryKeyConstraint("id", name="edge_pkey"),
        UniqueConstraint("hash", name="edge_hash_key"),
        Index("edge_destination_id_idx", "destination_id"),
        Index("edge_source_id_idx", "source_id"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    source_id: Mapped[int] = mapped_column(BigInteger)
    destination_id: Mapped[int] = mapped_column(BigInteger)
    relationship_: Mapped[str] = mapped_column("relationship", Text)
    hash: Mapped[str] = mapped_column(Text)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    data: Mapped[Optional[dict]] = mapped_column(JSONB)

    destination: Mapped["Node"] = relationship(
        "Node", foreign_keys=[destination_id], back_populates="edge"
    )
    source: Mapped["Node"] = relationship("Node", foreign_keys=[source_id], back_populates="edge_")
    user: Mapped["Users"] = relationship("Users", back_populates="edge")
    edge_history: Mapped[List["EdgeHistory"]] = relationship("EdgeHistory", back_populates="edge")


class FileData(Base):
    __tablename__ = "file_data"
    __table_args__ = (
        ForeignKeyConstraint(
            ["synced_file_id"],
            ["synced_file.id"],
            ondelete="CASCADE",
            name="file_data_synced_file_id_fkey",
        ),
        ForeignKeyConstraint(
            ["user_id"], ["auth.users.id"], ondelete="CASCADE", name="file_data_user_id_fkey"
        ),
        PrimaryKeyConstraint("id", name="file_data_pkey"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    synced_file_id: Mapped[int] = mapped_column(BigInteger)
    text_content: Mapped[Optional[str]] = mapped_column(Text)
    text_summary: Mapped[Optional[str]] = mapped_column(Text)

    synced_file: Mapped["SyncedFile"] = relationship("SyncedFile", back_populates="file_data")
    user: Mapped["Users"] = relationship("Users", back_populates="file_data")


class GraphDraft(Base):
    __tablename__ = "graph_draft"
    __table_args__ = (
        ForeignKeyConstraint(
            ["synced_file_id"],
            ["synced_file.id"],
            ondelete="CASCADE",
            name="graph_draft_synced_file_id_fkey",
        ),
        ForeignKeyConstraint(
            ["user_id"], ["auth.users.id"], ondelete="CASCADE", name="graph_draft_user_id_fkey"
        ),
        PrimaryKeyConstraint("id", name="graph_draft_pkey"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    synced_file_id: Mapped[int] = mapped_column(BigInteger)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)

    synced_file: Mapped["SyncedFile"] = relationship("SyncedFile", back_populates="graph_draft")
    user: Mapped["Users"] = relationship("Users", back_populates="graph_draft")
    graph_draft_node: Mapped[List["GraphDraftNode"]] = relationship(
        "GraphDraftNode", back_populates="graph_draft"
    )
    graph_draft_edge: Mapped[List["GraphDraftEdge"]] = relationship(
        "GraphDraftEdge", back_populates="graph_draft"
    )


class NodeHistory(Base):
    __tablename__ = "node_history"
    __table_args__ = (
        CheckConstraint(
            "change_type = ANY (ARRAY['create'::text, 'modify'::text, 'delete'::text])",
            name="node_history_change_type_check",
        ),
        ForeignKeyConstraint(
            ["node_id"], ["node.id"], ondelete="CASCADE", name="node_history_node_id_fkey"
        ),
        ForeignKeyConstraint(
            ["user_id"], ["auth.users.id"], ondelete="CASCADE", name="node_history_user_id_fkey"
        ),
        PrimaryKeyConstraint("id", name="node_history_pkey"),
        Index("node_history_node_id_idx", "node_id"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    node_id: Mapped[int] = mapped_column(BigInteger)
    source: Mapped[str] = mapped_column(Text)
    source_details: Mapped[str] = mapped_column(Text)
    change_type: Mapped[str] = mapped_column(Text)
    time: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    change_column: Mapped[Optional[str]] = mapped_column(Text)

    node: Mapped["Node"] = relationship("Node", back_populates="node_history")
    user: Mapped["Users"] = relationship("Users", back_populates="node_history")


class SyncedFileDatasetMetadata(Base):
    __tablename__ = "synced_file_dataset_metadata"
    __table_args__ = (
        ForeignKeyConstraint(
            ["dataset_metadata_id"],
            ["dataset_metadata.id"],
            ondelete="CASCADE",
            name="synced_file_dataset_metadata_dataset_metadata_id_fkey",
        ),
        ForeignKeyConstraint(
            ["sync_file_to_dataset_task_link_id"],
            ["task_link.id"],
            name="synced_file_dataset_metadata_sync_file_to_dataset_task_lin_fkey",
        ),
        ForeignKeyConstraint(
            ["synced_file_id"],
            ["synced_file.id"],
            name="synced_file_dataset_metadata_synced_file_id_fkey",
        ),
        ForeignKeyConstraint(
            ["user_id"], ["auth.users.id"], name="synced_file_dataset_metadata_user_id_fkey"
        ),
        PrimaryKeyConstraint(
            "id", "synced_file_id", "dataset_metadata_id", name="synced_file_dataset_metadata_pkey"
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    synced_file_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    dataset_metadata_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    has_unprocessed_version: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
    last_processed_version: Mapped[Optional[str]] = mapped_column(Text)
    sync_file_to_dataset_task_link_id: Mapped[Optional[int]] = mapped_column(BigInteger)

    dataset_metadata: Mapped["DatasetMetadata"] = relationship(
        "DatasetMetadata", back_populates="synced_file_dataset_metadata"
    )
    sync_file_to_dataset_task_link: Mapped["TaskLink"] = relationship(
        "TaskLink", back_populates="synced_file_dataset_metadata"
    )
    synced_file: Mapped["SyncedFile"] = relationship(
        "SyncedFile", back_populates="synced_file_dataset_metadata"
    )
    user: Mapped["Users"] = relationship("Users", back_populates="synced_file_dataset_metadata")


class EdgeHistory(Base):
    __tablename__ = "edge_history"
    __table_args__ = (
        CheckConstraint(
            "change_type = ANY (ARRAY['create'::text, 'modify'::text, 'delete'::text])",
            name="edge_history_change_type_check",
        ),
        ForeignKeyConstraint(
            ["edge_id"], ["edge.id"], ondelete="CASCADE", name="edge_history_edge_id_fkey"
        ),
        ForeignKeyConstraint(["user_id"], ["auth.users.id"], name="edge_history_user_id_fkey"),
        PrimaryKeyConstraint("id", name="edge_history_pkey"),
        Index("edge_history_edge_id_idx", "edge_id"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    edge_id: Mapped[int] = mapped_column(BigInteger)
    source: Mapped[str] = mapped_column(Text)
    source_details: Mapped[str] = mapped_column(Text)
    change_type: Mapped[str] = mapped_column(Text)
    time: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    change_column: Mapped[Optional[str]] = mapped_column(Text)

    edge: Mapped["Edge"] = relationship("Edge", back_populates="edge_history")
    user: Mapped["Users"] = relationship("Users", back_populates="edge_history")


class GraphDraftNode(Base):
    __tablename__ = "graph_draft_node"
    __table_args__ = (
        ForeignKeyConstraint(
            ["graph_draft_id"],
            ["graph_draft.id"],
            ondelete="CASCADE",
            name="graph_draft_node_graph_draft_id_fkey",
        ),
        ForeignKeyConstraint(
            ["user_id"], ["auth.users.id"], ondelete="CASCADE", name="graph_draft_node_user_id_fkey"
        ),
        PrimaryKeyConstraint("id", name="graph_draft_node_pkey"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    graph_draft_id: Mapped[int] = mapped_column(BigInteger)
    value: Mapped[str] = mapped_column(Text)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)

    graph_draft: Mapped["GraphDraft"] = relationship(
        "GraphDraft", back_populates="graph_draft_node"
    )
    user: Mapped["Users"] = relationship("Users", back_populates="graph_draft_node")
    graph_draft_edge: Mapped[List["GraphDraftEdge"]] = relationship(
        "GraphDraftEdge",
        foreign_keys="[GraphDraftEdge.destination_id]",
        back_populates="destination",
    )
    graph_draft_edge_: Mapped[List["GraphDraftEdge"]] = relationship(
        "GraphDraftEdge", foreign_keys="[GraphDraftEdge.source_id]", back_populates="source"
    )


class GraphDraftEdge(Base):
    __tablename__ = "graph_draft_edge"
    __table_args__ = (
        ForeignKeyConstraint(
            ["destination_id"],
            ["graph_draft_node.id"],
            ondelete="CASCADE",
            name="graph_draft_edge_destination_id_fkey",
        ),
        ForeignKeyConstraint(
            ["graph_draft_id"],
            ["graph_draft.id"],
            ondelete="CASCADE",
            name="graph_draft_edge_graph_draft_id_fkey",
        ),
        ForeignKeyConstraint(
            ["source_id"],
            ["graph_draft_node.id"],
            ondelete="CASCADE",
            name="graph_draft_edge_source_id_fkey",
        ),
        ForeignKeyConstraint(
            ["user_id"], ["auth.users.id"], ondelete="CASCADE", name="graph_draft_edge_user_id_fkey"
        ),
        PrimaryKeyConstraint("id", name="graph_draft_edge_pkey"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        primary_key=True,
    )
    graph_draft_id: Mapped[int] = mapped_column(BigInteger)
    source_id: Mapped[int] = mapped_column(BigInteger)
    destination_id: Mapped[int] = mapped_column(BigInteger)
    value: Mapped[str] = mapped_column(Text)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)

    destination: Mapped["GraphDraftNode"] = relationship(
        "GraphDraftNode", foreign_keys=[destination_id], back_populates="graph_draft_edge"
    )
    graph_draft: Mapped["GraphDraft"] = relationship(
        "GraphDraft", back_populates="graph_draft_edge"
    )
    source: Mapped["GraphDraftNode"] = relationship(
        "GraphDraftNode", foreign_keys=[source_id], back_populates="graph_draft_edge_"
    )
    user: Mapped["Users"] = relationship("Users", back_populates="graph_draft_edge")
