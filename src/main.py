from fastapi import FastAPI, Depends
from fastapi.responses import JSONResponse
from sqlmodel import Session, select
from contextlib import asynccontextmanager

from database.database import create_db_and_tables, get_session, SessionDep
from database.models import *

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)

@app.get("/modules")
def get_modules(session: SessionDep):
    modules = session.exec(select(Module)).all()
    return modules