#!/usr/bin/env python

"""To run in Jupyter, use this first:

```
from rdkit.Chem.Draw import IPythonConsole
IPythonConsole.UninstallIPythonRenderer()
```

and this after:

```
IPythonConsole.InstallIPythonRenderer()
```

Also useful:

```
from IPython.display import SVG, display
display(SVG(svg))
```

"""

import os
from os.path import dirname, realpath, join
from io import BytesIO
from tempfile import NamedTemporaryFile
from typing import Any
import colorsys

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


def hex_to_rgb(hex: str) -> tuple[float, ...]:
    return tuple(int(hex.lstrip("#")[i : i + 2], 16) for i in (0, 2, 4))


def swap_color(color: str) -> str:
    rgb = hex_to_rgb(color)
    hls = colorsys.rgb_to_hls(*(x / 256 for x in rgb))
    hls_swap = (hls[0], -(hls[1] * 0.5 - 1.0), hls[2] * 0.9)
    rgb_swap = tuple(x * 256 for x in colorsys.hls_to_rgb(*hls_swap))
    return f"rgb({rgb_swap[0]},{rgb_swap[1]},{rgb_swap[2]})"


def swap_style(style: str) -> str:
    swappable = ["fill", "stroke"]  # handle none
    style_dict = {
        y[0].strip(): y[1].strip()
        for y in (x.split(":") for x in style.split(";"))
        if len(y) == 2
    }
    for k, v in style_dict.items():
        if k in swappable and v != "none":
            style_dict[k] = swap_color(v)
    res = ";".join(f"{a}:{b}" for (a, b) in style_dict.items())
    return res


dir = dirname(realpath(__file__))
data_dir = join(dir, "..", "data")

m = Chem.MolFromMolFile(join(data_dir, "ChEBI_48950.mol"))
grid = Draw.MolsToGridImage([m], useSVG=True)

# edit the SVG

tree = etree.fromstring(str(grid).encode("utf-8"))
# fix svg tag
tree.attrib.clear()
# remove comments and rects
comments: Any = tree.xpath("//comment()")
rects: Any = tree.xpath('//*[local-name()="rect"]')
for c in comments + rects:
    p = c.getparent()
    p.remove(c)
svg = etree.tostring(tree, encoding="utf-8")

# create a dark version
has_style: Any = tree.xpath("//*[@style]")
for c in has_style:
    c.attrib["style"] = swap_style(c.attrib["style"])
has_fill: Any = tree.xpath("//*[@fill]")
for c in has_fill:
    c.attrib["fill"] = swap_color(c.attrib["fill"])
svg_dark = etree.tostring(tree, encoding="utf-8")

with open(join(data_dir, "ChEBI_48950.svg"), "w") as f:
    f.write(grid)

storage = supabase.storage()
bucket = "structure_images_svg"
try:
    storage.get_bucket(bucket)
except:
    storage.create_bucket(bucket, public=True)

storage.from_(bucket).remove("48950.svg")
storage.from_(bucket).remove("48950_dark.svg")

with NamedTemporaryFile(mode="wb") as f:  # type: ignore
    f.write(svg)  # type: ignore
    storage.from_(bucket).upload("48950.svg", f.name, {"content-type": "image/svg+xml"})
    f.close()

with NamedTemporaryFile(mode="wb") as f:  # type: ignore
    f.write(svg_dark)  # type: ignore
    storage.from_(bucket).upload(
        "48950_dark.svg", f.name, {"content-type": "image/svg+xml"}
    )
    f.close()
