from uuid import UUID

from sqlalchemy import Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Protein(Base):
    __tablename__ = "protein"

    uuid: Mapped[UUID] = mapped_column(primary_key=True)
    id: Mapped[int] = mapped_column()
    sequence: Mapped[str] = mapped_column(nullable=False)
    hash: Mapped[str] = mapped_column(nullable=False)
    name: Mapped[str] = mapped_column()
    short_name: Mapped[str] = mapped_column()
