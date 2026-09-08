from contextlib import asynccontextmanager
import os

from fastapi import FastAPI

from .database import Base, engine
from .routers import router
from .owner_routes import router as owner_router
from .auth import initialize_password


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_password()
    if os.getenv("APP_ENV") == "production" and os.getenv("COOKIE_SECURE") != "1":
        raise RuntimeError("Production requires COOKIE_SECURE=1 and HTTPS.")
    Base.metadata.create_all(engine)
    yield


app = FastAPI(title="First Date Planner API", lifespan=lifespan)
app.include_router(router)
app.include_router(owner_router)
