#!/usr/bin/env python

from os.path import dirname, realpath, join
from tempfile import NamedTemporaryFile
from typing import Any

import colorsys
from lxml import etree
from rdkit import Chem
from rdkit.Chem import Draw
from storage3 import AsyncStorageClient  # type: ignore
from svg.path import parse_path  # type: ignore


dir = dirname(realpath(__file__))
data_dir = join(dir, "..", "data_seed")


class NoPathException(Exception):
    pass


async def upload_svg(svg: bytes, name: str, storage: AsyncStorageClient):
    bucket = "structure_images_svg"

    # overwrite
    # await storage.from_(bucket).remove(name)

    with NamedTemporaryFile(mode="wb") as f:
        f.write(svg)
        f.flush()
        try:
            await storage.from_(bucket).upload(name, f.name, {"content-type": "image/svg+xml"})
        except Exception as e:
            if "The resource already exists" in str(e):
                print(f"Trying {name} again")
                await storage.from_(bucket).remove(name)
                await storage.from_(bucket).upload(name, f.name, {"content-type": "image/svg+xml"})
            else:
                print(f"{name} error: {e}")


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
        y[0].strip(): y[1].strip() for y in (x.split(":") for x in style.split(";")) if len(y) == 2
    }
    for k, v in style_dict.items():
        if k in swappable and v != "none":
            style_dict[k] = swap_color(v)
    res = ";".join(f"{a}:{b}" for (a, b) in style_dict.items())
    return res


def get_viewbox(tree: etree._Element, padding: float) -> str:
    # Find all the `path` elements
    paths = tree.findall(".//{http://www.w3.org/2000/svg}path")

    xs = []
    ys = []

    # Iterate over all the path elements
    for path in paths:
        # Get the `d` attribute of the path element, which contains the path
        # data
        try:
            d = path.attrib["d"]
        except KeyError:
            continue

        path_obj = parse_path(d)
        point_types = ["start", "end", "radius", "control", "control1", "control2"]
        for p in path_obj:
            for t in point_types:
                try:
                    point = getattr(p, t)
                except AttributeError:
                    continue
                xs.append(point.real)
                ys.append(point.imag)

    if len(xs) == 0 or len(ys) == 0:
        raise NoPathException

    x = min(xs) - padding
    y = min(ys) - padding
    width = max(xs) - x + padding
    height = max(ys) - y + padding

    return f"{x} {y} {width} {height}"


def clean_up_svg(grid: str) -> tuple[bytes, bytes]:
    """Returns both a light and a dark version"""
    tree = etree.fromstring(str(grid).encode("utf-8"))
    # fix svg tag
    tree.attrib.clear()

    tree.attrib["viewBox"] = get_viewbox(tree, padding=20)

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

    return svg, svg_dark


async def save_svg(
    m: Chem.Mol,
    database_id: int,
    storage: AsyncStorageClient,
):
    grid = Draw.MolsToGridImage([m], useSVG=True)

    # edit the SVG
    svg, svg_dark = clean_up_svg(grid)

    name = f"{database_id}.svg"
    name_dark = f"{database_id}_dark.svg"

    await upload_svg(svg, name, storage)
    await upload_svg(svg_dark, name_dark, storage)
