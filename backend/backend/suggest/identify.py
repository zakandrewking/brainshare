"""
Identify a column's type via LLM
"""

import json
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import Field, SQLModel, select

from backend.models import CustomType
from backend.suggest import create_llm, structured_llm_config


class Identification(SQLModel):
    type: str
    description: str
    suggested_actions: Optional[List[str]] = Field(None, alias="suggestedActions")
    is_custom: bool = Field(False, alias="isCustom")
    id: Optional[str] = None
    name: Optional[str] = None
    kind: Optional[str] = None
    min_value: Optional[float] = Field(None, alias="minValue")
    max_value: Optional[float] = Field(None, alias="maxValue")
    log_scale: Optional[bool] = Field(None, alias="logScale")


class IdentifyColumnArgs(SQLModel):
    column_name: str
    sample_values: List[str]


def generate_type_prompt(custom_types: List[CustomType]) -> str:
    """Generate the prompt for type identification."""
    base_prompt = """Identify the type of data in this column. Choose from:

Built-in Types:
1. text - Generic text data
2. integer-numbers - Whole numbers
3. decimal-numbers - Numbers with decimal points
4. dates - Date values (e.g., "2021-01-01")
5. times - Time values without dates (e.g., "13:45:00")
6. email-addresses - Valid email addresses
7. urls - Valid URLs
8. phone-numbers - Phone numbers in various formats
9. ip-addresses - IPv4 or IPv6 addresses
10. geographic-coordinates - Latitude/longitude pairs
11. postal-codes - Postal/ZIP codes
12. currency-amounts - Monetary values with currency symbols
13. percentages - Percentage values
14. boolean - True/false values
15. json - JSON-formatted strings
16. file-paths - File system paths
17. color-codes - Hex color codes or RGB values
18. identifiers - Generic IDs or reference numbers"""

    if custom_types:
        custom_types_prompt = "\nCustom Types:"
        for i, type_ in enumerate(custom_types, 1):
            custom_types_prompt += f"\n{i}. {type_.name} - {type_.description}"
        base_prompt += custom_types_prompt

    base_prompt += """\n
Provide your response in JSON format with these fields:
{
  "type": "selected-type-name",
  "description": "Why this type was chosen",
  "suggestedActions": ["action1", "action2"] (optional)
}"""

    return base_prompt


async def identify_column(
    args: IdentifyColumnArgs,
    session: AsyncSession,
    user_id: str,
) -> Identification:
    """
    Identify the type of data in a column using LLM.
    """
    try:
        # Fetch custom types if user is authenticated
        custom_types_query = select(CustomType).where(
            (CustomType.user_id == user_id) | (CustomType.public == True)  # noqa: E712
        )
        custom_types = list((await session.execute(custom_types_query)).scalars().all())

        prompt = f"""Analyze this column of data:
Column Name: {args.column_name}
Sample Values: {', '.join(args.sample_values)}

{generate_type_prompt(custom_types)}"""

        llm = create_llm(structured_llm_config)
        response = await llm.ainvoke(prompt, response_format={"type": "json_object"})
        suggestion_data = json.loads(str(response.content))

        # Create the base identification
        identification = Identification(**suggestion_data)

        # Check if it matches a custom type
        if custom_types:
            custom_match = next(
                (type_ for type_ in custom_types if type_.name == identification.type),
                None,
            )
            if custom_match:
                # Update with custom type info
                identification.is_custom = True
                identification.id = str(custom_match.id)
                identification.name = custom_match.name
                identification.kind = custom_match.kind
                identification.min_value = (
                    float(custom_match.min_value) if custom_match.min_value is not None else None
                )
                identification.max_value = (
                    float(custom_match.max_value) if custom_match.max_value is not None else None
                )
                identification.log_scale = custom_match.log_scale

        return identification

    except Exception as error:
        print("❌ Error identifying column:", error)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to identify column with {structured_llm_config.model_name}",
        )
