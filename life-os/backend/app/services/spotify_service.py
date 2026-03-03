import logging
from sqlalchemy.orm import Session
from sqlalchemy import select
import spotipy
from spotipy.oauth2 import SpotifyOAuth

from app.config import settings
from app.models import User, IntegrationToken

logger = logging.getLogger(__name__)


def get_spotify_client(user: User, db: Session):
    token_row = db.execute(
        select(IntegrationToken).where(
            IntegrationToken.user_id == user.id,
            IntegrationToken.provider == "spotify"
        )
    ).scalar_one_or_none()

    if not token_row:
        return None

    token_info = {
        "access_token": token_row.access_token,
        "refresh_token": token_row.refresh_token,
        "expires_at": int(token_row.expires_at.timestamp()) if token_row.expires_at else 0,
        "token_type": "Bearer",
        "scope": token_row.scopes or "",
    }

    sp_oauth = SpotifyOAuth(
        client_id=settings.spotify_client_id,
        client_secret=settings.spotify_client_secret,
        redirect_uri=settings.spotify_redirect_uri,
        scope="user-read-playback-state user-modify-playback-state user-read-currently-playing",
    )

    if sp_oauth.is_token_expired(token_info):
        token_info = sp_oauth.refresh_access_token(token_info["refresh_token"])
        token_row.access_token = token_info["access_token"]
        if token_info.get("refresh_token"):
            token_row.refresh_token = token_info["refresh_token"]
        db.commit()

    return spotipy.Spotify(auth=token_info["access_token"])


def get_current_playback(user: User, db: Session):
    sp = get_spotify_client(user, db)
    if not sp:
        return None

    try:
        playback = sp.current_playback()
        if not playback or not playback.get("item"):
            return {"is_playing": False, "track": None}

        track = playback["item"]
        return {
            "is_playing": playback["is_playing"],
            "track": {
                "id": track["id"],
                "name": track["name"],
                "artist": ", ".join(a["name"] for a in track["artists"]),
                "album": track["album"]["name"],
                "album_art": track["album"]["images"][0]["url"] if track["album"]["images"] else None,
                "duration_ms": track["duration_ms"],
                "progress_ms": playback["progress_ms"],
            },
            "device": playback.get("device", {}).get("name"),
            "volume": playback.get("device", {}).get("volume_percent"),
        }
    except Exception as e:
        logger.error(f"Could not get playback: {e}")
        return None


def play(user: User, db: Session):
    sp = get_spotify_client(user, db)
    if not sp:
        return False
    try:
        sp.start_playback()
        return True
    except Exception as e:
        logger.error(f"Could not play: {e}")
        return False


def pause(user: User, db: Session):
    sp = get_spotify_client(user, db)
    if not sp:
        return False
    try:
        sp.pause_playback()
        return True
    except Exception as e:
        logger.error(f"Could not pause: {e}")
        return False


def next_track(user: User, db: Session):
    sp = get_spotify_client(user, db)
    if not sp:
        return False
    try:
        sp.next_track()
        return True
    except Exception as e:
        logger.error(f"Could not skip: {e}")
        return False


def previous_track(user: User, db: Session):
    sp = get_spotify_client(user, db)
    if not sp:
        return False
    try:
        sp.previous_track()
        return True
    except Exception as e:
        logger.error(f"Could not go back: {e}")
        return False


def set_volume(user: User, db: Session, volume: int):
    sp = get_spotify_client(user, db)
    if not sp:
        return False
    try:
        sp.volume(max(0, min(100, volume)))
        return True
    except Exception as e:
        logger.error(f"Could not set volume: {e}")
        return False