from fastapi import APIRouter, Depends

from backend import auth, schemas
from backend.suggest import widget

router = APIRouter(
    prefix="/widgets",
    tags=["widgets"],
    dependencies=[Depends(auth.get_user_id)],
)


@router.post("/suggest")
async def get_suggest_widget(
    args: schemas.SuggestWidgetArgs,
) -> schemas.WidgetSuggestion:
    return await widget.suggest_widget(
        engine=args.engine,
        columns=args.columns,
        existing_widgets=args.existingWidgets,
        data_size=args.dataSize,
    )
