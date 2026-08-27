from fastapi import APIRouter, HTTPException, Depends
from backend.models import SettingsResponse, SettingsUpdate, StatusResponse
from backend.config import get_settings
import yaml
import os

router = APIRouter()
settings = get_settings()


@router.get("/settings", response_model=SettingsResponse)
async def get_current_settings():
    """Get application configuration and masked API keys."""
    try:
        with open(settings.abs_config_yaml, "r", encoding="utf-8") as f:
            config = yaml.safe_load(f) or {}
    except Exception:
        config = {}

    prompt_templates = config.pop("prompt", {})
    
    # Read OPENAI_API_KEY from .env if present
    env_key = ""
    env_file = settings.Config.env_file
    if os.path.exists(env_file):
        with open(env_file, "r") as f:
            for line in f:
                if line.startswith("OPENAI_API_KEY="):
                    env_key = line.split("=", 1)[1].strip().strip('"\'')
                    break
    
    # Mask key
    masked_key = ""
    if env_key:
        masked_key = f"sk-...{env_key[-4:]}" if len(env_key) > 4 else "sk-...****"
        
    return SettingsResponse(
        config=config,
        prompt_templates=prompt_templates,
        api_keys={"openai": masked_key} if masked_key else {}
    )


@router.put("/settings", response_model=StatusResponse)
async def update_settings(update: SettingsUpdate):
    """Update application configuration and/or API keys."""
    
    # 1. Update config.yaml
    try:
        with open(settings.abs_config_yaml, "r", encoding="utf-8") as f:
            existing_config = yaml.safe_load(f) or {}
    except Exception:
        existing_config = {}
        
    if update.config is not None:
        for k, v in update.config.items():
            existing_config[k] = v
            
    if update.prompt_templates is not None:
        existing_config["prompt"] = update.prompt_templates
        
    try:
        with open(settings.abs_config_yaml, "w", encoding="utf-8") as f:
            yaml.safe_dump(existing_config, f, sort_keys=False)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to write config.yaml: {e}")

    # 2. Update .env with new keys
    if update.api_keys:
        openai_key = update.api_keys.get("openai")
        if openai_key and not openai_key.startswith("sk-..."):
            env_file = settings.Config.env_file
            
            lines = []
            if os.path.exists(env_file):
                with open(env_file, "r") as f:
                    lines = f.readlines()
                    
            updated = False
            for i, line in enumerate(lines):
                if line.startswith("OPENAI_API_KEY="):
                    lines[i] = f"OPENAI_API_KEY={openai_key}\n"
                    updated = True
                    break
            if not updated:
                lines.append(f"OPENAI_API_KEY={openai_key}\n")
                
            with open(env_file, "w") as f:
                f.writelines(lines)
                
            # Update the current process environment so running process sees it immediately
            os.environ["OPENAI_API_KEY"] = openai_key
            settings.openai_api_key = openai_key

    return StatusResponse(status="success", message="Settings updated successfully")
