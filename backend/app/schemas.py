from datetime import date, time
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator
from .answer_validation import is_vague


class ResponseCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    submission_id: UUID
    name: str = Field(min_length=1, max_length=80)
    preferred_date: date
    preferred_time: time
    flowers: str = Field(min_length=1, max_length=2000)
    food: str = Field(min_length=1, max_length=2000)
    drinks: str = Field(min_length=1, max_length=2000)
    location: str = Field(min_length=1, max_length=2000)
    mood: str = Field(min_length=1, max_length=2000)
    dislikes: str = Field(default="", max_length=2000)
    notes: str = Field(default="", max_length=2000)

    @field_validator("name", "flowers", "food", "drinks", "location", "mood", "dislikes", "notes")
    @classmethod
    def concrete_answer(cls, value: str) -> str:
        if not value:
            return value
        if is_vague(value):
            raise ValueError("Напиши конкретну відповідь замість «не знаю» чи «байдуже».")
        return value


class ResponseReceipt(BaseModel):
    id: str
    status: str = "submitted"
