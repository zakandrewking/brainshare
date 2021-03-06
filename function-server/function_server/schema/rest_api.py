# generated by datamodel-codegen:
#   filename:  openapi.json
#   timestamp: 2022-04-09T21:05:35+00:00

from __future__ import annotations

from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class Model(BaseModel):
    class Config:
        allow_population_by_field_name = True

    __root__: Any


class Bases(BaseModel):
    class Config:
        allow_population_by_field_name = True

    id: Optional[UUID] = Field(
        None,
        description='Note:\nThis is a Primary Key.<pk/>',
    )
    name: str
    storage_file_path: Optional[str] = None
    owner: Optional[UUID] = None
    dev_port: Optional[int] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class UploadedFiles(BaseModel):
    class Config:
        allow_population_by_field_name = True

    id: Optional[UUID] = None
    name: Optional[str] = None
    owner: Optional[UUID] = None
    object_key: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
