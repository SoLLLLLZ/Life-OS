import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from sqlalchemy import text

from app.config import settings
from app.database import engine, Base
from app.routes import tasks, auth, integrations, spotify

logging.basicConfig(
    level=settings.log_level.upper(),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)

# Migration: add end_at column if it doesn't exist (works on both SQLite and PostgreSQL)
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE tasks ADD COLUMN end_at TIMESTAMP"))
        conn.commit()
        logger.info("Migration: added end_at column to tasks")
    except Exception:
        # Column already exists, ignore
        pass