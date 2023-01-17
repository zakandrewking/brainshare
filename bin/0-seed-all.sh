#!/bin/bash

cd "$(dirname "$0")"

./1-load-chebi.py --seed-only
./2-load-taxonomy.py --load-db --number=10
./3-load-rhea.py --seed-only
# ./4-load-uniprot.py --seed-only
