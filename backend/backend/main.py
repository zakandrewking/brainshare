import asyncio
from typing import Iterable, Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend import ai

# from llm import chat_single_query

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> None:
    return


class Document(BaseModel):
    name: str
    text: str


class DocumentResponse(BaseModel):
    embeddings: list[list[float]]
    lengths: list[int]


@app.post("/document")
async def post(document: Document) -> DocumentResponse:
    print(f"Embedding")
    embeddings = await ai.embed(document.text)
    print(f"Saving to supabase")
    # supabase.
    return DocumentResponse(
        embeddings=[x.embedding for x in embeddings], lengths=[x.length for x in embeddings]
    )


# @app.get("/")
# async def hello_world():
#     return {"Hello": "World"}


# class Q(BaseModel):
#     query: str


# @app.post("/query")
# def post(q: Q) -> str:
#     # TODO supabase auth
#     return chat_single_query(q.query)
