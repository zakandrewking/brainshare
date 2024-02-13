from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Column,
    Computed,
    DateTime,
    Float,
    ForeignKeyConstraint,
    Identity,
    Index,
    Integer,
    PrimaryKeyConstraint,
    SmallInteger,
    String,
    Table,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()
metadata = Base.metadata


class Users(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            "(email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)",
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
        Index("users_instance_id_idx", "instance_id"),
        {"comment": "Auth: Stores user login data within a secure schema.", "schema": "auth"},
    )

    id = Column(UUID)
    is_sso_user = Column(
        Boolean,
        nullable=False,
        server_default=text("false"),
        comment="Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.",
    )
    instance_id = Column(UUID)
    aud = Column(String(255))
    role = Column(String(255))
    email = Column(String(255))
    encrypted_password = Column(String(255))
    email_confirmed_at = Column(DateTime(True))
    invited_at = Column(DateTime(True))
    confirmation_token = Column(String(255))
    confirmation_sent_at = Column(DateTime(True))
    recovery_token = Column(String(255))
    recovery_sent_at = Column(DateTime(True))
    email_change_token_new = Column(String(255))
    email_change = Column(String(255))
    email_change_sent_at = Column(DateTime(True))
    last_sign_in_at = Column(DateTime(True))
    raw_app_meta_data = Column(JSONB)
    raw_user_meta_data = Column(JSONB)
    is_super_admin = Column(Boolean)
    created_at = Column(DateTime(True))
    updated_at = Column(DateTime(True))
    phone = Column(Text, server_default=text("NULL::character varying"))
    phone_confirmed_at = Column(DateTime(True))
    phone_change = Column(Text, server_default=text("''::character varying"))
    phone_change_token = Column(String(255), server_default=text("''::character varying"))
    phone_change_sent_at = Column(DateTime(True))
    confirmed_at = Column(
        DateTime(True), Computed("LEAST(email_confirmed_at, phone_confirmed_at)", persisted=True)
    )
    email_change_token_current = Column(String(255), server_default=text("''::character varying"))
    email_change_confirm_status = Column(SmallInteger, server_default=text("0"))
    banned_until = Column(DateTime(True))
    reauthentication_token = Column(String(255), server_default=text("''::character varying"))
    reauthentication_sent_at = Column(DateTime(True))
    deleted_at = Column(DateTime(True))

    dataset_history_metadata = relationship("DatasetHistoryMetadata", back_populates="user")
    dataset_metadata = relationship("DatasetMetadata", back_populates="user")
    djt_history_metadata = relationship("DjtHistoryMetadata", back_populates="user")
    oauth2_connection = relationship("Oauth2Connection", back_populates="user")
    project = relationship("Project", back_populates="user")
    file = relationship("File", back_populates="user")
    graph = relationship("Graph", back_populates="user")
    synced_folder = relationship("SyncedFolder", back_populates="user")
    node = relationship("Node", back_populates="user")
    synced_file = relationship("SyncedFile", back_populates="user")
    edge = relationship("Edge", back_populates="user")
    file_data = relationship("FileData", back_populates="user")
    graph_draft = relationship("GraphDraft", back_populates="user")
    node_history = relationship("NodeHistory", back_populates="user")
    synced_file_dataset_metadata = relationship("SyncedFileDatasetMetadata", back_populates="user")
    edge_history = relationship("EdgeHistory", back_populates="user")
    graph_draft_node = relationship("GraphDraftNode", back_populates="user")
    graph_draft_edge = relationship("GraphDraftEdge", back_populates="user")


class Chemical(Base):
    __tablename__ = "chemical"
    __table_args__ = (
        PrimaryKeyConstraint("id", name="chemical_pkey"),
        UniqueConstraint("inchi_key", name="chemical_inchi_key_key"),
        Index("chemical_inchi_key_idx", "inchi_key"),
        Index("chemical_name_search_idx", "name"),
    )

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
    )
    inchi = Column(Text, nullable=False)
    inchi_key = Column(Text, nullable=False)
    name = Column(Text)

    stoichiometry = relationship("Stoichiometry", back_populates="chemical")
    synonym = relationship("Synonym", back_populates="chemical")
    chemical_history = relationship("ChemicalHistory", back_populates="chemical")


class Definition(Base):
    __tablename__ = "definition"
    __table_args__ = (
        CheckConstraint(
            'jsonb_matches_schema(\'{\n    "type": "object",\n    "properties": {\n      "bucket": {"type": "string"},\n      "bucketKey": {"type": "string"},\n      "buttonText": {"type": "string"},\n      "dataKey": {"type": "string"},\n      "displayName": {"type": "string"},\n      "gridSize": {"type": "number"},\n      "height": {"type": "number"},\n      "linkTemplate": {"type": "string"},\n      "nameTemplate": {"type": "string"},\n      "pathTemplate": {"type": "string"},\n      "sizeKeyBytes": {"type": "string"},\n      "width": {"type": "number"},\n      "optionsTable": {\n        "type": "object",\n        "patternProperties": {\n          "^[a-zA-Z0-9_]+$": {\n            "type": "object",\n            "properties": {\n              "nameKey": {"type": "string"},\n              "linkTemplate": {"type": "string"}\n            },\n            "additionalProperties": false\n          }\n        }\n      }\n    },\n    "additionalProperties": false\n  }\'::json, options)',
            name="definition_options_check",
        ),
        PrimaryKeyConstraint("id", name="definition_pkey"),
    )

    id = Column(Text)
    component_id = Column(Text, nullable=False)
    options = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))


t_node_search = Table(
    "node_search",
    metadata,
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

    id = Column(Text)
    top_level = Column(Boolean, nullable=False, server_default=text("false"))
    list_definition_ids = Column(ARRAY(Text()), nullable=False)
    detail_definition_ids = Column(ARRAY(Text()), nullable=False)
    options = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    icon = Column(Text)

    node = relationship("Node", back_populates="node_type")


class Protein(Base):
    __tablename__ = "protein"
    __table_args__ = (
        PrimaryKeyConstraint("id", name="protein_pkey"),
        UniqueConstraint("hash", name="protein_hash_key"),
        Index("protein_name_search_idx", "name"),
        Index("protein_short_name_search_idx", "short_name"),
    )

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
    )
    sequence = Column(Text, nullable=False)
    hash = Column(Text, nullable=False)
    name = Column(Text)
    short_name = Column(Text)

    reaction = relationship("Reaction", secondary="protein_reaction", back_populates="protein")
    species = relationship("Species", secondary="protein_species", back_populates="protein")
    synonym = relationship("Synonym", back_populates="protein")
    protein_history = relationship("ProteinHistory", back_populates="protein")


class Reaction(Base):
    __tablename__ = "reaction"
    __table_args__ = (
        PrimaryKeyConstraint("id", name="reaction_pkey"),
        UniqueConstraint("hash", name="reaction_hash_key"),
        Index("reaction_name_search_idx", "name"),
    )

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
    )
    hash = Column(Text, nullable=False)
    name = Column(Text)

    protein = relationship("Protein", secondary="protein_reaction", back_populates="reaction")
    stoichiometry = relationship("Stoichiometry", back_populates="reaction")
    synonym = relationship("Synonym", back_populates="reaction")
    reaction_history = relationship("ReactionHistory", back_populates="reaction")


class ResourceType(Base):
    __tablename__ = "resource_type"
    __table_args__ = (PrimaryKeyConstraint("id", name="resource_type_pkey"),)

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
    )


class Species(Base):
    __tablename__ = "species"
    __table_args__ = (
        PrimaryKeyConstraint("id", name="species_pkey"),
        UniqueConstraint("hash", name="species_hash_key"),
        Index("species_name_search_idx", "name"),
    )

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
    )
    hash = Column(Text, nullable=False)
    name = Column(Text)
    rank = Column(Text)

    protein = relationship("Protein", secondary="protein_species", back_populates="species")
    genome = relationship("Genome", back_populates="species")
    synonym = relationship("Synonym", back_populates="species")
    species_history = relationship("SpeciesHistory", back_populates="species")


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

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
    )
    dataset_table_name = Column(Text, nullable=False)
    dataset_row_id = Column(BigInteger, nullable=False)
    source = Column(Text, nullable=False)
    source_details = Column(Text, nullable=False)
    change_type = Column(Text, nullable=False)
    user_id = Column(UUID)
    time = Column(DateTime)
    change_column = Column(Text)

    user = relationship("Users", back_populates="dataset_history_metadata")


class DatasetMetadata(Base):
    __tablename__ = "dataset_metadata"
    __table_args__ = (
        ForeignKeyConstraint(["user_id"], ["auth.users.id"], name="dataset_metadata_user_id_fkey"),
        PrimaryKeyConstraint("id", name="dataset_metadata_pkey"),
        UniqueConstraint("table_name", name="dataset_metadata_table_name_key"),
        UniqueConstraint(
            "user_id", "project", "name", name="dataset_metadata_user_id_project_name_key"
        ),
    )

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
    )
    user_id = Column(UUID, nullable=False)
    project = Column(Text, nullable=False, server_default=text("'default'::text"))
    name = Column(Text, nullable=False)
    table_name = Column(Text, nullable=False)

    user = relationship("Users", back_populates="dataset_metadata")
    synced_file_dataset_metadata = relationship(
        "SyncedFileDatasetMetadata", back_populates="dataset_metadata"
    )


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

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
    )
    djt_table_name = Column(Text, nullable=False)
    djt_row_id = Column(BigInteger, nullable=False)
    source = Column(Text, nullable=False)
    source_details = Column(Text, nullable=False)
    change_type = Column(Text, nullable=False)
    user_id = Column(UUID)
    time = Column(DateTime)
    change_column = Column(Text)

    user = relationship("Users", back_populates="djt_history_metadata")


class Genome(Base):
    __tablename__ = "genome"
    __table_args__ = (
        ForeignKeyConstraint(["species_id"], ["species.id"], name="genome_species_id_fkey"),
        PrimaryKeyConstraint("id", name="genome_pkey"),
    )

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
    )
    bucket = Column(Text, nullable=False, server_default=text("'genome_sequences'::text"))
    species_id = Column(BigInteger, nullable=False)
    strain_name = Column(Text)
    genbank_gz_object = Column(Text)
    genbank_gz_file_size_bytes = Column(BigInteger)

    species = relationship("Species", back_populates="genome")
    genome_history = relationship("GenomeHistory", back_populates="genome")
    genome_synonym = relationship("GenomeSynonym", back_populates="genome")


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

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
    )
    user_id = Column(UUID, nullable=False)
    name = Column(Text, nullable=False)
    needs_reconnect = Column(Boolean, nullable=False, server_default=text("false"))
    access_token = Column(Text)
    refresh_token = Column(Text)
    expires_at = Column(DateTime)
    scope = Column(ARRAY(Text()), server_default=text("'{}'::text[]"))
    token_type = Column(Text)
    state = Column(Text)

    user = relationship("Users", back_populates="oauth2_connection")


class Profile(Users):
    __tablename__ = "profile"
    __table_args__ = (
        ForeignKeyConstraint(["id"], ["auth.users.id"], ondelete="CASCADE", name="profile_id_fkey"),
        PrimaryKeyConstraint("id", name="profile_pkey"),
        UniqueConstraint("username", name="profile_username_key"),
    )

    id = Column(UUID)
    username = Column(Text)

    article = relationship("Article", back_populates="user")
    chemical_history = relationship("ChemicalHistory", back_populates="user")
    genome_history = relationship("GenomeHistory", back_populates="user")
    protein_history = relationship("ProteinHistory", back_populates="user")
    reaction_history = relationship("ReactionHistory", back_populates="user")
    species_history = relationship("SpeciesHistory", back_populates="user")
    user_role = relationship("UserRole", back_populates="user")


class Project(Base):
    __tablename__ = "project"
    __table_args__ = (
        ForeignKeyConstraint(
            ["user_id"], ["auth.users.id"], ondelete="CASCADE", name="project_user_id_fkey"
        ),
        PrimaryKeyConstraint("id", name="project_pkey"),
        UniqueConstraint("user_id", "name", name="project_user_id_name_key"),
    )

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
    )
    name = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    user_id = Column(UUID, nullable=False)

    user = relationship("Users", back_populates="project")
    file = relationship("File", back_populates="project")
    graph = relationship("Graph", back_populates="project")
    synced_folder = relationship("SyncedFolder", back_populates="project")


t_protein_reaction = Table(
    "protein_reaction",
    metadata,
    Column("protein_id", BigInteger, nullable=False),
    Column("reaction_id", BigInteger, nullable=False),
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
    metadata,
    Column("protein_id", BigInteger, nullable=False),
    Column("species_id", BigInteger, nullable=False),
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

    chemical_id = Column(BigInteger, nullable=False)
    reaction_id = Column(BigInteger, nullable=False)
    coefficient = Column(Float(53), nullable=False)
    compartment_rule = Column(Text)

    chemical = relationship("Chemical", back_populates="stoichiometry")
    reaction = relationship("Reaction", back_populates="stoichiometry")


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

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
    )
    source = Column(Text, nullable=False)
    value = Column(Text, nullable=False)
    chemical_id = Column(BigInteger)
    reaction_id = Column(BigInteger)
    protein_id = Column(BigInteger)
    species_id = Column(BigInteger)

    chemical = relationship("Chemical", back_populates="synonym")
    protein = relationship("Protein", back_populates="synonym")
    reaction = relationship("Reaction", back_populates="synonym")
    species = relationship("Species", back_populates="synonym")


class Article(Base):
    __tablename__ = "article"
    __table_args__ = (
        ForeignKeyConstraint(["user_id"], ["profile.id"], name="article_user_id_fkey"),
        PrimaryKeyConstraint("id", name="article_pkey"),
        UniqueConstraint("user_id", "doi", name="article_user_id_doi_key"),
    )

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
    )
    title = Column(Text, nullable=False)
    authors = Column(JSONB, nullable=False)
    doi = Column(Text, nullable=False)
    user_id = Column(UUID, nullable=False)
    public = Column(Boolean, nullable=False, server_default=text("false"))
    journal = Column(Text)

    user = relationship("Profile", back_populates="article")


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

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
    )
    time = Column(DateTime, nullable=False)
    chemical_id = Column(BigInteger, nullable=False)
    change_type = Column(Text, nullable=False)
    source = Column(Text)
    source_details = Column(Text)
    user_id = Column(UUID)
    new_values = Column(JSONB)

    chemical = relationship("Chemical", back_populates="chemical_history")
    user = relationship("Profile", back_populates="chemical_history")


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

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
    )
    name = Column(Text, nullable=False)
    size = Column(BigInteger, nullable=False)
    bucket_id = Column(Text, nullable=False)
    object_path = Column(Text, nullable=False)
    user_id = Column(UUID, nullable=False)
    project_id = Column(BigInteger)
    mime_type = Column(Text)
    tokens = Column(Integer)
    latest_task_id = Column(Text)

    project = relationship("Project", back_populates="file")
    user = relationship("Users", back_populates="file")


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

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
    )
    genome_id = Column(BigInteger, nullable=False)
    source = Column(Text, nullable=False)
    source_details = Column(Text, nullable=False)
    change_type = Column(Text, nullable=False)
    time = Column(DateTime)
    user_id = Column(UUID)
    change_column = Column(Text)

    genome = relationship("Genome", back_populates="genome_history")
    user = relationship("Profile", back_populates="genome_history")


class GenomeSynonym(Base):
    __tablename__ = "genome_synonym"
    __table_args__ = (
        ForeignKeyConstraint(
            ["genome_id"], ["genome.id"], ondelete="CASCADE", name="genome_synonym_genome_id_fkey"
        ),
        PrimaryKeyConstraint("genome_id", "value", "source", name="genome_synonym_pkey"),
        Index("genome_synonym_value_idx", "value"),
    )

    source = Column(Text, nullable=False)
    value = Column(Text, nullable=False)
    genome_id = Column(BigInteger, nullable=False)

    genome = relationship("Genome", back_populates="genome_synonym")


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

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
    )
    name = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    user_id = Column(UUID)
    project_id = Column(BigInteger)

    project = relationship("Project", back_populates="graph")
    user = relationship("Users", back_populates="graph")
    node = relationship("Node", back_populates="graph")


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

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
    )
    protein_id = Column(BigInteger, nullable=False)
    source = Column(Text, nullable=False)
    source_details = Column(Text, nullable=False)
    change_type = Column(Text, nullable=False)
    time = Column(DateTime)
    user_id = Column(UUID)
    change_column = Column(Text)

    protein = relationship("Protein", back_populates="protein_history")
    user = relationship("Profile", back_populates="protein_history")


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

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
    )
    time = Column(DateTime, nullable=False)
    reaction_id = Column(BigInteger, nullable=False)
    change_type = Column(Text, nullable=False)
    source = Column(Text)
    source_details = Column(Text)
    user_id = Column(UUID)
    new_values = Column(JSONB)

    reaction = relationship("Reaction", back_populates="reaction_history")
    user = relationship("Profile", back_populates="reaction_history")


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

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
    )
    species_id = Column(BigInteger, nullable=False)
    source = Column(Text, nullable=False)
    source_details = Column(Text, nullable=False)
    change_type = Column(Text, nullable=False)
    time = Column(DateTime)
    user_id = Column(UUID)
    change_column = Column(Text)

    species = relationship("Species", back_populates="species_history")
    user = relationship("Profile", back_populates="species_history")


class SyncedFolder(Base):
    __tablename__ = "synced_folder"
    __table_args__ = (
        CheckConstraint("source = 'google_drive'::text", name="synced_folder_source_check"),
        ForeignKeyConstraint(
            ["project_id"], ["project.id"], ondelete="CASCADE", name="synced_folder_project_id_fkey"
        ),
        ForeignKeyConstraint(
            ["user_id"], ["auth.users.id"], ondelete="CASCADE", name="synced_folder_user_id_fkey"
        ),
        PrimaryKeyConstraint("id", name="synced_folder_pkey"),
        UniqueConstraint(
            "user_id", "source", "remote_id", name="synced_folder_user_id_source_remote_id_key"
        ),
    )

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
    )
    name = Column(Text, nullable=False)
    user_id = Column(UUID, nullable=False)
    source = Column(Text, nullable=False)
    remote_id = Column(Text, nullable=False)
    project_id = Column(BigInteger)
    update_task_id = Column(Text)
    update_task_error = Column(Text)
    update_task_created_at = Column(DateTime)

    project = relationship("Project", back_populates="synced_folder")
    user = relationship("Users", back_populates="synced_folder")
    synced_file = relationship("SyncedFile", back_populates="synced_folder")


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

    user_id = Column(UUID, nullable=False)
    role = Column(Text, nullable=False)

    user = relationship("Profile", back_populates="user_role")


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

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
    )
    node_type_id = Column(Text, nullable=False)
    data = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    hash = Column(Text, nullable=False)
    graph_id = Column(BigInteger)
    user_id = Column(UUID)

    graph = relationship("Graph", back_populates="node")
    node_type = relationship("NodeType", back_populates="node")
    user = relationship("Users", back_populates="node")
    edge = relationship("Edge", foreign_keys="[Edge.destination_id]", back_populates="destination")
    edge_ = relationship("Edge", foreign_keys="[Edge.source_id]", back_populates="source")
    node_history = relationship("NodeHistory", back_populates="node")


class SyncedFile(Base):
    __tablename__ = "synced_file"
    __table_args__ = (
        CheckConstraint(
            "processing_status = ANY (ARRAY['not_started'::text, 'processing'::text, 'done'::text, 'error'::text])",
            name="synced_file_processing_status_check",
        ),
        CheckConstraint("source = 'google_drive'::text", name="synced_file_source_check"),
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

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
    )
    name = Column(Text, nullable=False)
    mime_type = Column(Text, nullable=False)
    user_id = Column(UUID, nullable=False)
    synced_folder_id = Column(BigInteger, nullable=False)
    is_folder = Column(Boolean, nullable=False, server_default=text("false"))
    parent_ids = Column(ARRAY(BigInteger()), nullable=False, server_default=text("'{}'::bigint[]"))
    source = Column(Text, nullable=False)
    deleted = Column(Boolean, nullable=False, server_default=text("false"))
    remote_id = Column(Text)
    conflict_details = Column(JSONB)
    processing_status = Column(Text)

    synced_folder = relationship("SyncedFolder", back_populates="synced_file")
    user = relationship("Users", back_populates="synced_file")
    file_data = relationship("FileData", back_populates="synced_file")
    graph_draft = relationship("GraphDraft", back_populates="synced_file")
    synced_file_dataset_metadata = relationship(
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

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
    )
    source_id = Column(BigInteger, nullable=False)
    destination_id = Column(BigInteger, nullable=False)
    relationship_ = Column("relationship", Text, nullable=False)
    hash = Column(Text, nullable=False)
    user_id = Column(UUID)
    data = Column(JSONB)

    destination = relationship("Node", foreign_keys=[destination_id], back_populates="edge")
    source = relationship("Node", foreign_keys=[source_id], back_populates="edge_")
    user = relationship("Users", back_populates="edge")
    edge_history = relationship("EdgeHistory", back_populates="edge")


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

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
    )
    user_id = Column(UUID, nullable=False)
    synced_file_id = Column(BigInteger, nullable=False)
    text_content = Column(Text)
    text_summary = Column(Text)

    synced_file = relationship("SyncedFile", back_populates="file_data")
    user = relationship("Users", back_populates="file_data")


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

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
    )
    synced_file_id = Column(BigInteger, nullable=False)
    user_id = Column(UUID)

    synced_file = relationship("SyncedFile", back_populates="graph_draft")
    user = relationship("Users", back_populates="graph_draft")
    graph_draft_node = relationship("GraphDraftNode", back_populates="graph_draft")
    graph_draft_edge = relationship("GraphDraftEdge", back_populates="graph_draft")


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

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
    )
    node_id = Column(BigInteger, nullable=False)
    source = Column(Text, nullable=False)
    source_details = Column(Text, nullable=False)
    change_type = Column(Text, nullable=False)
    time = Column(DateTime)
    user_id = Column(UUID)
    change_column = Column(Text)

    node = relationship("Node", back_populates="node_history")
    user = relationship("Users", back_populates="node_history")


class SyncedFileDatasetMetadata(Base):
    __tablename__ = "synced_file_dataset_metadata"
    __table_args__ = (
        ForeignKeyConstraint(
            ["dataset_metadata_id"],
            ["dataset_metadata.id"],
            name="synced_file_dataset_metadata_dataset_metadata_id_fkey",
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

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
        nullable=False,
    )
    synced_file_id = Column(BigInteger, nullable=False)
    dataset_metadata_id = Column(BigInteger, nullable=False)
    user_id = Column(UUID, nullable=False)
    has_unprocessed_version = Column(Boolean, nullable=False, server_default=text("true"))
    last_processed_version = Column(Text)

    dataset_metadata = relationship(
        "DatasetMetadata", back_populates="synced_file_dataset_metadata"
    )
    synced_file = relationship("SyncedFile", back_populates="synced_file_dataset_metadata")
    user = relationship("Users", back_populates="synced_file_dataset_metadata")


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

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
    )
    edge_id = Column(BigInteger, nullable=False)
    source = Column(Text, nullable=False)
    source_details = Column(Text, nullable=False)
    change_type = Column(Text, nullable=False)
    time = Column(DateTime)
    user_id = Column(UUID)
    change_column = Column(Text)

    edge = relationship("Edge", back_populates="edge_history")
    user = relationship("Users", back_populates="edge_history")


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

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
    )
    graph_draft_id = Column(BigInteger, nullable=False)
    value = Column(Text, nullable=False)
    user_id = Column(UUID)

    graph_draft = relationship("GraphDraft", back_populates="graph_draft_node")
    user = relationship("Users", back_populates="graph_draft_node")
    graph_draft_edge = relationship(
        "GraphDraftEdge",
        foreign_keys="[GraphDraftEdge.destination_id]",
        back_populates="destination",
    )
    graph_draft_edge_ = relationship(
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

    id = Column(
        BigInteger,
        Identity(
            start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1
        ),
    )
    graph_draft_id = Column(BigInteger, nullable=False)
    source_id = Column(BigInteger, nullable=False)
    destination_id = Column(BigInteger, nullable=False)
    value = Column(Text, nullable=False)
    user_id = Column(UUID)

    destination = relationship(
        "GraphDraftNode", foreign_keys=[destination_id], back_populates="graph_draft_edge"
    )
    graph_draft = relationship("GraphDraft", back_populates="graph_draft_edge")
    source = relationship(
        "GraphDraftNode", foreign_keys=[source_id], back_populates="graph_draft_edge_"
    )
    user = relationship("Users", back_populates="graph_draft_edge")
