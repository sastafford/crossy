"""
Configuration management for Crossy application.
"""
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from crossy/.env file
crossy_env_path = Path(__file__).parent.parent / ".env"
load_dotenv(crossy_env_path)


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # MongoDB Configuration
    mongodb_uri: str = "mongodb://localhost:27017"
    database_name: str = "crossy"
    
    # Application Configuration
    app_name: str = "crossy"
    app_version: str = "1.0.0"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins_str: str = "http://localhost:8000,http://127.0.0.1:8000"
    
    # Environment
    environment: str = "development"
    log_level: str = "INFO"
    
    @property
    def cors_origins(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins_str.split(",")]
    
    class Config:
        env_file = str(crossy_env_path)
        case_sensitive = False
        extra = "ignore"  # Ignore extra environment variables that aren't defined in the Settings class


# Global settings instance
settings = Settings()

