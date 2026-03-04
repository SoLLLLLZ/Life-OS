import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import select
from authlib.integrations.starlette_client import OAuth
from starlette.requests import Request
from starlette.config import Config

from app.config import settings
from app.database import get_db
from app.models import User, IntegrationToken
from app.auth import create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)

config = Config(environ={
    "GOOGLE_CLIENT_ID": settings.google_client_id,
    "GOOGLE_CLIENT_SECRET": settings.google_client_secret,
})

oauth = OAuth(config)
oauth.register(
    name="google",
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={
        "scope": "openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/gmail.readonly",
    },
)


@router.get("/google/login")
async def google_login(request: Request):
    return await oauth.google.authorize_redirect(
        request,
        settings.google_redirect_uri,
        prompt="select_account"
    )


@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        logger.error(f"OAuth error: {e}")
        raise HTTPException(status_code=400, detail="OAuth failed")

    userinfo = token.get("userinfo")
    if not userinfo:
        raise HTTPException(status_code=400, detail="No user info returned")

    email = userinfo["email"]
    google_id = userinfo["sub"]
    name = userinfo.get("name")

    # Find or create user
    user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if not user:
        user = User(email=email, name=name, google_account_id=google_id)
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Created new user: {email}")
    else:
        user.google_account_id = google_id
        db.commit()

    # Save or update integration token
    existing_token = db.execute(
        select(IntegrationToken).where(
            IntegrationToken.user_id == user.id,
            IntegrationToken.provider == "google"
        )
    ).scalar_one_or_none()

    access_token = token.get("access_token", "")
    refresh_token = token.get("refresh_token")

    if existing_token:
        existing_token.access_token = access_token
        if refresh_token:
            existing_token.refresh_token = refresh_token
        db.commit()
    else:
        new_token = IntegrationToken(
            user_id=user.id,
            provider="google",
            access_token=access_token,
            refresh_token=refresh_token,
            scopes="calendar.readonly gmail.readonly",
        )
        db.add(new_token)
        db.commit()

    # Create JWT and redirect to frontend
    jwt_token = create_access_token({"sub": str(user.id)})
    return RedirectResponse(url=f"https://SoLLLLLZ.github.io/Life-OS?token={jwt_token}")


@router.get("/me")
def get_me(user: User = Depends(get_current_user)):
    return {"id": user.id, "email": user.email, "name": user.name}


@router.post("/logout")
def logout():
    response = RedirectResponse(url="https://SoLLLLLZ.github.io/Life-OS")
    response.delete_cookie("access_token")
    return response