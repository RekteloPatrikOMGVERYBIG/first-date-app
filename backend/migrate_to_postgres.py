"""Copy existing SQLite responses without changing or deleting their source."""
import argparse
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.database import Base
from app.models import Response


def copy_responses(source_engine, target_engine, apply=False):
    with Session(source_engine) as source, Session(target_engine) as target:
        new_rows = []
        for row in source.scalars(select(Response)):
            values = {column.name: getattr(row, column.name) for column in Response.__table__.columns}
            values['submitted_at'] = values['submitted_at'].replace(tzinfo=timezone.utc)
            existing = target.get(Response, row.id)
            if existing:
                for field, value in values.items():
                    stored = getattr(existing, field)
                    if field == 'submitted_at':
                        stored = stored.replace(tzinfo=timezone.utc)
                    if stored != value:
                        raise ValueError('An existing response has different data. Nothing was copied.')
            else:
                new_rows.append(Response(**values))
        if apply:
            target.add_all(new_rows)
            target.commit()
        return len(new_rows)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    database_url = os.environ.get('DATABASE_URL', '')
    if not database_url.startswith('postgresql+psycopg://'):
        raise ValueError('Set a PostgreSQL DATABASE_URL first.')
    source_path = Path(__file__).resolve().parent / 'data' / 'planner.db'
    if not source_path.is_file():
        raise ValueError('No SQLite database found. Start PostgreSQL without migration for a fresh database.')
    target = create_engine(database_url)
    source = create_engine(f'sqlite:///{source_path.as_posix()}')
    Base.metadata.create_all(target)
    if args.apply:
        backup_path = source_path.with_name(f"planner-backup-{datetime.now().strftime('%Y%m%d-%H%M%S-%f')}.db")
        with sqlite3.connect(source_path) as original, sqlite3.connect(backup_path) as backup:
            original.backup(backup)
    count = copy_responses(source, target, args.apply)
    print(f"{'Copied' if args.apply else 'Ready to copy'}: {count} responses. SQLite source unchanged.")
    source.dispose()
    target.dispose()


if __name__ == '__main__':
    main()
