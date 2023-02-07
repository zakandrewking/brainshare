#!/usr/bin/env python

import asyncio
import os
from os.path import dirname, realpath, join
import subprocess

import click
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from storage3 import create_client, AsyncStorageClient  # type: ignore
from storage3.utils import StorageException  # type: ignore

# get environment variables from .env
load_dotenv()

dir = dirname(realpath(__file__))
data_dir = join(dir, "..", "data")
seed_dir = join(dir, "..", "seed_data")


@click.command()
@click.option("--seed-only", is_flag=True, help="Just seed a few entries")
@click.option("--download", is_flag=True, help="Download ChEBI data again")
@click.option("--load-db", is_flag=True, help="Write to the database")
@click.option("--number", type=int, help="Load the first 'number' chemicals")
@click.option("--connection-string", type=str, help="Select another postgres connection string")
@click.option("--supabase-url", type=str, help="Supabase URL")
@click.option("--supabase-key", type=str, help="Supabase service key")
def main(*args, **kwargs):
    asyncio.run(async_main(*args, **kwargs))


async def async_main(
    seed_only: bool,
    download: bool,
    load_db: bool,
    number: int | None,
    connection_string: str | None,
    supabase_url: str | None,
    supabase_key: str | None,
):
    engine = create_engine(
        connection_string or "postgresql+psycopg2://postgres:postgres@localhost:54322/postgres"
    )
    session = Session(engine, future=True)  # type: ignore

    url = supabase_url or os.environ.get("SUPABASE_URL")
    if not url:
        raise Exception("Missing environment variable SUPABASE_URL")
    key = supabase_key or os.environ.get("SUPABASE_KEY")
    if not key:
        raise Exception("Missing environment variable SUPABASE_KEY")

    storage: AsyncStorageClient = create_client(
        url=f"{url}/storage/v1",
        is_async=True,
        headers={"apiKey": key, "Authorization": f"Bearer {key}"},
    )

    # NOTE: automap_base requires every table to have a primary key
    # https://docs.sqlalchemy.org/en/20/faq/ormconfiguration.html#how-do-i-map-a-table-that-has-no-primary-key
    Base = automap_base()
    Base.prepare(autoload_with=engine)
    Genome = Base.classes.genome
    GenomeSynonym = Base.classes.genome_synonym
    Species = Base.classes.species

    if seed_only:
        raise NotImplementedError
        print("exiting")
        return

    if download:
        print("deleting old files")
        try:
            os.remove(join(data_dir, "GCF_000005845.2_ASM584v2_genomic.gbff.gz"))
        except:
            pass

        print("downloading files")
        subprocess.run(
            [
                "axel",
                "https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/000/005/845/GCF_000005845.2_ASM584v2/GCF_000005845.2_ASM584v2_genomic.gbff.gz",
            ],
            cwd=data_dir,
        )

    if load_db:
        species = session.query(Species).filter(Species.id == 58396).one()
        genome = Genome(
            strain_name="Escherichia coli str. K-12 substr. MG1655",
            genome_synonym_collection=[
                GenomeSynonym(source="ncbi_taxonomy", value="511145"),
                GenomeSynonym(source="refseq_chromosome", value="NC_000913.3"),
                GenomeSynonym(source="refseq_assembly", value="GCF_000005845.2"),
            ],
            species=species,
            genbank_gz_object="GCF_000005845.2_ASM584v2_genomic.gbff.gz",
        )
        session.add(genome)
        session.commit()

        bucket = genome.sequence_bucket
        try:
            await storage.get_bucket(bucket)
        except StorageException:
            await asyncio.sleep(1)
            await storage.create_bucket(bucket, public=True)

        await storage.from_(bucket).upload(
            genome.genbank_gz_object,
            join(data_dir, genome.genbank_gz_object),
            {"content-type": "application/x-gzip"},
        )

    print("done")


if __name__ == "__main__":
    main()
