import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime, timedelta
import httpx
import urllib.parse

from app.config import settings
from app.database import get_db
from app.models import User, IntegrationToken
from app.services.spotify_service import (
    get_current_playback, play, pause, next_track, previous_track, set_volume
)

router = APIRouter(prefix="/auth/spotify", tags=["spotify"])
logger = logging.getLogger(__name__)

SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_SCOPES = "user-read-playback-state user-modify-playback-state user-read-currently-playing"


@router.get("/login")
def spotify_login(token: str = Query(default="")):
    params = {
        "client_id": settings.spotify_client_id,
        "response_type": "code",
        "redirect_uri": "https://life-os-j3cz.onrender.com/auth/spotify/callback",
        "scope": SPOTIFY_SCOPES,
        "state": token,
    }
    url = f"{SPOTIFY_AUTH_URL}?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url)


@router.get("/callback")
async def spotify_callback(
    code: str = Query(...),
    state: str = Query(default=""),
    db: Session = Depends(get_db),
):
    from jose import jwt, JWTError

    try:
        payload = jwt.decode(state, settings.secret_key, algorithms=["HS256"])
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token in state")

    user = db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    import base64
    credentials = base64.b64encode(
        f"{settings.spotify_client_id}:{settings.spotify_client_secret}".encode()
    ).decode()

    async with httpx.AsyncClient() as client:
        response = await client.post(
            SPOTIFY_TOKEN_URL,
            headers={
                "Authorization": f"Basic {credentials}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": "https://life-os-j3cz.onrender.com/auth/spotify/callback",
            },
        )

    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Spotify token exchange failed")

    token_data = response.json()

    existing = db.execute(
        select(IntegrationToken).where(
            IntegrationToken.user_id == user.id,
            IntegrationToken.provider == "spotify"
        )
    ).scalar_one_or_none()

    expires_at = datetime.utcnow() + timedelta(seconds=token_data.get("expires_in", 3600))

    if existing:
        existing.access_token = token_data["access_token"]
        if token_data.get("refresh_token"):
            existing.refresh_token = token_data["refresh_token"]
        existing.expires_at = expires_at
        existing.scopes = token_data.get("scope", "")
    else:
        new_token = IntegrationToken(
            user_id=user.id,
            provider="spotify",
            access_token=token_data["access_token"],
            refresh_token=token_data.get("refresh_token"),
            expires_at=expires_at,
            scopes=token_data.get("scope", ""),
        )
        db.add(new_token)

    db.commit()
    return RedirectResponse(url="https://solllllz.github.io/Life-OS")


@router.get("/current")
def current_playback(
    db: Session = Depends(get_db),
    user: User = Depends(__import__('app.auth', fromlist=['get_current_user']).get_current_user),
):
    playback = get_current_playback(user, db)
    if playback is None:
        raise HTTPException(status_code=404, detail="No active playback or not connected")
    return playback


@router.post("/play")
def play_track(
    db: Session = Depends(get_db),
    user: User = Depends(__import__('app.auth', fromlist=['get_current_user']).get_current_user),
):
    if not play(user, db):
        raise HTTPException(status_code=400, detail="Could not play")
    return {"status": "playing"}


@router.post("/pause")
def pause_track(
    db: Session = Depends(get_db),
    user: User = Depends(__import__('app.auth', fromlist=['get_current_user']).get_current_user),
):
    if not pause(user, db):
        raise HTTPException(status_code=400, detail="Could not pause")
    return {"status": "paused"}


@router.post("/next")
def next_track_route(
    db: Session = Depends(get_db),
    user: User = Depends(__import__('app.auth', fromlist=['get_current_user']).get_current_user),
):
    if not next_track(user, db):
        raise HTTPException(status_code=400, detail="Could not skip")
    return {"status": "skipped"}


@router.post("/previous")
def previous_track_route(
    db: Session = Depends(get_db),
    user: User = Depends(__import__('app.auth', fromlist=['get_current_user']).get_current_user),
):
    if not previous_track(user, db):
        raise HTTPException(status_code=400, detail="Could not go back")
    return {"status": "previous"}


@router.post("/volume")
def set_volume_route(
    volume: int = Query(..., ge=0, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(__import__('app.auth', fromlist=['get_current_user']).get_current_user),
):
    if not set_volume(user, db, volume):
        raise HTTPException(status_code=400, detail="Could not set volume")
    return {"status": "ok", "volume": volume}