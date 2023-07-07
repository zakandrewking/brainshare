from sqlalchemy.ext.asyncio import AsyncSession

from backend import ai, crossref
from backend.schemas import DocToAnnotate, Annotations, CrossrefWork


async def annotate(text: str) -> Annotations:
    # flags to limit usage during testing
    categorize = True
    categorize_max = 20
    tag = True
    doi = True

    if categorize:
        categories, t1 = await ai.categorize(text, max_requests=categorize_max)
    else:
        categories, t1 = [], 0
    if tag:
        tags, t2 = await ai.tag(text)
    else:
        tags, t2 = [], 0
    if doi:
        dois, t3 = await ai.dois(text)
    else:
        dois, t3 = [], 0
    tokens = t1 + t2 + t3
    crossref_work = await crossref.get_best_doi(dois, text)

    if not doi:  # for debugging
        crossref_work = CrossrefWork(doi="test", title="Fake", authors=[])

    # TODO use https://devdojo.com/bobbyiliev/how-to-use-server-sent-events-sse-with-fastapi
    return Annotations(categories=categories, tags=tags, crossref_work=crossref_work, tokens=tokens)
