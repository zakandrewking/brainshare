from backend.util import batched


def test_batched():
    l = ["a", "b", "c", "d", "e", "f", "g", "h"]
    r = batched(l, 3, 1)
    assert list(r) == [("a", "b", "c"), ("c", "d", "e"), ("e", "f", "g"), ("g", "h")]


def test_batched_overhang():
    l = ["a", "b", "c", "d", "e", "f", "g"]
    r = batched(l, 3, 1)
    assert list(r) == [("a", "b", "c"), ("c", "d", "e"), ("e", "f", "g")]


def test_batched_3():
    l = ["a", "b", "c", "d", "e", "f"]
    r = batched(l, 3, 1)
    assert list(r) == [("a", "b", "c"), ("c", "d", "e"), ("e", "f")]
