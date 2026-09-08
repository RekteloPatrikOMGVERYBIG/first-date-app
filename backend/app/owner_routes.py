import secrets

from fastapi import APIRouter, Depends, Request, Response as HttpResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .auth import login, require_owner
from .database import get_session
from .models import Invitation, OwnerSession, Response

router = APIRouter(prefix="/api/owner")


class LoginBody(BaseModel):
    password: str = Field(max_length=200)


class InviteBody(BaseModel):
    label: str = Field(min_length=1, max_length=100)


@router.post("/login")
def sign_in(body: LoginBody, request: Request, response: HttpResponse, session: Session = Depends(get_session)):
    return login(body.password, request, response, session)


@router.post("/logout")
def sign_out(response: HttpResponse, owner: OwnerSession = Depends(require_owner), session: Session = Depends(get_session)):
    session.delete(owner)
    session.commit()
    response.delete_cookie("owner_session", path="/api")
    return {"ok": True}


@router.get("/dashboard", dependencies=[Depends(require_owner)])
def dashboard(response: HttpResponse, session: Session = Depends(get_session)):
    response.headers["Cache-Control"] = "no-store"
    invitations = session.scalars(select(Invitation).order_by(Invitation.created_at.desc())).all()
    answers = session.scalars(select(Response).order_by(Response.submitted_at.desc())).all()
    return {
        "invitations": [{"token": item.token, "label": item.label, "created_at": item.created_at,
                         "status": "submitted" if item.response_id else "opened" if item.opened_at else "not_opened",
                         "response_id": item.response_id} for item in invitations],
        "responses": [{column.name: getattr(item, column.name) for column in Response.__table__.columns} for item in answers],
    }


@router.post("/invitations", dependencies=[Depends(require_owner)])
def create_invitation(body: InviteBody, session: Session = Depends(get_session)):
    invitation = Invitation(token=secrets.token_urlsafe(24), label=body.label.strip() or "Побачення")
    session.add(invitation)
    session.commit()
    return {"token": invitation.token}
