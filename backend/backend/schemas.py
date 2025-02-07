from typing import Any, List

from sqlmodel import SQLModel


class WidgetSuggestion(SQLModel):
    name: str
    description: str
    vegaLiteSpec: Any


class SuggestWidgetColumn(SQLModel):
    fieldName: str
    identification: dict
    sampleValues: List[str]
