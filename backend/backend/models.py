from sqlmodel import Field, SQLModel


class Article(SQLModel, table=True):
    id: int = Field(primary_key=True)
    name: str


class ArticleContent(SQLModel, table=True):
    article_id: int = Field(primary_key=True, foreign_key="article.id")
    chunk: int
    embedding: list[int]
