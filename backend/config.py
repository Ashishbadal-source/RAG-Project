"""
Application configuration using Pydantic Settings.
Reads from environment variables and .env file.
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache

# Project root is one level up from backend/
PROJECT_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Application settings loaded from environment / .env file."""

    # --- Paths (relative to PROJECT_ROOT) ---
    config_yaml_path: str = "config.yaml"
    inference_dir: str = "Inference_result"
    retrieval_dir: str = "Retrieval_result"
    evaluation_dir: str = "Evaluation_result"
    preset_prompt_dir: str = "Preset_prompt"
    database_path: str = "backend/mirage_meta.db"
    log_dir: str = "backend/logs"

    # --- Server ---
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # --- API Keys (write-only via Settings page, read from .env) ---
    openai_api_key: str = ""

    class Config:
        env_file = str(PROJECT_ROOT / ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"

    # --- Resolved absolute paths ---
    @property
    def abs_config_yaml(self) -> Path:
        return PROJECT_ROOT / self.config_yaml_path

    @property
    def abs_inference_dir(self) -> Path:
        return PROJECT_ROOT / self.inference_dir

    @property
    def abs_retrieval_dir(self) -> Path:
        return PROJECT_ROOT / self.retrieval_dir

    @property
    def abs_evaluation_dir(self) -> Path:
        return PROJECT_ROOT / self.evaluation_dir

    @property
    def abs_database_path(self) -> Path:
        return PROJECT_ROOT / self.database_path

    @property
    def abs_log_dir(self) -> Path:
        return PROJECT_ROOT / self.log_dir

    @property
    def abs_preset_prompt_dir(self) -> Path:
        return PROJECT_ROOT / self.preset_prompt_dir

    def ensure_dirs(self):
        """Create output directories if they don't exist."""
        for d in [
            self.abs_inference_dir,
            self.abs_retrieval_dir,
            self.abs_evaluation_dir,
            self.abs_log_dir,
        ]:
            d.mkdir(parents=True, exist_ok=True)


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton."""
    settings = Settings()
    settings.ensure_dirs()
    return settings
