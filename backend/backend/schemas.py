from typing import Any, List

from pydantic import Field
from sqlmodel import SQLModel


class Identification(SQLModel):
    type: str
    description: str
    suggestedActions: List[str] | None = None
    id: str | None = None
    name: str | None = None
    kind: str | None = None
    minValue: float | None = None
    maxValue: float | None = None
    logScale: bool | None = None


class SuggestWidgetColumn(SQLModel):
    fieldName: str
    identification: Identification
    sampleValues: List[str]


class WidgetSuggestion(SQLModel):
    name: str
    description: str
    vegaLiteSpec: Any


class SuggestWidgetArgs(SQLModel):
    columns: List[SuggestWidgetColumn]
    existingWidgets: List[WidgetSuggestion]
    dataSize: int
