import os
from pathlib import Path

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager

from database.database import create_db_and_tables
from database.parse import parse_and_populate
from routers import modules, events, staff, locations, degrees, semesters


# --- App lifecycle ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    parse_and_populate()
    yield

# --- Read proxy path from environment (Defaults to /planer/v1 for production) ---
PROXY_ROOT_PATH = os.getenv("PROXY_ROOT_PATH", "/planer/v1")

app = FastAPI(
    lifespan=lifespan,
    title="Uni Planer API",
    summary="University Schedule API",
    description="API for accessing university schedule data including modules, events, staff, locations, degrees, and semesters.",
    version="1.0.0",
    root_path=PROXY_ROOT_PATH,  # <-- CRITICAL: Tells Swagger to prepend this path to all core schemas
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# --- Frontend static files ---

SERVE_FRONTEND = os.getenv("SERVE_FRONTEND", "true").lower() == "true"

if SERVE_FRONTEND:
    frontend_dir = Path(__file__).parent.parent / "frontend"

    app.mount("/assets", StaticFiles(directory=frontend_dir / "assets"), name="assets")
    app.mount("/css", StaticFiles(directory=frontend_dir / "css"), name="css")
    app.mount("/js", StaticFiles(directory=frontend_dir / "js"), name="js")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        """Serve frontend files; fall back to index.html for SPA routing."""
        file_path = frontend_dir / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dir / "index.html")

# --- API routers (all prefixed under /api) ---

if SERVE_FRONTEND:
    api_router = APIRouter(prefix="/api")
else:
    api_router = APIRouter(prefix="")
api_router.include_router(modules.router)
api_router.include_router(events.router)
api_router.include_router(staff.router)
api_router.include_router(locations.router)
api_router.include_router(degrees.router)
api_router.include_router(semesters.router)
app.include_router(api_router)