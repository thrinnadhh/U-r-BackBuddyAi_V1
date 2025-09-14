# HealthGuard - API Contracts & Integration Protocol

## Overview
This document defines the API contracts and integration protocol for replacing mock data with real backend functionality in the HealthGuard Progressive Web App.

## Current Mock Data to Replace

### 1. User Settings (`mockUserSettings`)
**Mock Location:** `mockData.js`
**Current Structure:**
```javascript
{
  id: "user-1",
  postureReminderInterval: 3, // minutes
  eyeExerciseInterval: 20, // minutes  
  stretchReminderInterval: 60, // minutes
  workSessionLength: 25, // minutes
  notificationsEnabled: true,
  soundEnabled: true,
  workHours: { start: "09:00", end: "17:00" }
}
```

### 2. Exercise Data (`mockExercises`)
**Mock Location:** `mockData.js`
**Categories:** posture, eye, stretch
**Structure:** Each exercise has id, name, description, duration, instructions[]

### 3. Session Data (`mockSessionData`)
**Mock Location:** `mockData.js`
**Structure:** id, date, workTime, breaks, postureReminders, eyeExercises, stretches

### 4. Notifications (`mockNotifications`)
**Mock Location:** `mockData.js`
**Structure:** id, type, title, message, timestamp

## API Endpoints to Implement

### Authentication & User Management
- `GET /api/user/profile` - Get current user profile
- `PUT /api/user/settings` - Update user settings
- `GET /api/user/settings` - Get user settings

### Exercise Management
- `GET /api/exercises` - Get all exercise categories and exercises
- `GET /api/exercises/:category` - Get exercises by category (posture/eye/stretch)

### Session Tracking
- `POST /api/sessions` - Create new session
- `GET /api/sessions` - Get user's session history
- `PUT /api/sessions/:id` - Update session (add breaks, reminders, etc.)
- `GET /api/sessions/today` - Get today's session stats

### Notifications
- `GET /api/notifications` - Get user's notification history
- `POST /api/notifications` - Log notification (for analytics)
- `DELETE /api/notifications/:id` - Clear specific notification

### Analytics & Stats
- `GET /api/stats/dashboard` - Get dashboard statistics
- `GET /api/stats/weekly` - Get weekly summary
- `GET /api/stats/monthly` - Get monthly summary

## Database Models

### User Model
```python
class User(BaseModel):
    id: str
    email: str
    created_at: datetime
    last_active: datetime
    settings: UserSettings

class UserSettings(BaseModel):
    posture_reminder_interval: int = 3  # minutes
    eye_exercise_interval: int = 20     # minutes
    stretch_reminder_interval: int = 60  # minutes
    work_session_length: int = 25       # minutes
    notifications_enabled: bool = True
    sound_enabled: bool = True
    work_hours_start: str = "09:00"
    work_hours_end: str = "17:00"
```

### Exercise Model
```python
class Exercise(BaseModel):
    id: str
    category: str  # posture, eye, stretch
    name: str
    description: str
    duration: int  # seconds
    instructions: List[str]
    is_active: bool = True
```

### Session Model
```python
class Session(BaseModel):
    id: str
    user_id: str
    date: str  # YYYY-MM-DD
    start_time: datetime
    end_time: Optional[datetime]
    work_time: int = 0  # minutes
    breaks_taken: int = 0
    posture_reminders: int = 0
    eye_exercises_completed: int = 0
    stretches_completed: int = 0
    is_active: bool = True
```

### Notification Model
```python
class Notification(BaseModel):
    id: str
    user_id: str
    type: str  # posture, eye, stretch, workSession
    title: str
    message: str
    timestamp: datetime
    is_read: bool = False
```

## Frontend Integration Points

### Context Updates Required

#### TimerContext (`/src/contexts/TimerContext.js`)
**Replace:**
- `useState(mockUserSettings)` → API call to `/api/user/settings`
- `updateSettings()` → API call to `PUT /api/user/settings`
- Timer completion handlers → API calls to update session data

#### NotificationContext (`/src/contexts/NotificationContext.js`)
**Replace:**
- `useState(mockNotifications)` → API call to `/api/notifications`
- `sendNotification()` → Also log to API via `POST /api/notifications`

### Component Updates Required

#### Dashboard (`/src/components/Dashboard.js`)
**Replace:**
- Stats data → API call to `/api/stats/dashboard`
- Recent notifications → API call to `/api/notifications`

#### Settings (`/src/components/Settings.js`)
**Replace:**
- Settings loading → API call to `/api/user/settings`
- Settings saving → API call to `PUT /api/user/settings`

#### Exercises (`/src/components/Exercises.js`)
**Replace:**
- `mockExercises` → API call to `/api/exercises`
- Exercise completion → API call to update session stats

## Backend Implementation Priority

### Phase 1: Core API Setup
1. Setup MongoDB models
2. Implement user settings CRUD
3. Implement exercise endpoints (static data initially)
4. Basic session tracking

### Phase 2: Advanced Features
1. Notification logging and retrieval
2. Statistics aggregation
3. Session analytics
4. Data validation and error handling

### Phase 3: Optimization
1. Caching for exercise data
2. Background task for session cleanup
3. Performance optimization

## Environment Variables Needed
- `MONGO_URL` - Already configured
- `JWT_SECRET` - For user sessions (if implementing auth)
- `DB_NAME` - Database name

## API Response Format
All APIs will follow consistent format:
```json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "timestamp": "2025-01-20T10:30:00Z"
}
```

Error format:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-01-20T10:30:00Z"
}
```

## Integration Steps
1. Implement backend models and endpoints
2. Replace mock data calls in contexts with API calls
3. Update error handling for network requests
4. Add loading states for API calls
5. Test all functionality end-to-end
6. Add proper error boundaries and fallbacks

## Testing Checkpoints
- [ ] Settings can be saved and retrieved
- [ ] Timers work with real session tracking
- [ ] Exercise data loads from API
- [ ] Notifications are logged and retrieved
- [ ] Dashboard stats reflect real data
- [ ] All CRUD operations work correctly