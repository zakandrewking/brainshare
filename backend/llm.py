from langchain.chat_models import ChatOpenAI
from langchain import PromptTemplate, LLMChain
from langchain.prompts.chat import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    AIMessagePromptTemplate,
    HumanMessagePromptTemplate,
)
from langchain.schema import AIMessage, HumanMessage, SystemMessage

import os


def chat_single_query(user_query: str) -> str:
    chat = ChatOpenAI(temperature=0, openai_api_key=os.environ.get("OPENAI_API_KEY"))
    res = chat([HumanMessage(content=user_query)]).content
    return res
