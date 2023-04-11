import httpx
from fuzzywuzzy import fuzz

from backend.util import semaphore_gather
from backend.schemas import CrossrefWork, CrossrefWorkAuthor


async def get_best_doi(dois: list[str], text: str) -> CrossrefWork | None:
    async with httpx.AsyncClient() as client:
        docs = await semaphore_gather(
            5,
            [
                client.get(f"https://api.crossref.org/works/{doi.replace('doi:', '')}")
                for doi in dois
            ],
        )
    print(docs)
    best_score = 0
    best_work: CrossrefWork | None = None
    for doi, doc in zip(dois, docs):
        try:
            details = doc.json()["message"]
        except Exception:
            print(f"Could not get article details for {doi}")
            continue
        title = details.get("title", [])[0]
        score = fuzz.partial_ratio(title, text)
        if score > best_score and score > 70:
            best_score = score
            best_work = CrossrefWork(
                title=title,
                authors=[
                    CrossrefWorkAuthor(
                        given=a.get("given"), family=a.get("family"), sequence=a.get("sequence")
                    )
                    for a in details.get("author", [])
                ],
                journal=details.get("short-container-title", [None])[0],
                doi=doi,
            )
    return best_work
