from typing import Union
from fastapi import FastAPI
from pydantic import BaseModel
from llm import chat_single_query

app = FastAPI()


@app.get("/")
async def hello_world():
    return {"Hello": "World"}


class Q(BaseModel):
    query: str


@app.post("/query")
def post(q: Q) -> str:
    # TODO supabase auth
    return chat_single_query(q.query)
