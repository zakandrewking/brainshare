import openai
from langchain.chains import ConversationChain
from langchain.chat_models import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    MessagesPlaceholder,
    SystemMessagePromptTemplate,
)
from backend.schemas import ChatMessage


# Example tasks (ui or chat is OK):
#
# can you open the article that I uploaded about e coli growing on methanol?
#
# rename that file with the title of the paper


async def chat(messages: list[ChatMessage], model="gpt-3.5-turbo") -> tuple[list[ChatMessage], int]:
    res = await openai.ChatCompletion.acreate(
        model=model, messages=list(map(lambda x: x.dict(), messages))
    )
    content = res.choices[0].message.content
    tokens = res.usage.total_tokens
    return content, tokens


# async def chat_with_memory(query: str, history: dict) -> int:
#     prompt = ChatPromptTemplate.from_messages(
#         [
#             SystemMessagePromptTemplate.from_template(
#                 """The following is a friendly conversation between a human and an
#                 AI. The AI is talkative and provides lots of specific details from
#                 its context. If the AI does not know the answer to a question, it
#                 truthfully says it does not know."""
#             ),
#             MessagesPlaceholder(variable_name="history"),
#             HumanMessagePromptTemplate.from_template("{input}"),
#         ]
#     )
#     llm = ChatOpenAI(temperature=0)
#     memory = ConversationBufferMemory(return_messages=True)
#     conversation = ConversationChain(memory=memory, prompt=prompt, llm=llm)
#     return ""
#     return await conversation.apredict(input=query)
