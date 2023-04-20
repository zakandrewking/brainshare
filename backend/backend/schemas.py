from typing import Optional

from sqlmodel import SQLModel


class CrossrefWorkAuthor(SQLModel):
    given: str | None
    family: str | None
    sequence: str | None


class CrossrefWork(SQLModel):
    title: str
    authors: list[CrossrefWorkAuthor]
    journal: str | None
    doi: str


class ArticleRequest(SQLModel):
    text: str
    crossref_work: CrossrefWork
    user_id: str


class ArticleResponse(SQLModel):
    article_id: int


class ResourceMatch(SQLModel):
    type: str
    name: str
    summary: str
    url: str | None  # path, starting with /


class AnnotateRequest(SQLModel):
    text: str


class AnnotateResponse(SQLModel):
    categories: list[ResourceMatch]
    tags: list[str]
    crossref_work: Optional[CrossrefWork]
    tokens: int


class ChatRequest(SQLModel):
    text: str


class ChatResponse(SQLModel):
    text: str
    tokens: int
    cost_dollars: float
