from datetime import date, datetime, time, timezone

from sqlalchemy import DateTime, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class Response(Base):
    __tablename__ = "responses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    preferred_date: Mapped[date]
    preferred_time: Mapped[time]
    flowers: Mapped[str] = mapped_column(Text)
    food: Mapped[str] = mapped_column(Text)
    drinks: Mapped[str] = mapped_column(Text)
    location: Mapped[str] = mapped_column(Text)
    mood: Mapped[str] = mapped_column(Text)
    dislikes: Mapped[str] = mapped_column(Text)
    notes: Mapped[str] = mapped_column(Text)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class Invitation(Base):
    __tablename__ = "invitations"
    token: Mapped[str] = mapped_column(String(64), primary_key=True)
    label: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    opened_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    response_id: Mapped[str | None] = mapped_column(ForeignKey("responses.id"), unique=True, nullable=True)


class OwnerSession(Base):
    __tablename__ = "owner_sessions"
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    expires_at: Mapped[int]
