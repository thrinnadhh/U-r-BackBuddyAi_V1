from fastapi import APIRouter, HTTPException
from models import UserSettings, UserSettingsUpdate, APIResponse, APIError
from database import database
from datetime import datetime

router = APIRouter(prefix="/api/user", tags=["users"])

@router.get("/settings")
async def get_user_settings():
    """Get current user settings"""
    try:
        settings = await database.get_user_settings()
        return APIResponse(
            success=True,
            data=settings.dict(),
            message="Settings retrieved successfully"
        )
    except Exception as e:
        return APIError(
            error=str(e),
            code="SETTINGS_FETCH_ERROR"
        )

@router.put("/settings")
async def update_user_settings(settings_update: UserSettingsUpdate):
    """Update user settings"""
    try:
        # Get current settings
        current_settings = await database.get_user_settings()
        
        # Update only provided fields
        update_data = settings_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(current_settings, key, value)
        
        # Save updated settings
        updated_settings = await database.update_user_settings(current_settings)
        
        return APIResponse(
            success=True,
            data=updated_settings.dict(),
            message="Settings updated successfully"
        )
    except Exception as e:
        return APIError(
            error=str(e),
            code="SETTINGS_UPDATE_ERROR"
        )

@router.get("/profile")
async def get_user_profile():
    """Get basic user profile information"""
    try:
        settings = await database.get_user_settings()
        
        profile_data = {
            "user_id": "demo-user",
            "email": "demo@healthguard.app",
            "settings": settings.dict(),
            "last_active": datetime.utcnow()
        }
        
        return APIResponse(
            success=True,
            data=profile_data,
            message="Profile retrieved successfully"
        )
    except Exception as e:
        return APIError(
            error=str(e),
            code="PROFILE_FETCH_ERROR"
        )