from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///ashwasa.db"
    JWT_SECRET: str = "fallback-secret-do-not-use"
    APP_URL: str = "http://localhost:4000"
    PORT: int = 4001
    NODE_ENV: str = "development"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
