#!/usr/bin/env python

import os
from os.path import dirname, realpath, join
from io import BytesIO
from tempfile import NamedTemporaryFile

from dotenv import load_dotenv
from lxml import etree
from rdkit import Chem
from rdkit.Chem import Draw
from supabase import create_client, Client

# get environment variables from .env
load_dotenv()

url = os.environ.get("SUPABASE_URL")
if not url:
    raise Exception("Missing environment variable SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
if not key:
    raise Exception("Missing environment variable SUPABASE_KEY")
supabase: Client = create_client(url, key)


dir = dirname(realpath(__file__))
data_dir = join(dir, "..", "data")

m = Chem.MolFromMolFile(join(data_dir, "ChEBI_48950.mol"))
grid = Draw.MolsToGridImage([m], useSVG=True)

# with open(join(data_dir, "ChEBI_48950.svg"), "w") as f:
#     f.write(grid)

# fix svg tag
tree = etree.fromstring(str(grid).encode("utf-8"))
tree.attrib.clear()
# tree.attrib["xmlns"] = "http://www.w3.org/2000/svg"
svg = etree.tostring(tree, encoding="utf-8")

storage = supabase.storage()
bucket = "structure_images_svg"
try:
    storage.get_bucket(bucket)
except:
    storage.create_bucket(bucket, public=True)

f = NamedTemporaryFile(mode="wb", delete=False)
f.write(svg)
f.close()
storage.from_(bucket).upload("48950.svg", f.name, {"content-type": "image/svg+xml"})
