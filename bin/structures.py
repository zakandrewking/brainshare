#!/usr/bin/env python

from optparse import Option
from os.path import dirname, realpath, join
from tempfile import NamedTemporaryFile
from typing import Any, Optional
import colorsys
import os

from dotenv import load_dotenv
from lxml import etree
from rdkit import Chem
from rdkit.Chem import Draw
from rdkit.Chem.rdmolfiles import ForwardSDMolSupplier
from supabase import create_client, Client


dir = dirname(realpath(__file__))
data_dir = join(dir, "..", "data_seed")

# get environment variables from .env
load_dotenv()


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


def load_svg(
    m: Chem.Mol,
    database_id: int,
    supabase_url: Optional[str] = None,
    supabase_key: Optional[str] = None,
):
    url = supabase_url or os.environ.get("SUPABASE_URL")
    if not url:
        raise Exception("Missing environment variable SUPABASE_URL")
    key = supabase_key or os.environ.get("SUPABASE_KEY")
    if not key:
        raise Exception("Missing environment variable SUPABASE_KEY")
    supabase: Client = create_client(url, key)

    # with gzip.open("data/ChEBI_complete.sdf.gz", "rb") as f:
    #     suppl = Chem.ForwardSDMolSupplier(f)
    #     grids = [Draw.MolsToGridImage([m], useSVG=True) for m in suppl if m]

    # with open(join(data_dir, "ChEBI_48950.sdf"), "rb") as f:
    #     suppl = ForwardSDMolSupplier(f)
    #     m = next(iter(suppl))

    grid = Draw.MolsToGridImage([m], useSVG=True)

    # edit the SVG

    tree = etree.fromstring(str(grid).encode("utf-8"))
    # fix svg tag
    tree.attrib.clear()
    tree.attrib["viewBox"] = "00 50 200 100"
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

    storage = supabase.storage()
    bucket = "structure_images_svg"
    try:
        storage.get_bucket(bucket)
    except:
        storage.create_bucket(bucket, public=True)

    name = f"{database_id}.svg"
    name_dark = f"{database_id}_dark.svg"

    storage.from_(bucket).remove(name)
    storage.from_(bucket).remove(name_dark)

    with NamedTemporaryFile(mode="wb") as f3:
        f3.write(svg)
        storage.from_(bucket).upload(name, f3.name, {"content-type": "image/svg+xml"})
        f3.close()

    with NamedTemporaryFile(mode="wb") as f4:
        f4.write(svg_dark)
        storage.from_(bucket).upload(
            name_dark, f4.name, {"content-type": "image/svg+xml"}
        )
        f4.close()
