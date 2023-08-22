from enum import Enum
from typing import Literal

from sqlmodel import SQLModel


class RunStatus(Enum):
    pending = "pending"
    started = "started"
    will_retry = "will_retry"
    failed = "failed"
    done = "done"
    other = "other"

    @staticmethod
    def from_celery_state(task_state: str) -> "RunStatus":
        status_dict = {
            "PENDING": RunStatus.pending,
            "STARTED": RunStatus.started,
            "RETRY": RunStatus.will_retry,
            "FAILURE": RunStatus.failed,
            "SUCCESS": RunStatus.done,
        }
        return status_dict.get(task_state, RunStatus.other)


class FileToAnnotate(SQLModel):
    id: int
    name: str
    size: int
    object_path: str
    bucket_id: str


class RunAnnotateFileTask(SQLModel):
    task_id: str


class RunAnnotateFileStatus(SQLModel):
    status: RunStatus
    error: str | None = None


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


class DocToAnnotate(SQLModel):
    text: str
    dev_fake_openai: bool = False


class Annotations(SQLModel):
    categories: list[ResourceMatch]
    tags: list[str]
    crossref_work: CrossrefWork | None
    tokens: int
    ready: bool = True


class RunAnnotateTask(SQLModel):
    task_id: str


class RunAnnotateStatus(SQLModel):
    error: str | None = None
    annotations: Annotations | None = None


class ChatMessage(SQLModel):
    content: str
    role: Literal["user", "system", "assistant"]


class ChatRequest(SQLModel):
    history: list[ChatMessage]
    model: Literal["gpt-3.5-turbo", "gpt-4"] | None = None


class ChatResponse(SQLModel):
    content: str
    tokens: int
