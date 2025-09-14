from fastapi import APIRouter
from models import DashboardStats, APIResponse, APIError
from database import database
from datetime import datetime, date, timedelta
from typing import List, Dict

router = APIRouter(prefix="/api/stats", tags=["statistics"])

@router.get("/dashboard")
async def get_dashboard_stats():
    """Get dashboard statistics for today"""
    try:
        stats = await database.get_dashboard_stats()
        
        return APIResponse(
            success=True,
            data=stats.dict(),
            message="Dashboard stats retrieved successfully"
        )
    except Exception as e:
        return APIError(
            error=str(e),
            code="DASHBOARD_STATS_ERROR"
        )

@router.get("/weekly")
async def get_weekly_stats():
    """Get weekly summary statistics"""
    try:
        end_date = date.today()
        start_date = end_date - timedelta(days=7)
        
        # Get sessions for the past week
        sessions = await database.sessions.find({
            "user_id": "demo-user",
            "date": {
                "$gte": start_date.isoformat(),
                "$lte": end_date.isoformat()
            }
        }).to_list(100)
        
        # Calculate weekly totals
        weekly_stats = {
            "total_work_time": sum(s.get("work_time", 0) for s in sessions),
            "total_breaks": sum(s.get("breaks_taken", 0) for s in sessions),
            "total_posture_reminders": sum(s.get("posture_reminders", 0) for s in sessions),
            "total_eye_exercises": sum(s.get("eye_exercises_completed", 0) for s in sessions),
            "total_stretches": sum(s.get("stretches_completed", 0) for s in sessions),
            "active_days": len([s for s in sessions if s.get("work_time", 0) > 0]),
            "average_daily_work_time": 0,
            "week_start": start_date.isoformat(),
            "week_end": end_date.isoformat()
        }
        
        if weekly_stats["active_days"] > 0:
            weekly_stats["average_daily_work_time"] = weekly_stats["total_work_time"] // weekly_stats["active_days"]
        
        return APIResponse(
            success=True,
            data=weekly_stats,
            message="Weekly stats retrieved successfully"
        )
    except Exception as e:
        return APIError(
            error=str(e),
            code="WEEKLY_STATS_ERROR"
        )

@router.get("/monthly")
async def get_monthly_stats():
    """Get monthly summary statistics"""
    try:
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        
        # Get sessions for the past month
        sessions = await database.sessions.find({
            "user_id": "demo-user",
            "date": {
                "$gte": start_date.isoformat(),
                "$lte": end_date.isoformat()
            }
        }).to_list(100)
        
        # Calculate monthly totals
        monthly_stats = {
            "total_work_time": sum(s.get("work_time", 0) for s in sessions),
            "total_breaks": sum(s.get("breaks_taken", 0) for s in sessions),
            "total_posture_reminders": sum(s.get("posture_reminders", 0) for s in sessions),
            "total_eye_exercises": sum(s.get("eye_exercises_completed", 0) for s in sessions),
            "total_stretches": sum(s.get("stretches_completed", 0) for s in sessions),
            "active_days": len([s for s in sessions if s.get("work_time", 0) > 0]),
            "average_daily_work_time": 0,
            "best_day_work_time": max([s.get("work_time", 0) for s in sessions]) if sessions else 0,
            "month_start": start_date.isoformat(),
            "month_end": end_date.isoformat()
        }
        
        if monthly_stats["active_days"] > 0:
            monthly_stats["average_daily_work_time"] = monthly_stats["total_work_time"] // monthly_stats["active_days"]
        
        return APIResponse(
            success=True,
            data=monthly_stats,
            message="Monthly stats retrieved successfully"
        )
    except Exception as e:
        return APIError(
            error=str(e),
            code="MONTHLY_STATS_ERROR"
        )

@router.get("/trends")
async def get_trends():
    """Get productivity trends over time"""
    try:
        end_date = date.today()
        start_date = end_date - timedelta(days=14)  # Past 2 weeks
        
        # Get daily sessions for trend analysis
        sessions = await database.sessions.find({
            "user_id": "demo-user",
            "date": {
                "$gte": start_date.isoformat(),
                "$lte": end_date.isoformat()
            }
        }).sort("date", 1).to_list(100)
        
        # Create daily trend data
        daily_trends = []
        current_date = start_date
        
        while current_date <= end_date:
            date_str = current_date.isoformat()
            day_session = next((s for s in sessions if s.get("date") == date_str), None)
            
            daily_trends.append({
                "date": date_str,
                "work_time": day_session.get("work_time", 0) if day_session else 0,
                "breaks": day_session.get("breaks_taken", 0) if day_session else 0,
                "posture_reminders": day_session.get("posture_reminders", 0) if day_session else 0,
                "health_score": calculate_health_score(day_session) if day_session else 0
            })
            
            current_date += timedelta(days=1)
        
        return APIResponse(
            success=True,
            data={
                "daily_trends": daily_trends,
                "period_start": start_date.isoformat(),
                "period_end": end_date.isoformat()
            },
            message="Trends retrieved successfully"
        )
    except Exception as e:
        return APIError(
            error=str(e),
            code="TRENDS_ERROR"
        )

def calculate_health_score(session: dict) -> int:
    """Calculate a health score based on session activities"""
    if not session:
        return 0
    
    work_time = session.get("work_time", 0)
    breaks = session.get("breaks_taken", 0)
    posture_reminders = session.get("posture_reminders", 0)
    eye_exercises = session.get("eye_exercises_completed", 0)
    stretches = session.get("stretches_completed", 0)
    
    # Base score for work time (max 40 points)
    score = min(work_time // 5, 40)  # 1 point per 5 minutes, max 40
    
    # Bonus for breaks (max 20 points)
    score += min(breaks * 5, 20)
    
    # Bonus for exercises (max 40 points)
    score += min(eye_exercises * 10, 20)
    score += min(stretches * 10, 20)
    
    # Penalty for too many posture reminders (indicates poor posture)
    if posture_reminders > 10:
        score -= min((posture_reminders - 10) * 2, 20)
    
    return max(0, min(score, 100))  # Keep score between 0-100