from datetime import date, timedelta
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session

from app import main
from app import auth
from app.database import Base, get_session
from app.models import Response


@pytest.fixture
def api(tmp_path, monkeypatch):
    engine = create_engine(f"sqlite:///{(tmp_path / 'test.db').as_posix()}", connect_args={"check_same_thread": False})
    monkeypatch.setattr(main, "engine", engine)
    monkeypatch.setattr(auth, "PASSWORD_PATH", tmp_path / "owner-password.txt")
    auth.attempts.clear()

    def session_override():
        with Session(engine) as session:
            yield session

    main.app.dependency_overrides[get_session] = session_override
    with TestClient(main.app) as client:
        client.headers["X-Requested-With"] = "FirstDatePlanner"
        assert client.post("/api/owner/login", json={"password": auth.PASSWORD_PATH.read_text()}).status_code == 200
        yield client, engine
    main.app.dependency_overrides.clear()
    engine.dispose()


@pytest.fixture
def payload():
    return {
        "submission_id": str(uuid4()), "name": "  Оля  ",
        "preferred_date": str(date.today() + timedelta(days=7)),
        "preferred_time": "18:30", "flowers": "Тюльпани", "food": "Суші",
        "drinks": "Чай", "location": "Кафе біля річки", "mood": "Спокійна розмова",
        "dislikes": "", "notes": "Без гучної музики",
    }


def test_persists_after_reopening_database(api, payload):
    client, engine = api
    result = client.post("/api/responses", json=payload)
    assert result.status_code == 200
    assert result.json() == {"id": payload["submission_id"], "status": "submitted"}
    # Dispose connections, then reopen the file through a separate engine.
    engine.dispose()
    reopened = create_engine(engine.url)
    with Session(reopened) as session:
        saved = session.get(Response, payload["submission_id"])
        assert saved.name == "Оля"
        assert saved.notes == payload["notes"]
        assert saved.submitted_at is not None
    reopened.dispose()


def test_retry_does_not_duplicate_and_changed_payload_conflicts(api, payload):
    client, engine = api
    assert client.post("/api/responses", json=payload).status_code == 200
    assert client.post("/api/responses", json=payload).status_code == 200
    assert client.post("/api/responses", json={**payload, "food": "Піца"}).status_code == 409
    with Session(engine) as session:
        assert session.scalar(select(func.count()).select_from(Response)) == 1


@pytest.mark.parametrize("field,value", [
    ("name", "  "), ("flowers", "НЕ ЗНАЮ!!!"), ("food", "хз"),
    ("mood", "незнати"), ("dislikes", "незнати"),
    ("location", "???"), ("mood", "байдуже"), ("notes", "не знаю"),
    ("drinks", "а" * 2001), ("preferred_date", "2020-01-01"),
    ("preferred_time", "25:90"),
])
def test_invalid_answers_are_not_saved(api, payload, field, value):
    client, engine = api
    assert client.post("/api/responses", json={**payload, field: value}).status_code == 422
    with Session(engine) as session:
        assert session.scalar(select(func.count()).select_from(Response)) == 0


def test_answers_are_not_publicly_readable(api, payload):
    client, _ = api
    client.post("/api/responses", json=payload)
    assert client.get("/api/responses").status_code == 405
    assert client.get(f"/api/responses/{payload['submission_id']}").status_code == 404


def test_invite_lifecycle_and_one_response(api, payload):
    client, engine = api
    token = client.post('/api/owner/invitations', json={'label': 'Тест'}).json()['token']
    assert client.get('/api/owner/dashboard').json()['invitations'][0]['status'] == 'not_opened'
    assert client.post(f'/api/invites/{token}/open').json() == {'status': 'opened'}
    assert client.get('/api/owner/dashboard').json()['invitations'][0]['status'] == 'opened'
    client.post('/api/owner/logout')
    url = f'/api/invites/{token}/responses'
    assert client.post(url, json=payload).status_code == 200
    assert client.post(url, json=payload).status_code == 200
    assert client.post(url, json={**payload, 'submission_id': str(uuid4())}).status_code == 409
    assert client.post(f'/api/invites/{token}/open').json() == {'status': 'submitted'}
    with Session(engine) as session:
        assert session.scalar(select(func.count()).select_from(Response)) == 1


def test_owner_protection_and_logout(api, payload):
    client, _ = api
    cookie = client.cookies.get('owner_session')
    assert client.get('/api/owner/dashboard').status_code == 200
    del client.headers['X-Requested-With']
    assert client.post('/api/owner/invitations', json={'label': 'x'}).status_code == 403
    client.headers['X-Requested-With'] = 'FirstDatePlanner'
    assert client.post('/api/owner/logout').status_code == 200
    assert client.get('/api/owner/dashboard').status_code == 401
    assert client.post('/api/owner/invitations', json={'label': 'x'}).status_code == 401
    assert client.post('/api/responses', json=payload).status_code == 401
    client.cookies.set('owner_session', cookie)
    assert client.get('/api/owner/dashboard').status_code == 401
    assert client.post('/api/invites/missing/open').status_code == 404
    assert client.post('/api/invites/missing/responses', json=payload).status_code == 404


def test_login_limits_and_expiration(api):
    client, engine = api
    from app.models import OwnerSession
    with Session(engine) as session:
        for record in session.scalars(select(OwnerSession)):
            record.expires_at = 0
        session.commit()
    assert client.get('/api/owner/dashboard').status_code == 401
    for _ in range(5):
        assert client.post('/api/owner/login', json={'password': 'wrong'}).status_code == 401
    assert client.post('/api/owner/login', json={'password': 'wrong'}).status_code == 429
