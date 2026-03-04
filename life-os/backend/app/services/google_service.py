import logging
from datetime import datetime, timezone
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models import User, Task, TaskSource, TaskStatus, IntegrationToken

logger = logging.getLogger(__name__)

ACTION_KEYWORDS = [
    "please", "can you", "could you", "action required", "action needed",
    "to do", "todo", "follow up", "follow-up", "by friday", "by monday",
    "by tuesday", "by wednesday", "by thursday", "deadline", "due",
    "urgent", "asap", "reminder", "don't forget", "please review",
    "please complete", "please respond", "response needed", "reply needed"
]


def get_google_credentials(user: User, db: Session):
    token_row = db.execute(
        select(IntegrationToken).where(
            IntegrationToken.user_id == user.id,
            IntegrationToken.provider == "google"
        )
    ).scalar_one_or_none()

    if not token_row:
        return None

    from app.config import settings
    creds = Credentials(
        token=token_row.access_token,
        refresh_token=token_row.refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
    )

    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        token_row.access_token = creds.token
        db.commit()

    return creds


def sync_google_calendar(user: User, db: Session) -> int:
    creds = get_google_credentials(user, db)
    if not creds:
        return 0

    service = build("calendar", "v3", credentials=creds)

    # Get all calendars
    calendars_result = service.calendarList().list().execute()
    calendars = calendars_result.get("items", [])

    now = datetime.now(timezone.utc).isoformat()
    count = 0

    for calendar in calendars:
        cal_id = calendar["id"]
        cal_name = calendar.get("summary", "Unknown")
        if any(skip in cal_name.lower() for skip in ["holiday", "holidays", "birthdays", "contacts"]):
            continue

        try:
            events_result = service.events().list(
                calendarId=cal_id,
                timeMin=now,
                singleEvents=True,
                orderBy="startTime",
                maxResults=250,
            ).execute()
            events = events_result.get("items", [])
        except Exception as e:
            logger.warning(f"Could not fetch calendar {cal_name}: {e}")
            continue

        for event in events:
            event_id = event["id"]
            title = event.get("summary", "Untitled Event")
            description = event.get("description")
            html_link = event.get("htmlLink")

            start = event.get("start", {})
            due_at = None
            if "dateTime" in start:
                # Google returns timezone-aware datetimes (e.g. 09:00-05:00).
                # We want the *wall-clock* time the user sees in Calendar,
                # not UTC. Strip the timezone so 9am stays 9am locally.
                try:
                    dt = datetime.fromisoformat(start["dateTime"])
                    due_at = dt.replace(tzinfo=None)
                except Exception:
                    due_at = None
            elif "date" in start:
                # All-day event; treat as date-only (midnight local)
                try:
                    due_at = datetime.fromisoformat(start["date"])
                except Exception:
                    due_at = None

            source_id = f"gcal_{event_id}"
            existing = db.execute(
                select(Task).where(
                    Task.user_id == user.id,
                    Task.source_id == source_id
                )
            ).scalar_one_or_none()

            if existing:
                existing.title = title
                existing.description = description
                existing.due_at = due_at
                existing.link_url = html_link
            else:
                task = Task(
                    user_id=user.id,
                    source=TaskSource.gcal,
                    source_id=source_id,
                    title=title,
                    description=description,
                    due_at=due_at,
                    link_url=html_link,
                    status=TaskStatus.pending,
                )
                db.add(task)
                count += 1

    db.commit()
    logger.info(f"Synced {count} new calendar events for user {user.email}")
    return count


def sync_gmail(user: User, db: Session) -> int:
    creds = get_google_credentials(user, db)
    if not creds:
        return 0

    service = build("gmail", "v1", credentials=creds)
    count = 0

    # Build query for starred emails and action keywords
    keyword_query = " OR ".join([f'"{kw}"' for kw in ACTION_KEYWORDS[:10]])
    queries = [
        "is:starred",
        keyword_query,
        "has:attachment deadline",
        "subject:deadline OR subject:due OR subject:action OR subject:urgent",
    ]

    seen_ids = set()

    for query in queries:
        try:
            results = service.users().messages().list(
                userId="me",
                q=query,
                maxResults=50,
            ).execute()
            messages = results.get("messages", [])
        except Exception as e:
            logger.warning(f"Gmail query failed: {e}")
            continue

        for msg in messages:
            msg_id = msg["id"]
            if msg_id in seen_ids:
                continue
            seen_ids.add(msg_id)

            source_id = f"gmail_{msg_id}"
            existing = db.execute(
                select(Task).where(
                    Task.user_id == user.id,
                    Task.source_id == source_id
                )
            ).scalar_one_or_none()

            if existing:
                continue

            try:
                msg_data = service.users().messages().get(
                    userId="me",
                    id=msg_id,
                    format="metadata",
                    metadataHeaders=["Subject", "From", "Date"],
                ).execute()
            except Exception as e:
                logger.warning(f"Could not fetch message {msg_id}: {e}")
                continue

            headers = {h["name"]: h["value"] for h in msg_data.get("payload", {}).get("headers", [])}
            subject = headers.get("Subject", "No Subject")
            sender = headers.get("From", "")

            title = f"{subject} (from {sender})" if sender else subject
            link_url = f"https://mail.google.com/mail/u/0/#inbox/{msg_id}"

            task = Task(
                user_id=user.id,
                source=TaskSource.gmail,
                source_id=source_id,
                title=title,
                due_at=None,
                link_url=link_url,
                status=TaskStatus.pending,
            )
            db.add(task)
            count += 1

    db.commit()
    logger.info(f"Synced {count} new Gmail tasks for user {user.email}")
    return count