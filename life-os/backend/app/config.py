from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    database_url: str = "sqlite:///./lifeos.db"
    log_level: str = "info"
    cors_origins: str = "http://localhost:5173"
    secret_key: str = "change-me"
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://127.0.0.1:8000/auth/google/callback"
    gradescope_email: str = ""
    gradescope_password: str = ""
    spotify_client_id: str = ""
    spotify_client_secret: str = ""
    spotify_redirect_uri: str = "http://127.0.0.1:8000/auth/spotify/callback"

    @property
    def cors_origins_list(self) -> List[str]:
        return [i.strip() for i in self.cors_origins.split(",")]

    @property
    def database_url_fixed(self) -> str:
        url = self.database_url
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    class Config:
        env_file = ".env"


settings = Settings()