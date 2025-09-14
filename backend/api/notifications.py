from fastapi import APIRouter, HTTPException
from typing import List
from models import Notification, NotificationCreate, APIResponse, APIError
from database import database

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

@router.get("")
async def get_notifications(limit: int = 50):
    """Get user's notification history"""
    try:
        notifications = await database.get_notifications(limit=limit)
        
        return APIResponse(
            success=True,
            data=[n.dict() for n in notifications],
            message="Notifications retrieved successfully"
        )
    except Exception as e:
        return APIError(
            error=str(e),
            code="NOTIFICATIONS_FETCH_ERROR"
        )

@router.post("")
async def create_notification(notification_data: NotificationCreate):
    """Log a new notification for analytics"""
    try:
        notification = Notification(**notification_data.dict())
        created_notification = await database.create_notification(notification)
        
        return APIResponse(
            success=True,
            data=created_notification.dict(),
            message="Notification logged successfully"
        )
    except Exception as e:
        return APIError(
            error=str(e),
            code="NOTIFICATION_CREATE_ERROR"
        )

@router.put("/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark notification as read"""
    try:
        success = await database.mark_notification_read(notification_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return APIResponse(
            success=True,
            data={"notification_id": notification_id, "is_read": True},
            message="Notification marked as read"
        )
    except HTTPException:
        raise
    except Exception as e:
        return APIError(
            error=str(e),
            code="NOTIFICATION_UPDATE_ERROR"
        )

@router.delete("/clear")
async def clear_old_notifications(days: int = 7):
    """Clear notifications older than specified days"""
    try:
        await database.clear_old_notifications(days=days)
        
        return APIResponse(
            success=True,
            data={"cleared_days": days},
            message=f"Notifications older than {days} days cleared"
        )
    except Exception as e:
        return APIError(
            error=str(e),
            code="NOTIFICATIONS_CLEAR_ERROR"
        )