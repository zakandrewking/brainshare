from typing import List, Optional

from sqlalchemy import (
    BigInteger,
    Column,
    Float,
    ForeignKeyConstraint,
    Index,
    PrimaryKeyConstraint,
    Table,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, Relationship, SQLModel

metadata = SQLModel.metadata


class Chemical(SQLModel, table=True):
    __table_args__ = (
        PrimaryKeyConstraint("id", name="chemical_pkey"),
        UniqueConstraint("inchi_key", name="chemical_inchi_key_key"),
        Index("chemical_name_search_idx", "name"),
    )

    id: Optional[int] = Field(
        default=None,
        sa_column=Column(
            "id",
            BigInteger,
        ),
    )
    inchi: str = Field(sa_column=Column("inchi", Text, nullable=False))
    inchi_key: str = Field(sa_column=Column("inchi_key", Text, nullable=False))
    name: Optional[str] = Field(default=None, sa_column=Column("name", Text))
    display_options: Optional[dict] = Field(
        default=None, sa_column=Column("display_options", JSONB)
    )

    stoichiometry: List["Stoichiometry"] = Relationship(back_populates="chemical")
    synonym: List["Synonym"] = Relationship(back_populates="chemical")


class Protein(SQLModel, table=True):
    __table_args__ = (
        PrimaryKeyConstraint("id", name="protein_pkey"),
        UniqueConstraint("hash", name="protein_hash_key"),
        Index("protein_name_search_idx", "name"),
        Index("protein_short_name_search_idx", "short_name"),
    )

    id: Optional[int] = Field(
        default=None,
        sa_column=Column(
            "id",
            BigInteger,
        ),
    )
    sequence: str = Field(sa_column=Column("sequence", Text, nullable=False))
    hash: str = Field(sa_column=Column("hash", Text, nullable=False))
    name: Optional[str] = Field(default=None, sa_column=Column("name", Text))
    short_name: Optional[str] = Field(default=None, sa_column=Column("short_name", Text))

    reaction: List["Reaction"] = Relationship(back_populates="protein")
    species: List["Species"] = Relationship(back_populates="protein")
    synonym: List["Synonym"] = Relationship(back_populates="protein")


class Reaction(SQLModel, table=True):
    __table_args__ = (
        PrimaryKeyConstraint("id", name="reaction_pkey"),
        UniqueConstraint("hash", name="reaction_hash_key"),
        Index("reaction_name_search_idx", "name"),
    )

    id: Optional[int] = Field(
        default=None,
        sa_column=Column(
            "id",
            BigInteger,
        ),
    )
    hash: str = Field(sa_column=Column("hash", Text, nullable=False))
    name: Optional[str] = Field(default=None, sa_column=Column("name", Text))
    display_options: Optional[dict] = Field(
        default=None, sa_column=Column("display_options", JSONB)
    )

    protein: List["Protein"] = Relationship(back_populates="reaction")
    stoichiometry: List["Stoichiometry"] = Relationship(back_populates="reaction")
    synonym: List["Synonym"] = Relationship(back_populates="reaction")


class Species(SQLModel, table=True):
    __table_args__ = (
        PrimaryKeyConstraint("id", name="species_pkey"),
        UniqueConstraint("hash", name="species_hash_key"),
        Index("species_name_search_idx", "name"),
    )

    id: Optional[int] = Field(
        default=None,
        sa_column=Column(
            "id",
            BigInteger,
        ),
    )
    hash: str = Field(sa_column=Column("hash", Text, nullable=False))
    name: Optional[str] = Field(default=None, sa_column=Column("name", Text))
    rank: Optional[str] = Field(default=None, sa_column=Column("rank", Text))

    protein: List["Protein"] = Relationship(back_populates="species")
    genome: List["Genome"] = Relationship(back_populates="species")
    synonym: List["Synonym"] = Relationship(back_populates="species")


class Genome(SQLModel, table=True):
    __table_args__ = (
        ForeignKeyConstraint(["species_id"], ["species.id"], name="genome_species_id_fkey"),
        PrimaryKeyConstraint("id", name="genome_pkey"),
    )

    id: Optional[int] = Field(
        default=None,
        sa_column=Column(
            "id",
            BigInteger,
        ),
    )
    bucket: str = Field(
        sa_column=Column(
            "bucket",
            Text,
            nullable=False,
            server_default=text("'genome_sequences'::text"),
        )
    )
    species_id: int = Field(sa_column=Column("species_id", BigInteger, nullable=False))
    strain_name: Optional[str] = Field(default=None, sa_column=Column("strain_name", Text))
    genbank_gz_object: Optional[str] = Field(
        default=None, sa_column=Column("genbank_gz_object", Text)
    )
    genbank_gz_file_size_mb: Optional[float] = Field(
        default=None, sa_column=Column("genbank_gz_file_size_mb", Float(53))
    )

    species: Optional["Species"] = Relationship(back_populates="genome")
    genome_synonym: List["GenomeSynonym"] = Relationship(back_populates="genome")


t_protein_reaction = Table(
    "protein_reaction",
    metadata,
    Column("protein_id", BigInteger, nullable=False),
    Column("reaction_id", BigInteger, nullable=False),
    ForeignKeyConstraint(
        ["protein_id"],
        ["protein.id"],
        ondelete="CASCADE",
        name="protein_reaction_protein_id_fkey",
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
        ["protein_id"],
        ["protein.id"],
        ondelete="CASCADE",
        name="protein_species_protein_id_fkey",
    ),
    ForeignKeyConstraint(
        ["species_id"],
        ["species.id"],
        ondelete="CASCADE",
        name="protein_species_species_id_fkey",
    ),
    PrimaryKeyConstraint("protein_id", "species_id", name="protein_species_pkey"),
    Index("protein_species_reverse_idx", "species_id", "protein_id"),
)


class Stoichiometry(SQLModel, table=True):
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
    )

    chemical_id: int = Field(sa_column=Column("chemical_id", BigInteger, nullable=False))
    reaction_id: int = Field(sa_column=Column("reaction_id", BigInteger, nullable=False))
    coefficient: float = Field(sa_column=Column("coefficient", Float(53), nullable=False))
    compartment_rule: Optional[str] = Field(
        default=None, sa_column=Column("compartment_rule", Text)
    )

    chemical: Optional["Chemical"] = Relationship(back_populates="stoichiometry")
    reaction: Optional["Reaction"] = Relationship(back_populates="stoichiometry")


class Synonym(SQLModel, table=True):
    __table_args__ = (
        ForeignKeyConstraint(
            ["chemical_id"],
            ["chemical.id"],
            ondelete="CASCADE",
            name="synonym_chemical_id_fkey",
        ),
        ForeignKeyConstraint(
            ["protein_id"],
            ["protein.id"],
            ondelete="CASCADE",
            name="synonym_protein_id_fkey",
        ),
        ForeignKeyConstraint(
            ["reaction_id"],
            ["reaction.id"],
            ondelete="CASCADE",
            name="synonym_reaction_id_fkey",
        ),
        ForeignKeyConstraint(
            ["species_id"],
            ["species.id"],
            ondelete="CASCADE",
            name="synonym_species_id_fkey",
        ),
        PrimaryKeyConstraint("id", name="synonym_pkey"),
        UniqueConstraint(
            "chemical_id",
            "value",
            "source",
            name="synonym_chemical_id_value_source_key",
        ),
        UniqueConstraint(
            "protein_id", "value", "source", name="synonym_protein_id_value_source_key"
        ),
        UniqueConstraint(
            "reaction_id",
            "value",
            "source",
            name="synonym_reaction_id_value_source_key",
        ),
        UniqueConstraint(
            "species_id", "value", "source", name="synonym_species_id_value_source_key"
        ),
        Index("synonym_value_idx", "value"),
    )

    id: Optional[int] = Field(
        default=None,
        sa_column=Column(
            "id",
            BigInteger,
        ),
    )
    source: str = Field(sa_column=Column("source", Text, nullable=False))
    value: str = Field(sa_column=Column("value", Text, nullable=False))
    chemical_id: Optional[int] = Field(default=None, sa_column=Column("chemical_id", BigInteger))
    reaction_id: Optional[int] = Field(default=None, sa_column=Column("reaction_id", BigInteger))
    protein_id: Optional[int] = Field(default=None, sa_column=Column("protein_id", BigInteger))
    species_id: Optional[int] = Field(default=None, sa_column=Column("species_id", BigInteger))

    chemical: Optional["Chemical"] = Relationship(back_populates="synonym")
    protein: Optional["Protein"] = Relationship(back_populates="synonym")
    reaction: Optional["Reaction"] = Relationship(back_populates="synonym")
    species: Optional["Species"] = Relationship(back_populates="synonym")


class GenomeSynonym(SQLModel, table=True):
    __table_args__ = (
        ForeignKeyConstraint(
            ["genome_id"],
            ["genome.id"],
            ondelete="CASCADE",
            name="genome_synonym_genome_id_fkey",
        ),
        PrimaryKeyConstraint("genome_id", "value", "source", name="genome_synonym_pkey"),
        Index("genome_synonym_value_idx", "value"),
    )

    source: str = Field(sa_column=Column("source", Text, nullable=False))
    value: str = Field(sa_column=Column("value", Text, nullable=False))
    genome_id: int = Field(sa_column=Column("genome_id", BigInteger, nullable=False))

    genome: Optional["Genome"] = Relationship(back_populates="genome_synonym")
