from datetime import date, time

import pytest
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session

from app.database import Base
from app.models import Response
from migrate_to_postgres import copy_responses


def test_copy_preview_retry_and_conflict_are_safe(tmp_path):
    source = create_engine(f"sqlite:///{(tmp_path / 'source.db').as_posix()}")
    target = create_engine(f"sqlite:///{(tmp_path / 'target.db').as_posix()}")
    for engine in (source, target):
        Base.metadata.create_all(engine)
    with Session(source) as session:
        session.add(Response(id='test-id', name='Оля', preferred_date=date(2030, 1, 1),
                             preferred_time=time(18, 30), flowers='Тюльпани', food='Суші',
                             drinks='Чай', location='Парк', mood='незнати', dislikes='', notes=''))
        session.commit()
    assert copy_responses(source, target) == 1
    with Session(target) as session:
        assert session.scalar(select(func.count()).select_from(Response)) == 0
    assert copy_responses(source, target, apply=True) == 1
    assert copy_responses(source, target, apply=True) == 0
    with Session(source) as session:
        assert session.get(Response, 'test-id').mood == 'незнати'
    with Session(target) as session:
        session.get(Response, 'test-id').name = 'Інше ім’я'
        session.commit()
    with pytest.raises(ValueError):
        copy_responses(source, target, apply=True)
    with Session(target) as session:
        assert session.get(Response, 'test-id').name == 'Інше ім’я'
    source.dispose()
    target.dispose()
