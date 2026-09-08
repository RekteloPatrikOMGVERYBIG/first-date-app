from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy import update
from sqlalchemy.orm import Session

from .database import get_session
from .models import Response, Invitation
from .auth import require_owner
from .schemas import ResponseCreate, ResponseReceipt

router = APIRouter(prefix="/api")


@router.get("/health")
def health():
    return {"status": "ok"}


def save_response(payload: ResponseCreate, session: Session, commit=True):
    response_id = str(payload.submission_id)
    values = payload.model_dump(exclude={"submission_id"})

    def receipt_for(existing: Response):
        if any(getattr(existing, field) != value for field, value in values.items()):
            raise HTTPException(409, "Ця анкета вже надіслана з іншими відповідями.")
        return ResponseReceipt(id=existing.id)

    existing = session.get(Response, response_id)
    if existing:
        return receipt_for(existing)

    # UTC-12 is the last timezone to leave a calendar day. Avoid rejecting
    # today's date for visitors whose local day differs from the server's.
    earliest_today = (datetime.now(timezone.utc) - timedelta(hours=12)).date()
    if payload.preferred_date < earliest_today:
        raise HTTPException(422, "Обери сьогоднішню або майбутню дату.")

    response = Response(id=response_id, **values)
    session.add(response)
    if not commit:
        session.flush()
        return ResponseReceipt(id=response_id)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        existing = session.get(Response, response_id)
        if existing:
            return receipt_for(existing)
        raise
    return ResponseReceipt(id=response_id)


@router.post("/responses", response_model=ResponseReceipt, dependencies=[Depends(require_owner)])
def submit_response(payload: ResponseCreate, session: Session = Depends(get_session)):
    return save_response(payload, session)


@router.post("/invites/{token}/open")
def open_invitation(token: str, session: Session = Depends(get_session)):
    invitation = session.get(Invitation, token)
    if not invitation:
        raise HTTPException(404, "Запрошення не знайдено.")
    session.execute(update(Invitation).where(Invitation.token == token, Invitation.opened_at.is_(None))
                    .values(opened_at=datetime.now(timezone.utc)))
    session.commit()
    return {"status": "submitted" if invitation.response_id else "opened"}


@router.post("/invites/{token}/responses", response_model=ResponseReceipt)
def invite_response(token: str, payload: ResponseCreate, session: Session = Depends(get_session)):
    invitation = session.get(Invitation, token)
    if not invitation:
        raise HTTPException(404, "Запрошення не знайдено.")
    response_id = str(payload.submission_id)
    if invitation.response_id:
        if invitation.response_id == response_id:
            return save_response(payload, session)
        raise HTTPException(409, "Це запрошення вже заповнене.")
    if session.get(Response, response_id):
        raise HTTPException(409, "Ця відповідь уже використана.")
    try:
        receipt = save_response(payload, session, commit=False)
        claimed = session.execute(update(Invitation).where(Invitation.token == token, Invitation.response_id.is_(None))
                                  .values(response_id=response_id, opened_at=invitation.opened_at or datetime.now(timezone.utc)))
        if claimed.rowcount != 1:
            session.rollback()
            raise HTTPException(409, "Це запрошення вже заповнене.")
        session.commit()
        return receipt
    except IntegrityError:
        session.rollback()
        invitation = session.get(Invitation, token)
        if invitation.response_id == response_id:
            return save_response(payload, session)
        raise HTTPException(409, "Це запрошення вже заповнене.")
