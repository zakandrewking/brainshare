import json
from typing import Any, List, Literal

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import SQLModel

from backend import auth
from backend.suggest import create_llm, inference_llm_config

router = APIRouter(
    dependencies=[Depends(auth.get_user_id)],
)

# types (not shared with other routers)

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


vega_lite_prompt = (
    lambda data_size: f"""
Given the following dataset columns with their types and sample values,
suggest a meaningful Vega-Lite visualization specification.

# Rules

1. Be creative to provide one interesting, useful, concise, and intuitive
   visualization.

2. It's OK to provide a targeted visualization of a particular aspect of the
   data -- assume that multiple visualizations will be created. For example,
   a histogram of a particular column is a good idea if it's interesting.

3. Do not suggest a visualization that is equivalent to one of the existing
   ones listed in the Existing Visualizations section.

4. The field names in the Vega-Lite spec must match exactly the fieldNames in
   the Columns section.

5. The vegaLiteSpec should be a valid Vega-Lite specification in JSON format.

6. Each column will have {data_size} values. Be sure that the visualization
   can render in a reasonable amount of time for this data size, and that the
   visual elements will not overlap or becomes unreadable.  For example, do
   not include more than ~ 40 labels on the x-axis or y-axis or in the
   legend. Do not include more than ~ 400 marks. If the legend is going to be
   too large, consider hiding it and utilizing tooltips.

7. The final visualization will be rendered in a 385px width and 300px height
   container.

8. The response should be a valid JSON object. It should have the format:

{{
  "name": "...",
  "description": "...",
  "vegaLiteSpec": {{ ... }}
}}

IT IS VERY IMPORTANT THAT THE RESPONSE IS A ONLY VALID JSON OBJECT.
"""
)

observable_plot_prompt = (
    lambda data_size: f"""
Given the following dataset columns with their types and sample values, suggest
a meaningful Observable Plot visualization code.

# Rules

1. Be creative to provide one interesting, useful, concise, and intuitive
   visualization.

2. It's OK to provide a targeted visualization of a particular aspect of the
   data -- assume that multiple visualizations will be created. For example, a
   histogram of a particular column is a good idea if it's interesting.

3. Do not suggest a visualization that is equivalent to one of the existing ones
   listed in the Existing Visualizations section.

4. The field names in the Observable Plot code must match exactly the fieldNames
   in the Columns section.

5. The observablePlotCode should be valid JavaScript that creates an Observable
   Plot and appends it to the DOM element with id "root". The code must use the
   global `Plot` object which is already defined. Data is already defined as
   `data` in the global scope. No imports are needed.

6. Each column will have {data_size} values. Be sure that the visualization can
   render in a reasonable amount of time for this data size, and that the visual
   elements will not overlap or becomes unreadable. For example, do not include
   more than ~ 40 labels on the x-axis or y-axis or in the legend. Do not
   include more than ~ 400 marks. If the legend is going to be too large,
   consider hiding it and utilizing tooltips.

7. The final visualization will be rendered in a 385px width and 300px height
   container. The code should append the plot to the DOM element with id "root".

8. The response should be a valid JSON object. It should have the format:

{{
  "name": "...", "description": "...", "observablePlotCode": "..."
}}

IT IS VERY IMPORTANT THAT THE RESPONSE IS A ONLY VALID JSON OBJECT.
"""
)


@router.post("/suggest-widget")
async def suggest_widget(
    args: SuggestWidgetArgs,
) -> WidgetSuggestion:
    """
    Generate a widget suggestion based on the provided columns and existing widgets.
    """

    columns = args.columns
    existing_widgets = args.existingWidgets
    data_size = args.dataSize
    engine = args.engine

    if len(columns) > 30:
        raise HTTPException(status_code=400, detail="Too many columns. Please limit to 30 columns.")

    prompt = (
        vega_lite_prompt(data_size) if engine == "vega-lite" else observable_plot_prompt(data_size)
    )

    prompt += f"""
# Columns

{json.dumps(columns, default=lambda x: x.dict(), indent=2)}

# Existing Visualizations

{json.dumps([{"name": w.name, "description": w.description} for w in existing_widgets], indent=2)}
"""

    print(
        f"🤖 Step 1: Querying {inference_llm_config.model_name} for visualization suggestion..."
        + (
            f" (reasoning_effort: {inference_llm_config.reasoning_effort})"
            if inference_llm_config.reasoning_effort
            else ""
        )
    )

    try:
        # Step 1: Get initial suggestion
        llm = create_llm(inference_llm_config)
        initial_response = await llm.ainvoke(
            prompt,
            response_format=(
                {"type": "json_object"} if inference_llm_config.mode == "structured" else None
            ),
        )
        initial_suggestion = str(initial_response.content)

        print("✅ Initial LLM response received:", initial_suggestion)

        # Parse the response
        parsed = json.loads(initial_suggestion)
        parsed["engine"] = engine

        if engine == "vega-lite" and "vegaLiteSpec" not in parsed:
            raise HTTPException(
                status_code=400,
                detail="Vega-Lite spec not found in the response. Please try again.",
            )

        if engine == "observable-plot" and "observablePlotCode" not in parsed:
            raise HTTPException(
                status_code=400,
                detail="Observable Plot code not found in the response. Please try again.",
            )

        # Validate the response structure
        suggestion = WidgetSuggestion(**parsed)
        return suggestion

    except Exception as error:
        print("❌ Error generating visualization suggestion:", error)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate visualization suggestion with {inference_llm_config.model_name}",
        )
