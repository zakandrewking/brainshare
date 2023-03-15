import os

from sqlalchemy import MetaData, create_engine
from sqlalchemy.ext.automap import automap_base

connection_string = os.environ.get("SUPABASE_CONNECTION_STRING")
engine = create_engine(connection_string)
Base = automap_base()
Base.prepare(autoload_with=engine)
Article = Base.classes.article

async def save_article(article):

