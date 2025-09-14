from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path

# Import API routers
from api.users import router as users_router
from api.exercises import router as exercises_router
from api.sessions import router as sessions_router
from api.notifications import router as notifications_router
from api.stats import router as stats_router

# Import database for initialization
from database import database

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app without a prefix
app = FastAPI(title="HealthGuard API", description="Progressive Web App for Health and Productivity")

# Create a router with the /api prefix for legacy routes
api_router = APIRouter(prefix="/api")

# Legacy hello world route
@api_router.get("/")
async def root():
    return {"message": "HealthGuard API is running!", "status": "healthy"}

# Include the legacy router
app.include_router(api_router)

# Include all API routers
app.include_router(users_router)
app.include_router(exercises_router)
app.include_router(sessions_router)
app.include_router(notifications_router)
app.include_router(stats_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    """Initialize database with default data"""
    try:
        logger.info("Initializing HealthGuard API...")
        
        # Seed exercises if not exists
        await database.seed_exercises()
        logger.info("Exercise data seeded successfully")
        
        # Ensure default user exists
        await database.get_user_settings()
        logger.info("Default user settings initialized")
        
        logger.info("HealthGuard API initialized successfully!")
        
    except Exception as e:
        logger.error(f"Failed to initialize API: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    try:
        # Close database connection
        from database import client
        client.close()
        logger.info("Database connection closed")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "HealthGuard API",
        "version": "1.0.0"
    }