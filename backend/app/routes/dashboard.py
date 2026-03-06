from typing import List

from fastapi import APIRouter, Depends

from app.auth.middleware import get_current_user
from app.config import settings
from app.models import User
from app.models.schemas import ActivityItem, DashboardStatsResponse, UsageByAgentResponse
from app.services.dynamo_service import dynamo_service
from app.services.s3_service import s3_service

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_stats(user: User = Depends(get_current_user)):
    """Get aggregate dashboard statistics for the current user.

    Returns total sessions, workflows, files, and timestamp of last activity.
    """
    sessions = await dynamo_service.query_by_user(
        settings.DYNAMODB_SESSIONS_TABLE, user.id
    )
    workflows = await dynamo_service.query_by_user(
        settings.DYNAMODB_WORKFLOWS_TABLE, user.id
    )
    files = await s3_service.list_user_files(user.id)

    last_activity = None
    all_timestamps = [s.get("created_at") for s in sessions if s.get("created_at")]
    all_timestamps += [w.get("created_at") for w in workflows if w.get("created_at")]
    if all_timestamps:
        last_activity = max(all_timestamps)

    return DashboardStatsResponse(
        total_sessions=len(sessions),
        total_workflows=len(workflows),
        total_files=len(files),
        last_activity=last_activity,
    )


@router.get("/usage", response_model=List[UsageByAgentResponse])
async def get_usage(user: User = Depends(get_current_user)):
    """Get usage statistics grouped by agent type for the current user."""
    workflows = await dynamo_service.query_by_user(
        settings.DYNAMODB_WORKFLOWS_TABLE, user.id
    )

    usage: dict = {}
    for workflow in workflows:
        for step in workflow.get("steps", []):
            agent_type = step.get("agent_type", "unknown")
            usage[agent_type] = usage.get(agent_type, 0) + 1

    return [
        UsageByAgentResponse(agent_type=agent_type, count=count)
        for agent_type, count in usage.items()
    ]


@router.get("/recent-activity", response_model=List[ActivityItem])
async def get_recent_activity(user: User = Depends(get_current_user)):
    """Get the last 10 activities for the current user across sessions and workflows."""
    sessions = await dynamo_service.query_by_user(
        settings.DYNAMODB_SESSIONS_TABLE, user.id
    )
    workflows = await dynamo_service.query_by_user(
        settings.DYNAMODB_WORKFLOWS_TABLE, user.id
    )

    activities: List[ActivityItem] = []

    for session in sessions:
        activities.append(
            ActivityItem(
                type="session",
                description=f"Session {session.get('status', 'unknown')}",
                timestamp=session.get("created_at", ""),
            )
        )

    for workflow in workflows:
        activities.append(
            ActivityItem(
                type="workflow",
                description=f"Workflow '{workflow.get('name', 'Untitled')}' - {workflow.get('status', 'draft')}",
                timestamp=workflow.get("created_at", ""),
            )
        )

    activities.sort(key=lambda a: a.timestamp, reverse=True)
    return activities[:10]
