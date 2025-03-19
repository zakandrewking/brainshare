from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pytz import UTC
from sqlalchemy.ext.asyncio import AsyncSession

from backend import auth, db
from backend.routers import suggest_widget
from backend.suggest.custom_type import (
    CustomTypeSuggestion,
    SuggestCustomTypeArgs,
    suggest_custom_type,
)
from backend.suggest.identify import Identification, IdentifyColumnArgs, identify_column

app = FastAPI()
app.include_router(suggest_widget.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------
# Healthcheck
# -----------


@app.get("/health")
def get_health() -> None:
    return


@app.post("/suggest/custom-type")
async def get_suggest_custom_type(
    args: SuggestCustomTypeArgs,
    session: AsyncSession = Depends(db.session),
    user_id: str = Depends(auth.get_user_id),  # authenticate
) -> CustomTypeSuggestion:
    return await suggest_custom_type(
        args=args,
        session=session,
        user_id=user_id,
    )


@app.post("/identify/column")
async def get_identify_column(
    args: IdentifyColumnArgs,
    session: AsyncSession = Depends(db.session),
    user_id: str = Depends(auth.get_user_id),  # authenticate
) -> Identification:
    return await identify_column(
        args=args,
        session=session,
        user_id=user_id,
    )
