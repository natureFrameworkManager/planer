from fastapi import FastAPI
from sqlmodel import select
from contextlib import asynccontextmanager

from database.database import create_db_and_tables, SessionDep
from database.models import *
from database.parse import parse_and_populate

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    parse_and_populate()
    yield

app = FastAPI(lifespan=lifespan)

@app.get("/modules")
def get_modules(session: SessionDep):
    modules = session.exec(select(Module)).all()
    return modules
