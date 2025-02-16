import json
from typing import List

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import Field, SQLModel

from backend.suggest import create_llm, structured_llm_config


class CustomTypeSuggestion(SQLModel):
    name: str
    description: str
    rules: List[str]
    examples: List[str]
    notExamples: List[str]
    minValue: float | None = None
    maxValue: float | None = None
    logScale: bool | None = None


class NumericOptions(SQLModel):
    needsMinMax: bool = Field(..., alias="needsMinMax")
    needsLogScale: bool = Field(..., alias="needsLogScale")
    kind: str


class SuggestCustomTypeArgs(SQLModel):
    columnName: str
    sampleValues: List[str]
    numericOptions: NumericOptions | None = None


async def suggest_custom_type(
    args: SuggestCustomTypeArgs,
    session: AsyncSession,
    user_id: str,
) -> CustomTypeSuggestion:
    """
    Generate a custom type suggestion based on the provided column name and sample values.
    """
    prompt = f"""Given a column of data, suggest a custom type definition.

Column Name: {args.columnName}
Sample Values: {', '.join(args.sampleValues)}

Please provide:
1. A name for this type (in kebab-case, e.g., protein-sequences)
2. A clear description of what this type represents
3. A list of validation rules that values of this type should follow
4. A list of valid example values that match these rules. Examples must be
provided as strings!
5. A list of invalid example values that don't match these rules. notExamples must be
provided as strings!"""

    if args.numericOptions:
        prompt += f"\n\nThis is a {args.numericOptions.kind} type."
        if args.numericOptions.needsMinMax:
            prompt += "\nPlease also suggest appropriate minimum and maximum values for this data."
        if args.numericOptions.needsLogScale:
            prompt += "\nPlease also suggest whether a logarithmic scale would be appropriate for this data (true/false)."

    prompt += """\n\nFormat your response as a JSON object with the following structure:
{
  "name": "type-name",
  "description": "Description of the type",
  "rules": ["rule 1", "rule 2", ...],
  "examples": ["example1", "example2", ...],
  "notExamples": ["1", "2.5", ...]"""

    if args.numericOptions:
        if args.numericOptions.needsMinMax:
            prompt += """,
  "minValue": number,
  "maxValue": number"""
        if args.numericOptions.needsLogScale:
            prompt += """,
  "logScale": boolean"""

    prompt += "\n}\n\nReminder: all examples and notExamples must be provided as strings!"

    try:
        llm = create_llm(structured_llm_config)
        response = await llm.ainvoke(prompt, response_format={"type": "json_object"})
        suggestion_data = json.loads(str(response.content))

        # Get a unique name for the suggestion
        suggestion = CustomTypeSuggestion(**suggestion_data)

        # Get a unique name for the suggestion
        try:
            res = await session.execute(
                text(
                    f"select public.get_unique_custom_type_name('{suggestion.name}', '{user_id}')"
                ),
            )
            unique_name = res.scalar_one()
            if unique_name is None:
                raise HTTPException(
                    status_code=400,
                    detail="Failed to generate unique name for custom type suggestion",
                )
        except Exception as error:
            print("Error getting unique name:", error)
            raise error

        # Update the suggestion with the unique name
        suggestion.name = unique_name

        return suggestion

    except Exception as error:
        print("❌ Error generating custom type suggestion:", error)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate custom type suggestion with {structured_llm_config.model_name}",
        )
