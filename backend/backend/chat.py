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


async def chat(query: str) -> str:
    return (
        (
            await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo", messages=[{"role": "user", "content": query}]
            )
        )
        .choices[0]
        .message.content
    )


async def chat_with_memory(query: str, history: dict) -> int:
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                """The following is a friendly conversation between a human and an
                AI. The AI is talkative and provides lots of specific details from
                its context. If the AI does not know the answer to a question, it
                truthfully says it does not know."""
            ),
            MessagesPlaceholder(variable_name="history"),
            HumanMessagePromptTemplate.from_template("{input}"),
        ]
    )
    llm = ChatOpenAI(temperature=0)
    memory = ConversationBufferMemory(return_messages=True)
    conversation = ConversationChain(memory=memory, prompt=prompt, llm=llm)
    return ""
    return await conversation.apredict(input=query)