"""Local owner-only inspection. No public endpoint exposes answers."""
import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import engine
from app.models import Response

with Session(engine) as session:
    for response in session.scalars(select(Response).order_by(Response.submitted_at.desc())):
        print(json.dumps(
            {column.name: getattr(response, column.name) for column in Response.__table__.columns},
            ensure_ascii=False, default=str, indent=2,
        ))
