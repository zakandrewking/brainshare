import re
from dataclasses import dataclass
from itertools import chain, groupby, islice

import backoff
import openai
import tiktoken
from sqlalchemy import func, select

from backend.config import (
    EMBEDDING_CTX_LENGTH,
    EMBEDDING_ENCODING,
    EMBEDDING_MODEL,
    OPENAI_CONCURRENT_REQUESTS,
)
from backend import db
from backend.schemas import ResourceMatch
from backend.util import batched, semaphore_gather

# from
# https://github.com/openai/openai-cookbook/blob/main/examples/Embedding_long_inputs.ipynb


async def get_embedding(text_or_tokens, model) -> list[float]:
    result = await openai.Embedding.acreate(input=text_or_tokens, model=model)
    return result["data"][0]["embedding"]


def chunk_tokens(text, encoding_name, chunk_length: int, overlap: int):
    encoding = tiktoken.get_encoding(encoding_name)
    tokens = encoding.encode(text)
    chunks_iterator = batched(tokens, chunk_length, overlap)
    yield from chunks_iterator


def decode(tokens, encoding_name):
    encoding = tiktoken.get_encoding(encoding_name)
    return encoding.decode(tokens)


def chunk_text(text, encoding_name, chunk_length, overlap: int = 0):
    """

    `overlap` is the number of tokens that will be included in two
    neighboring chunks, to avoid splitting important data like DOIs

    """
    chunker = chunk_tokens(text, encoding_name, chunk_length, overlap)
    yield from (decode(x, encoding_name) for x in chunker)


@dataclass
class ChunkDetail:
    text: str
    embedding: list[float]


async def len_safe_get_embedding(
    text,
    model=EMBEDDING_MODEL,
    max_tokens=EMBEDDING_CTX_LENGTH,
    encoding_name=EMBEDDING_ENCODING,
) -> list[ChunkDetail]:
    async def _get(chunk, model, encoding_name):
        return ChunkDetail(decode(chunk, encoding_name), await get_embedding(chunk, model))

    chunked = chunk_tokens(text, encoding_name=encoding_name, chunk_length=300, overlap=0)
    chunk_details: list[ChunkDetail] = await semaphore_gather(
        OPENAI_CONCURRENT_REQUESTS, (_get(c, model, encoding_name) for c in chunked)
    )
    return chunk_details


async def embed(text: str) -> list[ChunkDetail]:
    return await len_safe_get_embedding(text)


@backoff.on_exception(
    backoff.expo,
    (
        openai.error.APIError,
        openai.error.RateLimitError,
        openai.error.ServiceUnavailableError,
        openai.error.Timeout,
    ),
    max_time=30,
)
async def _single_chat(content: str, model="gpt-3.5-turbo") -> tuple[str, int]:
    res = await openai.ChatCompletion.acreate(
        model=model,
        messages=[{"role": "user", "content": content}],
    )
    content = res.choices[0].message.content
    tokens = res.usage.total_tokens
    return content, tokens


async def _summarize_match_list(match_list: list[ResourceMatch]) -> tuple[ResourceMatch, int]:
    """Combine the summaries of a list of matches that all describe the same
    entity."""
    if len(match_list) == 1:
        return match_list[0], 0
    paragraphs_str = "\n\n".join(m.summary for m in match_list)
    match = match_list[0]
    content = f"""
Combine the following text extracts -- which are all a part of the same research
article -- into a succinct paragraph. The extracts describe the the {match.type}
"{match.name}".

Text extracts:

{paragraphs_str}
"""
    res, tokens = await _single_chat(content)
    match.summary = res
    return match, tokens


async def _categorize_one(text: str, user_id: str) -> tuple[list[ResourceMatch], int]:
    # these options are geared toward the LLM knowledgebase. We'll translate
    # them into brainshare resource types below
    options = [
        "chemical",
        "biochemical reaction",
        "biochemical pathway",
        "enzyme",
        "genome",
        "gene",
        "organism",
    ]
    content = f"""
Identify and summarize the entities being studied in this scientific article.
List each entity on a new line. Provide the full scientific name of the entity,
followed by the entity type in parentheses, followed by a summary of the how the
entity is being studied in this article. Each entity type must exist in the
entity types list. If you do not find any entities that match the list of entity
types, say "No entities found".

Entity types:

{", ".join(options)}

Input:

interesting   that,   upon   addition   of   exogenous cyclic   AMP to   the
growth   media,   the   synthesis   of   glutamate   dehydro- genase increases
while   the   synthesis   of   glutamate   synthase decreases (12).   These
observations   suggest   regulatory   differences, the function   of   which
remain   unresolved   at   present.   Further   studies on   the
inter-relationship   between   the   dehydrogcnase   and   synthase enzymes   in
g. E.  coli   will   be   pursued   with   the   strains

Output:

- glutamate dehydrogenase (protein): The synthesis of this protein increases in
  the presence of cyclic AMP during E. coli growth
- glutamate synthase (protein): The synthesis of this protein decreases in the
  presence of cyclic AMP during E. coli growth
- cyclic AMP (chemical): This chemical was added to the growth media in the
  study
- Escherichia coli (organism): The growth characteristics of this organism were
  studied

Input:

{text}

Output:"""

    res, tokens = await _single_chat(content)

    # parse the matches
    # split lines and strip list attributes
    lines = [x.replace("\n", " ").strip() for x in re.split(r"(?:^|\n)\s*-\s+", res)]

    # find scientific name, type, and summary
    def _split(s: str) -> list[str] | None:
        ms = re.match(r"(.*)\((.*)\):?(.*)", s)
        return [x.strip() for x in ms.groups()] if ms else None

    # filter for enabled match types
    translate_types = {"organism": "species", "chemical": "chemical"}
    matches = [
        ResourceMatch(type=translate_types.get(t, t), name=n, summary=s)
        for n, t, s in (x for x in (_split(x) for x in lines) if x is not None)
        if t in options
    ]
    async with db.get_session_for_user(user_id) as session:
        for match in matches:
            r = (
                (await session.execute(select(func.search(match.name, match.type))))
                .scalars()
                .one_or_none()
            )
            if r and r["results"] and len(r["results"]) > 0:
                top = sorted(r["results"], key=lambda x: x["score"], reverse=True)[0]
                match.url = f"/{top['resource']}/{top['id']}"
                match.name = top["name"]

    no_match = [(match.type, match.name) for match in matches if match.url is None]
    if len(no_match) > 0:
        print(f"Did not match {no_match}")

    return matches, tokens


async def categorize(
    text: str, user_id: str, max_requests: int = 30, max_summary_requests: int = 30
) -> tuple[list[ResourceMatch], int]:
    """Split the text and find matches in the database

    text: the text to categorize
    max_requests: the maximum number of requests to make to the OpenAI API.
    max_summary_requests: the maximum number of requests for summarization.

    """
    chunked = chunk_text(text, encoding_name=EMBEDDING_ENCODING, chunk_length=3500, overlap=20)
    data_list: list[tuple[list[ResourceMatch], int]] = await semaphore_gather(
        OPENAI_CONCURRENT_REQUESTS,
        islice((_categorize_one(c, user_id) for c in chunked), max_requests),
    )
    # flatten
    matches = list(chain.from_iterable(x[0] for x in data_list))
    tokens = sum(x[1] for x in data_list)

    # summarize matches
    keyfunc = lambda x: (x.type, x.name)
    grouped: list[list[ResourceMatch]] = list(
        list(g) for _, g in groupby(sorted(matches, key=keyfunc), keyfunc)
    )
    summary_data: list[tuple[ResourceMatch, int]] = await semaphore_gather(
        10,
        islice((_summarize_match_list(g) for g in grouped), max_summary_requests),
    )
    # flatten
    final_matches = [x[0] for x in summary_data]
    final_tokens = tokens + sum(x[1] for x in summary_data)

    print(f"Matches ({tokens}): {final_matches}")
    return final_matches, final_tokens


async def _tag_one(text: str) -> tuple[list[str], int]:
    content = f"""Provide a short list of useful search tags for the document.
List one tag on each line. Provide 5 to 10 tags in total.

Text: The mission's target asteroid was Dimorphos, the secondary member of the
S-type binary near-Earth asteroid (65803) Didymos.
Tags:
- asteroid Dimorphos
- S-type binary near-Earth asteroid

Text: {text}

Tags:"""
    res, tokens = await _single_chat(content)
    tags = [
        re.sub(r"^\s*([0-9.+-]+\s+)?", "", x).strip()
        for x in res.split("\n")
        if "no tags found" not in x.lower()
    ]
    return tags, tokens


async def tag(text: str, max_requests: int = 1) -> tuple[list[str], int]:
    # the chunk length here is about right
    chunked = chunk_text(text, encoding_name=EMBEDDING_ENCODING, chunk_length=3800, overlap=0)
    data_list: list[tuple[list[str], int]] = await semaphore_gather(
        OPENAI_CONCURRENT_REQUESTS, islice((_tag_one(c) for c in chunked), max_requests)
    )
    chunk_tags = list(set(chain.from_iterable(x[0] for x in data_list)))
    tokens = sum(x[1] for x in data_list)
    print(f"Tags ({tokens}): {chunk_tags}")
    return chunk_tags, tokens


async def _dois_one(text: str) -> tuple[list[str], int]:
    content = f"""
The goal is to identify DOI entries in text extracted from a PDF. Only provide a
DOI if the DOI string itself is found in the text. Return each DOI on a new
line. Do not invent DOIs. If a DOI is not found, return "DOI not found".

Input:

Citation:   Ranganathan S, Suthers PF, Maranas CD (2010) OptForce: An
Optimization Procedure for Identifying All Genetic Manipulations Leading to
Targeted Overproductions. PLoS Comput Biol 6(4): e1000744.
https://doi.org/10.1371 /journal.pcbi.1000744  Editor:   Nathan D. Price

Output:

- doi:10.1371/journal.pcbi.1000744

Input:

R E V I E W S  132   | FEBRUARY 2006   |   VOLUME 7
www.nature.com/reviews/genetics©   2006   Nature Publishing Group  Databases do
not generally contain all the differ- ent types of information that have been
discussed above. Consequently, various sources must be used to comprehensively
capture the relationship between dif- ferent components   (BOX 2) .

Output:

- DOI not found

Input:

Cui et al., “In vivo studies of polypyrrole peptide coated neural 6.753.454 B1
6, 2004

Output

- DOI not found

Input:

{text}

Output:"""
    res, tokens = await _single_chat(content)

    def _split_result(r: str) -> list[str]:
        return [
            re.sub(r"^\s*([0-9.+-]+\s+)?", "", x).strip()
            for x in r.split("\n")
            if len(x.strip()) > 0
            and "doi not found" not in re.sub(r"\s", " ", re.sub(r"[^a-z ]", "", x.lower()))
        ]

    final_dois = _split_result(res)

    return final_dois, tokens


async def dois(text: str, max_requests: int = 1) -> tuple[list[str], int]:
    chunked = chunk_text(text, encoding_name=EMBEDDING_ENCODING, chunk_length=3600, overlap=20)
    data_list: list[tuple[list[str], int]] = await semaphore_gather(
        OPENAI_CONCURRENT_REQUESTS, islice((_dois_one(c) for c in chunked), max_requests)
    )
    chunk_dois = list(set(chain.from_iterable(x[0] for x in data_list)))
    tokens = sum(x[1] for x in data_list)
    print(f"DOIs ({tokens}): {chunk_dois}")
    return chunk_dois, tokens


async def determine_mime_type(name: str) -> tuple[str, int]:
    """Determine the MIME type of a file with openai"""
    query = f"""Determine the the MIME type of a file; return only the answer.

    File name: {name}

    MIME type:"""
    res, tokens = await _single_chat(query)
    return res.strip(), tokens


async def summarize(text: str, max_len=10000, model="gpt-3.5-turbo") -> tuple[str, int]:
    """Summarize a text with openai"""
    query = f"""Summarize the following text into a short paragraph.

    Text:

    {text[:max_len]}

    Summary:"""
    res, tokens = await _single_chat(query)
    return res.strip(), tokens
