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
