import pytest
from app.answer_validation import RULES, is_vague


@pytest.mark.parametrize("value", RULES["cases"]["reject"])
def test_vague_answers(value):
    assert is_vague(value)


@pytest.mark.parametrize("value", RULES["cases"]["accept"])
def test_meaningful_answers(value):
    assert not is_vague(value)
