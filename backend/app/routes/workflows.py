import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException

from app.auth.middleware import get_current_user
from app.config import settings
from app.models import User, Workflow
from app.models.schemas import CreateWorkflowRequest
from app.services.agent_proxy import agent_proxy
from app.services.dynamo_service import dynamo_service

router = APIRouter(prefix="/api/workflows", tags=["workflows"])


@router.post("/", response_model=Workflow)
async def create_workflow(
    body: CreateWorkflowRequest,
    user: User = Depends(get_current_user),
):
    """Create a new multi-agent workflow with ordered steps."""
    now = datetime.now(timezone.utc)
    workflow = Workflow(
        id=str(uuid.uuid4()),
        user_id=user.id,
        name=body.name,
        description=body.description,
        steps=[
            {"agent_type": s.agent_type.value, "input_data": s.input_data, "status": "pending"}
            for s in body.steps
        ],
        status="draft",
        created_at=now,
    )

    await dynamo_service.put_item(
        settings.DYNAMODB_WORKFLOWS_TABLE,
        {
            "workflow_id": workflow.id,
            "user_id": user.id,
            "name": workflow.name,
            "description": workflow.description,
            "steps": [s.model_dump() if hasattr(s, "model_dump") else s for s in workflow.steps],
            "status": workflow.status,
            "created_at": now.isoformat(),
        },
    )
    return workflow


@router.get("/", response_model=List[Workflow])
async def list_workflows(user: User = Depends(get_current_user)):
    """List all workflows belonging to the current user."""
    items = await dynamo_service.query_by_user(
        settings.DYNAMODB_WORKFLOWS_TABLE, user.id
    )
    workflows = []
    for item in items:
        workflows.append(
            Workflow(
                id=item["workflow_id"],
                user_id=item["user_id"],
                name=item.get("name", ""),
                description=item.get("description", ""),
                steps=item.get("steps", []),
                status=item.get("status", "draft"),
                created_at=item.get("created_at", datetime.now(timezone.utc).isoformat()),
                updated_at=item.get("updated_at"),
            )
        )
    return workflows


@router.get("/{workflow_id}", response_model=Workflow)
async def get_workflow(
    workflow_id: str,
    user: User = Depends(get_current_user),
):
    """Get detailed information about a specific workflow including step statuses."""
    item = await dynamo_service.get_item(
        settings.DYNAMODB_WORKFLOWS_TABLE,
        {"workflow_id": workflow_id},
    )
    if not item:
        raise HTTPException(status_code=404, detail="Workflow not found")
    if item.get("user_id") != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return Workflow(
        id=item["workflow_id"],
        user_id=item["user_id"],
        name=item.get("name", ""),
        description=item.get("description", ""),
        steps=item.get("steps", []),
        status=item.get("status", "draft"),
        created_at=item.get("created_at", datetime.now(timezone.utc).isoformat()),
        updated_at=item.get("updated_at"),
    )


@router.delete("/{workflow_id}")
async def delete_workflow(
    workflow_id: str,
    user: User = Depends(get_current_user),
):
    """Cancel and delete a workflow."""
    item = await dynamo_service.get_item(
        settings.DYNAMODB_WORKFLOWS_TABLE,
        {"workflow_id": workflow_id},
    )
    if not item:
        raise HTTPException(status_code=404, detail="Workflow not found")
    if item.get("user_id") != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    await dynamo_service.delete_item(
        settings.DYNAMODB_WORKFLOWS_TABLE,
        {"workflow_id": workflow_id},
    )
    return {"status": "deleted", "workflow_id": workflow_id}


@router.post("/{workflow_id}/execute")
async def execute_workflow(
    workflow_id: str,
    user: User = Depends(get_current_user),
):
    """Start execution of a workflow via the agent service.

    Requires an active session with a provisioned container.
    """
    item = await dynamo_service.get_item(
        settings.DYNAMODB_WORKFLOWS_TABLE,
        {"workflow_id": workflow_id},
    )
    if not item:
        raise HTTPException(status_code=404, detail="Workflow not found")
    if item.get("user_id") != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Find an active session for this user
    sessions = await dynamo_service.query_by_user(
        settings.DYNAMODB_SESSIONS_TABLE, user.id
    )
    active_session = next(
        (s for s in sessions if s.get("status") == "active"), None
    )
    if not active_session:
        raise HTTPException(
            status_code=400,
            detail="No active session. Start a chat session first.",
        )

    workflow = Workflow(
        id=item["workflow_id"],
        user_id=item["user_id"],
        name=item.get("name", ""),
        description=item.get("description", ""),
        steps=item.get("steps", []),
        status=item.get("status", "draft"),
        created_at=item.get("created_at", datetime.now(timezone.utc).isoformat()),
    )

    await dynamo_service.update_item(
        settings.DYNAMODB_WORKFLOWS_TABLE,
        {"workflow_id": workflow_id},
        {"status": "running", "updated_at": datetime.now(timezone.utc).isoformat()},
    )

    result = await agent_proxy.execute_workflow(
        active_session["session_id"], workflow
    )

    await dynamo_service.update_item(
        settings.DYNAMODB_WORKFLOWS_TABLE,
        {"workflow_id": workflow_id},
        {"status": "completed", "updated_at": datetime.now(timezone.utc).isoformat()},
    )

    return {"status": "completed", "workflow_id": workflow_id, "result": result}
