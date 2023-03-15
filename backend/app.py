from typing import Union
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from llm import chat_single_query

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def hello_world():
    return {"Hello": "World"}


class Q(BaseModel):
    query: str


@app.post("/query")
def post(q: Q) -> str:
    # TODO supabase auth
    return chat_single_query(q.query)
