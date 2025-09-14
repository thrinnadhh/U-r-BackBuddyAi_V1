from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

class UserSettings(BaseModel):
    posture_reminder_interval: int = 3  # minutes
    eye_exercise_interval: int = 20     # minutes
    stretch_reminder_interval: int = 60  # minutes
    work_session_length: int = 25       # minutes
    notifications_enabled: bool = True
    sound_enabled: bool = True
    work_hours_start: str = "09:00"
    work_hours_end: str = "17:00"

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str = "demo@healthguard.app"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_active: datetime = Field(default_factory=datetime.utcnow)
    settings: UserSettings = Field(default_factory=UserSettings)

class UserSettingsUpdate(BaseModel):
    posture_reminder_interval: Optional[int] = None
    eye_exercise_interval: Optional[int] = None
    stretch_reminder_interval: Optional[int] = None  
    work_session_length: Optional[int] = None
    notifications_enabled: Optional[bool] = None
    sound_enabled: Optional[bool] = None
    work_hours_start: Optional[str] = None
    work_hours_end: Optional[str] = None

class Exercise(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str  # posture, eye, stretch
    name: str
    description: str
    duration: int  # seconds
    instructions: List[str]
    is_active: bool = True

class Session(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = "demo-user"
    date: str  # YYYY-MM-DD format
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    work_time: int = 0  # minutes
    breaks_taken: int = 0
    posture_reminders: int = 0
    eye_exercises_completed: int = 0
    stretches_completed: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SessionCreate(BaseModel):
    date: str

class SessionUpdate(BaseModel):
    work_time: Optional[int] = None
    breaks_taken: Optional[int] = None
    posture_reminders: Optional[int] = None
    eye_exercises_completed: Optional[int] = None
    stretches_completed: Optional[int] = None
    end_time: Optional[datetime] = None
    is_active: Optional[bool] = None

class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = "demo-user"
    type: str  # posture, eye, stretch, workSession
    title: str
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    is_read: bool = False

class NotificationCreate(BaseModel):
    type: str
    title: str
    message: str

class DashboardStats(BaseModel):
    today_work_time: int = 0
    today_breaks: int = 0
    today_posture_reminders: int = 0
    today_eye_exercises: int = 0
    today_stretches: int = 0
    current_streak: int = 0
    active_session_id: Optional[str] = None

class APIResponse(BaseModel):
    success: bool = True
    data: Optional[dict] = None
    message: str = "Success"
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class APIError(BaseModel):
    success: bool = False
    error: str
    code: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)