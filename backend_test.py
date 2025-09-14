import os
import types
import asyncio
from datetime import datetime

import pytest
from fastapi.testclient import TestClient


class FakeDatabase:
    def __init__(self):
        self._settings = {
            "posture_reminder_interval": 3,
            "eye_exercise_interval": 20,
            "stretch_reminder_interval": 60,
            "work_session_length": 25,
            "notifications_enabled": True,
            "sound_enabled": True,
            "work_hours_start": "09:00",
            "work_hours_end": "17:00",
        }
        self._exercises = [
            {
                "id": "ex1",
                "category": "posture",
                "name": "Shoulder Roll",
                "description": "Roll shoulders",
                "duration": 30,
                "instructions": ["Sit", "Roll shoulders"],
                "is_active": True,
            },
            {
                "id": "ex2",
                "category": "eye",
                "name": "20-20-20",
                "description": "Look far",
                "duration": 20,
                "instructions": ["Look 20ft", "20 seconds"],
                "is_active": True,
            },
        ]
        self._notifications = []
        self._sessions = []

    # Startup helpers
    async def seed_exercises(self):
        return None

    async def get_user_settings(self, user_id: str = "demo-user"):
        # Return a pydantic-like object with dict()
        class _Settings:
            def __init__(self, data):
                self.__data = dict(data)

            def dict(self):
                return dict(self.__data)

            def __getattr__(self, key):
                return self.__data[key]

        return _Settings(self._settings)

    async def update_user_settings(self, settings, user_id: str = "demo-user"):
        self._settings.update(settings.dict() if hasattr(settings, "dict") else settings)
        # Return object with dict()
        class _Settings:
            def __init__(self, data):
                self.__data = dict(data)

            def dict(self):
                return dict(self.__data)

        return _Settings(self._settings)

    # Exercises
    async def get_all_exercises(self):
        # Return objects with dict()
        return [types.SimpleNamespace(**{"dict": (lambda self=e: lambda: e)[0]()}) for e in self._exercises]

    async def get_exercises_by_category(self, category: str):
        items = [e for e in self._exercises if e["category"] == category]
        return [types.SimpleNamespace(**{"dict": (lambda self=e: lambda: e)[0]()}) for e in items]

    # Sessions
    async def create_session(self, user_id: str = "demo-user"):
        session = {
            "id": "sess1",
            "user_id": user_id,
            "date": datetime.utcnow().date().isoformat(),
            "start_time": datetime.utcnow(),
            "work_time": 0,
            "breaks_taken": 0,
            "posture_reminders": 0,
            "eye_exercises_completed": 0,
            "stretches_completed": 0,
            "is_active": True,
            "created_at": datetime.utcnow(),
        }
        self._sessions = [session]
        return types.SimpleNamespace(**{"dict": lambda: dict(session)})

    async def get_today_session(self, user_id: str = "demo-user"):
        if self._sessions:
            return types.SimpleNamespace(**self._sessions[0])
        return None

    async def get_session_history(self, user_id: str = "demo-user", limit: int = 30):
        return [types.SimpleNamespace(**{"dict": lambda s=s: dict(s)}) for s in self._sessions]

    async def update_session(self, session_id: str, updates: dict):
        if not self._sessions:
            return None
        self._sessions[0].update(updates)
        return types.SimpleNamespace(**{"dict": lambda: dict(self._sessions[0])})

    # Notifications
    async def create_notification(self, notification):
        data = notification.dict() if hasattr(notification, "dict") else dict(notification)
        self._notifications.append(data)
        return types.SimpleNamespace(**{"dict": lambda: dict(data)})

    async def get_notifications(self, user_id: str = "demo-user", limit: int = 50):
        return [types.SimpleNamespace(**{"dict": lambda n=n: dict(n)}) for n in self._notifications][:limit]

    async def mark_notification_read(self, notification_id: str) -> bool:
        for n in self._notifications:
            if n.get("id") == notification_id:
                n["is_read"] = True
                return True
        return False

    async def clear_old_notifications(self, user_id: str = "demo-user", days: int = 7):
        self._notifications = []

    # Dashboard
    async def get_dashboard_stats(self, user_id: str = "demo-user"):
        # Return object with dict()
        stats = {
            "today_work_time": 0,
            "today_breaks": 0,
            "today_posture_reminders": 0,
            "today_eye_exercises": 0,
            "today_stretches": 0,
            "current_streak": 0,
            "active_session_id": None,
        }
        return types.SimpleNamespace(**{"dict": lambda: dict(stats)})


@pytest.fixture(scope="session")
def fake_env():
    # Provide required env so importing real modules doesn't KeyError
    os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
    os.environ.setdefault("DB_NAME", "testdb")
    return True


@pytest.fixture()
def app_client(fake_env):
    # Import after env is set
    from backend import server as server_module
    from backend.api import users as users_module
    from backend.api import exercises as exercises_module
    from backend.api import sessions as sessions_module
    from backend.api import notifications as notifications_module

    # Inject fake database into all modules that reference it
    fake_db = FakeDatabase()
    users_module.database = fake_db
    exercises_module.database = fake_db
    sessions_module.database = fake_db
    notifications_module.database = fake_db
    server_module.database = fake_db

    # Disable startup/shutdown hooks to avoid touching real DB
    server_module.app.router.on_startup.clear()
    server_module.app.router.on_shutdown.clear()

    client = TestClient(server_module.app)
    return client


def test_health_endpoint(app_client):
    resp = app_client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "healthy"


def test_legacy_root(app_client):
    resp = app_client.get("/api/")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "healthy"


def test_get_user_settings(app_client):
    resp = app_client.get("/api/user/settings")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert "posture_reminder_interval" in body["data"]


def test_update_user_settings(app_client):
    update = {"work_session_length": 50, "notifications_enabled": False}
    resp = app_client.put("/api/user/settings", json=update)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["work_session_length"] == 50
    assert data["notifications_enabled"] is False


def test_exercises_endpoints(app_client):
    # All exercises grouped
    resp = app_client.get("/api/exercises")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "posture" in data and "eye" in data and "stretch" in data

    # Category endpoint
    resp2 = app_client.get("/api/exercises/posture")
    assert resp2.status_code == 200
    items = resp2.json()["data"]
    assert isinstance(items, list)
    assert any(item["category"] == "posture" for item in items)


def test_sessions_endpoints(app_client):
    # Create session
    resp = app_client.post("/api/sessions")
    assert resp.status_code == 200
    created = resp.json()["data"]
    assert created["is_active"] is True

    # Get today
    resp2 = app_client.get("/api/sessions/today")
    assert resp2.status_code == 200
    today = resp2.json()["data"]
    assert today["is_active"] is True

    # History
    resp3 = app_client.get("/api/sessions")
    assert resp3.status_code == 200
    history = resp3.json()["data"]
    assert isinstance(history, list)


def test_notifications_endpoints(app_client):
    # Initially empty
    resp = app_client.get("/api/notifications")
    assert resp.status_code == 200
    assert resp.json()["data"] == []

    # Create
    payload = {"type": "posture", "title": "Test", "message": "Hello"}
    resp2 = app_client.post("/api/notifications", json=payload)
    assert resp2.status_code == 200
    created = resp2.json()["data"]
    assert created["type"] == "posture"

    # List now has one
    resp3 = app_client.get("/api/notifications")
    assert resp3.status_code == 200
    assert len(resp3.json()["data"]) == 1


