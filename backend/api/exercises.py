from fastapi import APIRouter, HTTPException
from typing import List
from models import Exercise, APIResponse, APIError
from database import database

router = APIRouter(prefix="/api/exercises", tags=["exercises"])

@router.get("")
async def get_all_exercises():
    """Get all exercises grouped by category"""
    try:
        exercises = await database.get_all_exercises()
        
        # Group exercises by category
        grouped_exercises = {
            "posture": [],
            "eye": [],
            "stretch": []
        }
        
        for exercise in exercises:
            if exercise.category in grouped_exercises:
                grouped_exercises[exercise.category].append(exercise.dict())
        
        return APIResponse(
            success=True,
            data=grouped_exercises,
            message="Exercises retrieved successfully"
        )
    except Exception as e:
        return APIError(
            error=str(e),
            code="EXERCISES_FETCH_ERROR"
        )

@router.get("/{category}")
async def get_exercises_by_category(category: str):
    """Get exercises by specific category"""
    try:
        if category not in ["posture", "eye", "stretch"]:
            raise HTTPException(status_code=400, detail="Invalid category. Must be: posture, eye, or stretch")
        
        exercises = await database.get_exercises_by_category(category)
        
        return APIResponse(
            success=True,
            data=[ex.dict() for ex in exercises],
            message=f"{category.title()} exercises retrieved successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        return APIError(
            error=str(e),
            code="CATEGORY_EXERCISES_FETCH_ERROR"
        )