#!/bin/bash

cd "$(dirname "$0")"

./0.5-load-definitions.py
./1-load-chebi.py --seed-only
./2-load-taxonomy.py --seed-only
./2.5-graph-load-taxonomy.py --number 50 --load-db
./3-load-rhea.py --seed-only
./4-load-uniprot.py --seed-only
./5-load-genomes.py --seed-only
# ./6-wip-load-ontology.py --seed-only
# ./7-wip-load-metanetx.py --seed-only
# ./8-relational-to-graph.py
