import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.config import settings

from app.database import get_db
from app.models import User, IntegrationToken
from app.auth import get_current_user
from app.services.google_service import sync_google_calendar, sync_gmail
from app.services.gradescope_service import sync_gradescope

router = APIRouter(prefix="/integrations", tags=["integrations"])
logger = logging.getLogger(__name__)


@router.get("/status")
def get_integration_status(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    google = db.execute(
        select(IntegrationToken).where(
            IntegrationToken.user_id == user.id,
            IntegrationToken.provider == "google"
        )
    ).scalar_one_or_none()

    spotify = db.execute(
        select(IntegrationToken).where(
            IntegrationToken.user_id == user.id,
            IntegrationToken.provider == "spotify"
        )
    ).scalar_one_or_none()

    return {
        "google": google is not None,
        "gradescope": bool(settings.gradescope_email and settings.gradescope_password),
        "spotify": spotify is not None,
    }


@router.post("/google/sync")
def sync_google(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    calendar_count = sync_google_calendar(user, db)
    gmail_count = sync_gmail(user, db)
    return {
        "calendar_tasks_added": calendar_count,
        "gmail_tasks_added": gmail_count,
    }


@router.post("/gradescope/sync")
def sync_gradescope_route(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    count = sync_gradescope(user, db)
    return {"assignments_added": count}


@router.post("/sync/all")
def sync_all(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    calendar_count = sync_google_calendar(user, db)
    gmail_count = sync_gmail(user, db)
    gradescope_count = sync_gradescope(user, db)
    return {
        "calendar_tasks_added": calendar_count,
        "gmail_tasks_added": gmail_count,
        "gradescope_assignments_added": gradescope_count,
    }