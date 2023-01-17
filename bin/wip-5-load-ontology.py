#!/usr/bin/env python

# waiting for https://github.com/ebi-chebi/ChEBI/issues/4273
# fastobo>=0.12.2

from os.path import dirname, realpath, join
from typing import Any
import click
import networkx as nx
import obonet
import os
import subprocess

dir = dirname(realpath(__file__))
data_dir = join(dir, "..", "data")


# for jupyter %run
export: Any = {}


def get_is_a_parents(ontology: nx.MultiDiGraph, node: str) -> list[str]:
    return [node for _, node, key in ontology.out_edges(node, keys=True) if key == "is_a"]


def get_is_a_children(ontology: nx.MultiDiGraph, node: str) -> list[str]:
    return [node for node, _, key in ontology.in_edges(node, keys=True) if key == "is_a"]


def get_is_a_children_recursive(ontology: nx.MultiDiGraph, node: str) -> list[str]:
    res = [child for child, _, key in ontology.in_edges(node, keys=True) if key == "is_a"]
    return [(child, node) for child in res] + list(
        it.chain.from_iterable(get_is_a_children_recursive(ontology, child) for child in res)
    )


@click.command()
@click.option("--download", is_flag=True, help="Download ChEBI data again")
@click.option(
    "--export-all", is_flag=True, help="Read all chebi data into an export dataframe (for jupyter)"
)
def main(
    download: bool,
    export_all: bool,
):
    if download:
        print("deleting old files")

        try:
            os.remove(join(data_dir, "chebi.obo.gz"))
        except:
            pass

        print("downloading files")

        subprocess.run(
            ["axel", "https://ftp.ebi.ac.uk/pub/databases/chebi/ontology/nightly/chebi.obo.gz"],
            cwd=data_dir,
        )
    # read obo
    ontology = obonet.read_obo(join(data_dir, "chebi.obo.gz"))
    if export_all:
        export["ontology"] = ontology
    # Print all terms in the ontology
    # for term in ontology.terms:
    #     print(term.id)
    # Print all relationships for a specific term
    # term = ontology.get_term("CHEBI:15377")
    # for relationship in term.relationships:
    #     print(relationship.predicate, relationship.target)

    # is_a = nx.subgraph_view(ontology, filter_edge=lambda _, __, key: key == 'is_a')
    # nx.ancestors(is_a, 'CHEBI:17234')

    # pd.DataFrame.from_records([(a, ontology.nodes[a]['name'], b, ontology.nodes[b]['name']) for a, b in get_is_a_children_recursive(ontology, 'CHEBI:17234')],
    #                       columns=['child', 'name', 'parent', 'parent_name'])
