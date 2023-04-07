from typing import Optional, Literal

from pgvector.sqlalchemy import Vector
from sqlmodel import Column, Field, Relationship, SQLModel


class Article(SQLModel, table=True):
    id: int = Field(primary_key=True)
    name: str

    article_contents: list["ArticleContent"] = Relationship(back_populates="article")


class ArticleContent(SQLModel, table=True):
    __tablename__ = "article_content"
    article_id: int = Field(primary_key=True, foreign_key="article.id")
    chunk: int = Field(primary_key=True)
    text: str
    embedding: list[float] = Field(sa_column=Column(Vector(1536)))

    article: Article = Relationship(back_populates="article_contents")


class Document(SQLModel):
    name: str
    text: str


class DocumentResponse(SQLModel):
    article_id: int


class CrossrefWorkAuthor(SQLModel):
    given: str | None
    family: str | None
    sequence: str | None


class CrossrefWork(SQLModel):
    title: str
    authors: list[CrossrefWorkAuthor]
    journal: str | None
    doi: str


class AnnotateRequest(SQLModel):
    text: str


class AnnotateResponse(SQLModel):
    categories: list[str]
    tags: list[str]
    crossref_work: Optional[CrossrefWork]
    tokens: int


class ResourceMatch(SQLModel):
    type: Literal["species"]
    name: str
    url: str  # path, starting with /

    def __eq__(self, other):
        if other.__class__ is self.__class__:
            return self.relative_url == other.relative_url
        return NotImplemented


class ChatRequest(SQLModel):
    text: str


class ChatResponse(SQLModel):
    text: str
    tokens: int
    cost_dollars: float
