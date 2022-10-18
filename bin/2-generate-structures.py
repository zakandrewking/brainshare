#!/usr/bin/env python

from os.path import dirname, realpath, join

from rdkit import Chem
from rdkit.Chem import Draw

dir = dirname(realpath(__file__))
data_dir = join(dir, "..", "data")

m = Chem.MolFromMolFile(join(data_dir, "ChEBI_48950.mol"))
grid = Draw.MolsToGridImage([m], useSVG=True)
with open(join(data_dir, "ChEBI_48950.svg"), "w") as f:
    f.write(grid)
