import hashlib
import os
import secrets
import time
from pathlib import Path

from fastapi import Depends, HTTPException, Request, Response
from sqlalchemy import delete
from sqlalchemy.orm import Session

from .database import get_session
from .models import OwnerSession

PASSWORD_PATH = Path(__file__).resolve().parents[1] / "data" / "owner-password.txt"
attempts: dict[str, list[float]] = {}


def initialize_password():
    password = os.getenv("OWNER_PASSWORD", "")
    if password:
        if len(password) < 24:
            raise RuntimeError("OWNER_PASSWORD must contain at least 24 characters.")
        return
    if os.getenv("APP_ENV") == "production":
        raise RuntimeError("Set OWNER_PASSWORD before starting production.")
    PASSWORD_PATH.parent.mkdir(parents=True, exist_ok=True)
    try:
        with PASSWORD_PATH.open("x", encoding="utf-8") as file:
            file.write(secrets.token_urlsafe(24))
    except FileExistsError:
        pass


def check_browser_request(request: Request):
    if request.headers.get("X-Requested-With") != "FirstDatePlanner":
        raise HTTPException(403, "Недозволений запит.")


def require_owner(request: Request, session: Session = Depends(get_session)):
    token = request.cookies.get("owner_session", "")
    record = session.get(OwnerSession, hashlib.sha256(token.encode()).hexdigest())
    if not record or record.expires_at <= int(time.time()):
        raise HTTPException(401, "Увійди в кабінет.")
    if request.method != "GET":
        check_browser_request(request)
    return record


def login(password: str, request: Request, response: Response, session: Session):
    check_browser_request(request)
    address = request.client.host if request.client else "unknown"
    now = time.time()
    attempts[address] = [stamp for stamp in attempts.get(address, []) if now - stamp < 60]
    if len(attempts[address]) >= 5:
        raise HTTPException(429, "Забагато спроб. Зачекай хвилину.")
    attempts[address].append(now)
    expected = os.getenv("OWNER_PASSWORD") or PASSWORD_PATH.read_text(encoding="utf-8").strip()
    if not secrets.compare_digest(password.encode(), expected.encode()):
        raise HTTPException(401, "Неправильний пароль.")
    attempts.pop(address, None)
    session.execute(delete(OwnerSession).where(OwnerSession.expires_at <= int(now)))
    token = secrets.token_urlsafe(32)
    session.add(OwnerSession(token_hash=hashlib.sha256(token.encode()).hexdigest(), expires_at=int(now) + 28800))
    session.commit()
    response.set_cookie("owner_session", token, httponly=True, samesite="strict", secure=os.getenv("COOKIE_SECURE") == "1", max_age=28800, path="/api")
    response.headers["Cache-Control"] = "no-store"
    return {"ok": True}
