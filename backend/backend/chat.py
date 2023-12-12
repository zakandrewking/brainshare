from glom import glom
import openai
from langchain.callbacks import get_openai_callback
from langchain_core.messages import AIMessage
from langchain.chat_models import ChatOpenAI
from langchain.prompts import (
    ChatPromptTemplate,
)
from backend import schemas


# Example tasks (ui or chat is OK):
#
# can you open the article that I uploaded about e coli growing on methanol?
#
# rename that file with the title of the paper


async def chat(messages: list[schemas.ChatMessage], model) -> tuple[list[schemas.ChatMessage], int]:
    res = await openai.ChatCompletion.acreate(
        model=model, messages=list(map(lambda x: x.dict(), messages))
    )
    content = res.choices[0].message.content
    tokens = res.usage.total_tokens
    return content, tokens


async def get_file_summary(synced_file_id: int) -> str:
    return "TODO"


async def chat_with_context(chat_request: schemas.ChatRequest):
    messages = [
        (
            "system",
            """You are a helpful assistant designed to help with science. The
               user is accessing you through a website and you will be provided
               with context to better help them along the way.  Act as though
               you are looking at the website and trying to help. You will have
               access to tools to help you do this. You will be able to read
               files, create knowledge graphs, and perform searches. Do not tell
               the user about your tools; instead, act as though you are a human
               assistant.
               """,
        )
    ]

    current_page = glom(chat_request, "context.current_page")
    if current_page:
        currently_processing = True
        if currently_processing:
            messages += [
                (
                    "system",
                    f"""The user is currently viewing the page with this
                    description: {current_page}. The system is currently
                    processing the file at this page. Therefore, you do not have
                    the ability to read the file yet. The user needs to wait or
                    restart the process by clicking Try Again.
                    """,
                )
            ]
        else:
            messages += [
                (
                    "system",
                    f"The user is currently viewing the page with this description: {current_page}.",
                )
            ]

    messages += [(x.role, x.content) for x in chat_request.history]

    prompt = ChatPromptTemplate.from_messages(messages)
    llm = ChatOpenAI(model_name=chat_request.model)
    chain = prompt | llm

    with get_openai_callback() as cb:
        res: AIMessage = await chain.ainvoke({})
        content = res.content
        tokens = cb.total_tokens

    return schemas.ChatResponse(content=content, tokens=tokens)
