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


class SyncedFileDatasetMetadataToUpdate(SQLModel):
    synced_file_dataset_metadata_id: int
    clean_up_only: bool = False
    force_cancel: bool = False


class FileToAnnotate(SQLModel):
    id: int
    name: str
    size: int
    object_path: str
    bucket_id: str


class AnnotateFileTask(SQLModel):
    task_id: str


class AnnotateFileStatus(SQLModel):
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


class ChatContext(SQLModel):
    # a text description of the current page. None indicates it's not
    # implemented
    current_page: str | None


class ChatRequest(SQLModel):
    history: list[ChatMessage]
    model: Literal["gpt-3.5-turbo", "gpt-4-1106-preview"]
    context: ChatContext | None = None


class ChatResponse(SQLModel):
    content: str
    tokens: int


class SyncedFolderToUpdate(SQLModel):
    synced_folder_id: int
    synced_file_folder_id: int | None
    # we can call this once in a while to double check that a job we might be
    # interested in running is still running and not in an uncaught error state.
    # an alternative to polling.
    clean_up_only: bool = False
    # forcibly cancels any previous job
    force_cancel: bool = False


class UpdateSyncedFolderStatus(SQLModel):
    status: RunStatus
    error: str | None = None


class CreateDatasetRequest(SQLModel):
    dataset_name: str
    synced_file_id: int


class DeleteDatasetRequest(SQLModel):
    dataset_metadata_id: int


class DatasetColumnsRequest(SQLModel):
    dataset_metadata_id: int
