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
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()
metadata = Base.metadata


class Chemical(Base):
    __tablename__ = "chemical"
    __table_args__ = (
        PrimaryKeyConstraint("id", name="chemical_pkey"),
        UniqueConstraint("inchi_key", name="chemical_inchi_key_key"),
        Index("chemical_name_search_idx", "name"),
    )

    id = Column(
        BigInteger,
    )
    inchi = Column(Text, nullable=False)
    inchi_key = Column(Text, nullable=False)
    name = Column(Text)
    display_options = Column(JSONB)

    stoichiometry = relationship("Stoichiometry", back_populates="chemical")
    synonym = relationship("Synonym", back_populates="chemical")


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
    )
    sequence = Column(Text, nullable=False)
    hash = Column(Text, nullable=False)
    name = Column(Text)
    short_name = Column(Text)

    reaction = relationship("Reaction", secondary="protein_reaction", back_populates="protein")
    species = relationship("Species", secondary="protein_species", back_populates="protein")
    synonym = relationship("Synonym", back_populates="protein")


class Reaction(Base):
    __tablename__ = "reaction"
    __table_args__ = (
        PrimaryKeyConstraint("id", name="reaction_pkey"),
        UniqueConstraint("hash", name="reaction_hash_key"),
        Index("reaction_name_search_idx", "name"),
    )

    id = Column(
        BigInteger,
    )
    hash = Column(Text, nullable=False)
    name = Column(Text)
    display_options = Column(JSONB)

    protein = relationship("Protein", secondary="protein_reaction", back_populates="reaction")
    stoichiometry = relationship("Stoichiometry", back_populates="reaction")
    synonym = relationship("Synonym", back_populates="reaction")


class Species(Base):
    __tablename__ = "species"
    __table_args__ = (
        PrimaryKeyConstraint("id", name="species_pkey"),
        UniqueConstraint("hash", name="species_hash_key"),
        Index("species_name_search_idx", "name"),
    )

    id = Column(
        BigInteger,
    )
    hash = Column(Text, nullable=False)
    name = Column(Text)
    rank = Column(Text)

    protein = relationship("Protein", secondary="protein_species", back_populates="species")
    genome = relationship("Genome", back_populates="species")
    synonym = relationship("Synonym", back_populates="species")


class Genome(Base):
    __tablename__ = "genome"
    __table_args__ = (
        ForeignKeyConstraint(["species_id"], ["species.id"], name="genome_species_id_fkey"),
        PrimaryKeyConstraint("id", name="genome_pkey"),
    )

    id = Column(
        BigInteger,
    )
    bucket = Column(Text, nullable=False, server_default=text("'genome_sequences'::text"))
    species_id = Column(BigInteger, nullable=False)
    strain_name = Column(Text)
    genbank_gz_object = Column(Text)
    genbank_gz_file_size_bytes = Column(BigInteger)

    species = relationship("Species", back_populates="genome")
    genome_synonym = relationship("GenomeSynonym", back_populates="genome", uselist=True)


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
