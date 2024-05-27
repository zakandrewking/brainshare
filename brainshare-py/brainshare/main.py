from os.path import exists
import os


def deploy_db_file(project_name: str, db_file_path: str):
    """Deploy the database file to a supabase bucket which is secured behind our
    auth layer."""
    api_key = os.environ.get("BRAINSHARE_API_KEY")
    if api_key is None:
        raise Exception("Missing environment variable BRAINSHARE_API_KEY")

    if not exists(db_file_path):
        raise Exception(f"DB file {db_file_path} does not exist")
