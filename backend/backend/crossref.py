import httpx
import itertools as it
from fuzzysearch import find_near_matches
from glom import glom

from backend.util import semaphore_gather, strip_tags
from backend.schemas import CrossrefWork, CrossrefWorkAuthor


async def get_best_doi(dois: list[str], text: str) -> CrossrefWork | None:
    """Find the matching title closest to the beginning of the doc"""
    async with httpx.AsyncClient() as client:
        docs = await semaphore_gather(
            5,
            [
                client.get(f"https://api.crossref.org/works/{doi.replace('doi:', '')}")
                for doi in dois
            ],
        )
    best_index = float("inf")
    best_work: CrossrefWork | None = None
    best_distance: int | None = None
    for doi, doc in zip(dois, docs):
        try:
            details: dict = doc.json()["message"]
        except Exception:
            print(f"Could not get article details for {doi}")
            continue
        title = details.get("title", [])[0]

        # find the best match of the title, with some string normalization
        # because PDF text extracts are all over the place
        def _norm(s: str) -> str:
            return strip_tags(s).lower().replace(" ", "")

        first_match = next(
            iter(
                sorted(
                    find_near_matches(_norm(title), _norm(text), max_l_dist=3),
                    key=lambda x: x.start,
                )
            ),
            None,
        )
        if first_match and first_match.start < best_index:
            best_index = first_match.start
            best_distance = first_match.dist
            best_work = CrossrefWork(
                title=title,
                authors=[
                    CrossrefWorkAuthor(
                        given=a.get("given"), family=a.get("family"), sequence=a.get("sequence")
                    )
                    for a in details.get("author", [])
                ],
                journal=glom(details, "short-container-title.0", default=None),
                doi=doi,
            )
    print(f"best DOI match distance: {best_distance}")

    return best_work
