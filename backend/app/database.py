import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session

database_path = Path(__file__).resolve().parents[1] / "data" / "planner.db"
database_url = os.getenv("DATABASE_URL", f"sqlite:///{database_path.as_posix()}")
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+psycopg://", 1)
elif database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)
if os.getenv("APP_ENV") == "production" and not database_url.startswith("postgresql+psycopg://"):
    raise RuntimeError("Production requires a PostgreSQL DATABASE_URL.")
if database_url.startswith("sqlite:"):
    database_path.parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(
    database_url,
    connect_args={"check_same_thread": False} if database_url.startswith("sqlite:") else {},
    pool_pre_ping=True,
)


class Base(DeclarativeBase):
    pass


def get_session():
    with Session(engine) as session:
        yield session
