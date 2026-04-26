from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGO_URI: str = "mongodb://localhost:27017"
    DB_NAME: str = "trademind"
    SECRET_KEY: str = "supersecretkey"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    MODEL_PATH: str = "../data/models"
    DATA_PATH: str = "../data/processed"

    class Config:
        env_file = ".env"

settings = Settings()
