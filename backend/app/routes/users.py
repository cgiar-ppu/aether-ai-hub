from typing import List

from fastapi import APIRouter, Depends

from app.auth.middleware import get_optional_user
from app.config import settings
from app.models import User
from app.models.schemas import UpdateUserRequest
from app.services.dynamo_service import dynamo_service

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=User)
async def get_current_user_profile(user: User = Depends(get_optional_user)):
    """Get the current authenticated user's profile."""
    return user


@router.put("/me")
async def update_user_profile(
    body: UpdateUserRequest,
    user: User = Depends(get_optional_user),
):
    """Update the current user's profile (name, preferences)."""
    updates = {}
    if body.name is not None:
        updates["name"] = body.name
    if body.preferences is not None:
        updates["preferences"] = body.preferences

    if updates:
        await dynamo_service.put_item(
            settings.DYNAMODB_SESSIONS_TABLE,
            {
                "session_id": f"profile:{user.id}",
                "user_id": user.id,
                **updates,
            },
        )

    return {"status": "updated", "user_id": user.id}


@router.get("/me/sessions")
async def get_user_sessions(user: User = Depends(get_optional_user)):
    """List all sessions for the current user."""
    sessions = await dynamo_service.query_by_user(
        settings.DYNAMODB_SESSIONS_TABLE, user.id
    )
    return [
        {
            "session_id": s.get("session_id"),
            "status": s.get("status"),
            "created_at": s.get("created_at"),
        }
        for s in sessions
        if not s.get("session_id", "").startswith(("config:", "profile:"))
    ]
