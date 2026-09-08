import json
import re
import unicodedata
from pathlib import Path

RULES = json.loads((Path(__file__).resolve().parents[2] / "shared" / "answer-rules.json").read_text(encoding="utf-8"))


def normalize(value: str) -> str:
    letters = "".join(c for c in unicodedata.normalize("NFKC", value).lower() if c.isalnum())
    return re.sub(r"(.)\1+", r"\1", letters)


VAGUE_WORDS = set(normalize(word) for word in RULES["vague"] + RULES["fillers"])


def is_vague(value: str) -> bool:
    normalized = normalize(value)
    if len(normalized) < 2 or not any(c.isalpha() for c in normalized):
        return True
    reachable = {0}
    for index in range(len(normalized)):
        if index not in reachable:
            continue
        for word in VAGUE_WORDS:
            if normalized.startswith(word, index):
                reachable.add(index + len(word))
    return len(normalized) in reachable
