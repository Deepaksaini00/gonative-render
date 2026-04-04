from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    SECRET_KEY: str = "changeme-in-production"
    DATABASE_URL: str = "sqlite+aiosqlite:///./langlearn.db"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,https://gonative-render.vercel.app,https://gonative-render-git-master-deeps-projects-bff95a11.vercel.app"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ALGORITHM: str = "HS256"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"


settings = Settings()
