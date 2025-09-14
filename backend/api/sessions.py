from fastapi import APIRouter, HTTPException
from typing import List, Optional
from models import Session, SessionCreate, SessionUpdate, APIResponse, APIError
from database import database
from datetime import date, datetime

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

@router.post("")
async def create_session(session_data: SessionCreate):
    """Create or get today's active session"""
    try:
        session = await database.create_session()
        
        return APIResponse(
            success=True,
            data=session.dict(),
            message="Session created successfully"
        )
    except Exception as e:
        return APIError(
            error=str(e),
            code="SESSION_CREATE_ERROR"
        )

@router.get("/today")
async def get_today_session():
    """Get today's active session"""
    try:
        session = await database.get_today_session()
        
        if not session:
            # Create new session for today
            session = await database.create_session()
        
        return APIResponse(
            success=True,
            data=session.dict(),
            message="Today's session retrieved successfully"
        )
    except Exception as e:
        return APIError(
            error=str(e),
            code="TODAY_SESSION_FETCH_ERROR"
        )

@router.get("")
async def get_session_history(limit: int = 30):
    """Get user's session history"""
    try:
        sessions = await database.get_session_history(limit=limit)
        
        return APIResponse(
            success=True,
            data=[s.dict() for s in sessions],
            message="Session history retrieved successfully"
        )
    except Exception as e:
        return APIError(
            error=str(e),
            code="SESSION_HISTORY_FETCH_ERROR"
        )

@router.put("/{session_id}")
async def update_session(session_id: str, updates: SessionUpdate):
    """Update session data (add breaks, reminders, etc.)"""
    try:
        update_data = updates.dict(exclude_unset=True)
        
        # Add timestamp for end_time if provided
        if "is_active" in update_data and not update_data["is_active"]:
            update_data["end_time"] = datetime.utcnow()
        
        session = await database.update_session(session_id, update_data)
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return APIResponse(
            success=True,
            data=session.dict(),
            message="Session updated successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        return APIError(
            error=str(e),
            code="SESSION_UPDATE_ERROR"
        )

@router.post("/{session_id}/activity")
async def log_activity(session_id: str, activity_type: str):
    """Log specific activity (posture_reminder, eye_exercise, stretch, break)"""
    try:
        # Map activity types to session fields
        activity_fields = {
            "posture_reminder": "posture_reminders",
            "eye_exercise": "eye_exercises_completed", 
            "stretch": "stretches_completed",
            "break": "breaks_taken"
        }
        
        if activity_type not in activity_fields:
            raise HTTPException(status_code=400, detail="Invalid activity type")
        
        field = activity_fields[activity_type]
        
        # Get current session
        sessions = await database.sessions.find({"id": session_id}).to_list(1)
        if not sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        current_session = sessions[0]
        current_value = current_session.get(field, 0)
        
        # Increment the activity count
        update_data = {field: current_value + 1}
        
        session = await database.update_session(session_id, update_data)
        
        return APIResponse(
            success=True,
            data=session.dict(),
            message=f"{activity_type.replace('_', ' ').title()} logged successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        return APIError(
            error=str(e),
            code="ACTIVITY_LOG_ERROR"
        )