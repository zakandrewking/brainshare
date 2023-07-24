import hashlib


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
