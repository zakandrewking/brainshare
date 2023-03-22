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


class ChatRequest(SQLModel):
    text: str


class ChatResponse(SQLModel):
    text: str
    tokens: int
    cost_dollars: float
