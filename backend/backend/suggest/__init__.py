import os
from dataclasses import dataclass
from typing import Optional, Union

from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI

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
