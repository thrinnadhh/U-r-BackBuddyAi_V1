from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, date
import os
from typing import List, Optional
from models import User, UserSettings, Exercise, Session, Notification, DashboardStats

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

class Database:
    def __init__(self):
        self.users = db.users
        self.exercises = db.exercises
        self.sessions = db.sessions
        self.notifications = db.notifications

    # User & Settings Operations
    async def get_user_settings(self, user_id: str = "demo-user") -> Optional[UserSettings]:
        user = await self.users.find_one({"id": user_id})
        if not user:
            # Create default user if doesn't exist
            default_user = User(id=user_id)
            await self.users.insert_one(default_user.dict())
            return default_user.settings
        return UserSettings(**user["settings"])

    async def update_user_settings(self, settings: UserSettings, user_id: str = "demo-user") -> UserSettings:
        # Update user settings
        await self.users.update_one(
            {"id": user_id},
            {
                "$set": {
                    "settings": settings.dict(),
                    "last_active": datetime.utcnow()
                }
            },
            upsert=True
        )
        return settings

    # Exercise Operations
    async def get_all_exercises(self) -> List[Exercise]:
        exercises = await self.exercises.find({"is_active": True}).to_list(100)
        return [Exercise(**ex) for ex in exercises]

    async def get_exercises_by_category(self, category: str) -> List[Exercise]:
        exercises = await self.exercises.find({"category": category, "is_active": True}).to_list(100)
        return [Exercise(**ex) for ex in exercises]

    async def seed_exercises(self):
        """Seed database with default exercises"""
        existing = await self.exercises.count_documents({})
        if existing > 0:
            return  # Already seeded

        default_exercises = [
            # Posture exercises
            Exercise(
                category="posture",
                name="Shoulder Roll",
                description="Roll your shoulders backwards 5 times, then forward 5 times",
                duration=30,
                instructions=[
                    "Sit up straight",
                    "Roll shoulders back slowly",
                    "Roll shoulders forward slowly", 
                    "Repeat 5 times each direction"
                ]
            ),
            Exercise(
                category="posture",
                name="Neck Stretch",
                description="Gently stretch your neck to relieve tension",
                duration=45,
                instructions=[
                    "Sit up straight",
                    "Slowly tilt head to right shoulder",
                    "Hold for 15 seconds",
                    "Repeat on left side",
                    "Gently roll head in circle"
                ]
            ),
            # Eye exercises
            Exercise(
                category="eye",
                name="20-20-20 Rule",
                description="Look at something 20 feet away for 20 seconds",
                duration=20,
                instructions=[
                    "Find an object 20 feet away",
                    "Focus on it for 20 seconds",
                    "Blink slowly several times",
                    "Return to work"
                ]
            ),
            Exercise(
                category="eye",
                name="Eye Circles",
                description="Move your eyes in circular motions",
                duration=30,
                instructions=[
                    "Close your eyes",
                    "Move eyes in clockwise circles 5 times",
                    "Move eyes counter-clockwise 5 times",
                    "Blink rapidly 10 times"
                ]
            ),
            # Stretch exercises
            Exercise(
                category="stretch",
                name="Desk Stretch",
                description="Simple stretches you can do at your desk",
                duration=60,
                instructions=[
                    "Stand up and reach arms overhead",
                    "Stretch side to side",
                    "Touch toes gently",
                    "Twist torso left and right",
                    "Take 3 deep breaths"
                ]
            ),
            Exercise(
                category="stretch",
                name="Back Extension",
                description="Counter the forward hunched position",
                duration=45,
                instructions=[
                    "Stand with hands on lower back",
                    "Gently arch backwards",
                    "Hold for 10 seconds",
                    "Return to neutral",
                    "Repeat 3 times"
                ]
            )
        ]

        for exercise in default_exercises:
            await self.exercises.insert_one(exercise.dict())

    # Session Operations
    async def create_session(self, user_id: str = "demo-user") -> Session:
        today = date.today().isoformat()
        
        # Check if session for today already exists
        existing = await self.sessions.find_one({"user_id": user_id, "date": today, "is_active": True})
        if existing:
            return Session(**existing)

        # Create new session
        session = Session(user_id=user_id, date=today)
        await self.sessions.insert_one(session.dict())
        return session

    async def get_today_session(self, user_id: str = "demo-user") -> Optional[Session]:
        today = date.today().isoformat()
        session = await self.sessions.find_one({"user_id": user_id, "date": today, "is_active": True})
        return Session(**session) if session else None

    async def update_session(self, session_id: str, updates: dict) -> Optional[Session]:
        await self.sessions.update_one(
            {"id": session_id},
            {"$set": updates}
        )
        session = await self.sessions.find_one({"id": session_id})
        return Session(**session) if session else None

    async def get_session_history(self, user_id: str = "demo-user", limit: int = 30) -> List[Session]:
        sessions = await self.sessions.find(
            {"user_id": user_id}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        return [Session(**s) for s in sessions]

    # Notification Operations
    async def create_notification(self, notification: Notification) -> Notification:
        await self.notifications.insert_one(notification.dict())
        return notification

    async def get_notifications(self, user_id: str = "demo-user", limit: int = 50) -> List[Notification]:
        notifications = await self.notifications.find(
            {"user_id": user_id}
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        return [Notification(**n) for n in notifications]

    async def mark_notification_read(self, notification_id: str) -> bool:
        result = await self.notifications.update_one(
            {"id": notification_id},
            {"$set": {"is_read": True}}
        )
        return result.modified_count > 0

    async def clear_old_notifications(self, user_id: str = "demo-user", days: int = 7):
        """Clear notifications older than specified days"""
        from datetime import timedelta
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        await self.notifications.delete_many({
            "user_id": user_id,
            "timestamp": {"$lt": cutoff_date}
        })

    # Dashboard Stats
    async def get_dashboard_stats(self, user_id: str = "demo-user") -> DashboardStats:
        today = date.today().isoformat()
        
        # Get today's session
        today_session = await self.get_today_session(user_id)
        
        # Calculate streak (simplified - count consecutive days with sessions)
        recent_sessions = await self.sessions.find(
            {"user_id": user_id, "work_time": {"$gt": 0}}
        ).sort("date", -1).limit(30).to_list(30)
        
        streak = 0
        if recent_sessions:
            current_date = date.today()
            for session in recent_sessions:
                session_date = datetime.fromisoformat(session["date"]).date()
                if session_date == current_date or (current_date - session_date).days == streak:
                    streak += 1
                    current_date = session_date
                else:
                    break

        return DashboardStats(
            today_work_time=today_session.work_time if today_session else 0,
            today_breaks=today_session.breaks_taken if today_session else 0,
            today_posture_reminders=today_session.posture_reminders if today_session else 0,
            today_eye_exercises=today_session.eye_exercises_completed if today_session else 0,
            today_stretches=today_session.stretches_completed if today_session else 0,
            current_streak=streak,
            active_session_id=today_session.id if today_session else None
        )

# Global database instance
database = Database()