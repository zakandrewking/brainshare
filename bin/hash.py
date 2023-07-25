import hashlib

import pandas as pd


def chemical_hash_fn(inchi_key: str) -> str:
    """For now, a chemical is uniquely identified by its InChIKey. For
    consistency, we generate a MD5 hash."""
    return hashlib.md5(inchi_key.encode("utf-8")).hexdigest()


def synonym_hash_fn(target_node_hash: str, source: str, value: str) -> str:
    return hashlib.md5(f"{target_node_hash}\0{source}\0{value}".encode("utf-8")).hexdigest()


def taxonomy_hash_fn(tax_id: str) -> str:
    """For now, a taxonomy node is uniquely identified by its."""
    return hashlib.md5(tax_id.encode("utf-8")).hexdigest()


def edge_hash_fn(source_node_hash: str, target_node_hash: str, relationship: str) -> str:
    return hashlib.md5(
        f"{source_node_hash}\0{target_node_hash}\0{relationship}".encode("utf-8")
    ).hexdigest()


# reactions


def _one_hash(stoichs: pd.DataFrame) -> str:
    return hashlib.md5(
        "\0\0".join(
            "\0".join(x)
            for x in sorted(
                (s.chemical_hash, f"{s.coefficient:.2f}", s.compartment_rule or "NULL")
                for s in stoichs.itertuples()
            )
        ).encode("utf-8")
    ).hexdigest()


def _reverse(stoichs: pd.DataFrame) -> pd.DataFrame:
    new_stoichs = stoichs.copy()
    new_stoichs["coefficient"] = -new_stoichs["coefficient"]
    return new_stoichs


def reaction_hash_fn(stoichs: pd.DataFrame) -> str:
    """Creates a deterministic reaction hash that does not specify a reaction
    direction.

    First, stoichiometries are converted to strings with two decimals places,
    and empty compartment rules are replace with "NULL".

    Next, a list of tuples is created like so:

    [(chemical_hash, stoichiometry, compartment_rule), ...]

    This array is sorted by first element, then second, etc.

    Next, elements are joined by "\0" and tuples joined by "\0\0" to create a
    string, and the MD5 hash is calculated.

    Next a second hash is created using the same method, but with all of the
    stoichiometries reversed. This reverse hash is compared to the forward hash,
    and the first of the two in alphabetical order is returned.

    """
    forward = _one_hash(stoichs)
    reverse = _one_hash(_reverse(stoichs))
    return reverse if forward > reverse else forward
