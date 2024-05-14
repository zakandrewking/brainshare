from sqlmodel import SQLModel


class AppToDeploy(SQLModel):
    id: str
    clean_up_only: bool = False
