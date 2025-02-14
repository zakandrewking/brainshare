import json
import os
from dataclasses import dataclass
from typing import Any, List, Optional, Union

from fastapi import HTTPException
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI

from backend.schemas import SuggestWidgetColumn, WidgetSuggestion

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
if OPENAI_API_KEY is None:
    raise ValueError("OPENAI_API_KEY is not set")


@dataclass
class LLMConfig:
    provider: str
    model_name: str
    mode: Optional[str] = None
    reasoning_effort: Optional[str] = None


inference_llm_config = LLMConfig(
    provider="openai", model_name="o3-mini", reasoning_effort="low", mode="structured"
)
structured_llm_config = LLMConfig(provider="openai", model_name="gpt-4o-mini", mode="structured")


def create_llm(config: LLMConfig) -> Union[ChatOpenAI, ChatAnthropic]:
    if config.provider == "openai":
        return ChatOpenAI(
            model_name=config.model_name,
            **({"reasoning_effort": config.reasoning_effort} if config.reasoning_effort else {}),
        )
    elif config.provider == "anthropic":
        return ChatAnthropic(model=config.model_name)
    else:
        raise ValueError(f"Unsupported LLM provider: {config.provider}")


async def suggest_widget(
    columns: List[SuggestWidgetColumn],
    existing_widgets: List[WidgetSuggestion],
    data_size: int,
) -> WidgetSuggestion:
    """
    Generate a widget suggestion based on the provided columns and existing widgets.
    """
    if len(columns) > 30:
        raise HTTPException(status_code=400, detail="Too many columns. Please limit to 30 columns.")

    prompt = f"""
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

        # Validate the response structure
        suggestion = WidgetSuggestion(**parsed)
        return suggestion

    except Exception as error:
        print("❌ Error generating visualization suggestion:", error)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate visualization suggestion with {inference_llm_config.model_name}",
        )
