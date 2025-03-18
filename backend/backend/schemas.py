from typing import Any, List, Literal

from sqlmodel import SQLModel

WidgetEngine = Literal["vega-lite", "observable-plot"]


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
    engine: WidgetEngine
    vegaLiteSpec: Any | None = None
    observablePlotCode: str | None = None


class SuggestWidgetArgs(SQLModel):
    engine: WidgetEngine
    columns: List[SuggestWidgetColumn]
    existingWidgets: List[WidgetSuggestion]
    dataSize: int
