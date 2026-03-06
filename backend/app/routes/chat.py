import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket
from jose import JWTError

from app.auth.cognito import verify_cognito_token
from app.auth.middleware import get_current_user
from app.models import SessionStatus, User
from app.models.schemas import StartChatRequest
from app.services.agent_proxy import agent_proxy
from app.services.dynamo_service import dynamo_service
from app.config import settings

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/start")
async def start_chat(
    body: StartChatRequest,
    user: User = Depends(get_current_user),
):
    """Start a new chat session by provisioning an agent container.

    Returns the session ID and provisioning status.
    """
    session_id = str(uuid.uuid4())
    session = await agent_proxy.provision_container(user.id, session_id)
    return {
        "session_id": session.id,
        "status": session.status.value,
        "container_url": session.container_url,
    }


@router.get("/status/{session_id}")
async def get_session_status(
    session_id: str,
    user: User = Depends(get_current_user),
):
    """Check the current status of a chat session and its container."""
    status = await agent_proxy.check_status(session_id)
    return status


@router.websocket("/ws/{session_id}")
async def websocket_chat(
    websocket: WebSocket,
    session_id: str,
    token: str = Query(...),
):
    """WebSocket endpoint for real-time chat with an agent container.

    Authenticates via query parameter token, verifies the session is active,
    then relays messages bidirectionally.
    """
    # Validate auth token from query param
    try:
        claims = await verify_cognito_token(token)
    except (JWTError, Exception):
        await websocket.close(code=1008, reason="Invalid token")
        return

    # Verify session is active
    item = await dynamo_service.get_item(
        settings.DYNAMODB_SESSIONS_TABLE,
        {"session_id": session_id},
    )
    if not item or item.get("status") != SessionStatus.ACTIVE.value:
        await websocket.close(code=1008, reason="Session not active")
        return

    if item.get("user_id") != claims.get("sub"):
        await websocket.close(code=1008, reason="Unauthorized")
        return

    await websocket.accept()
    await agent_proxy.relay_websocket(websocket, session_id)


@router.post("/stop/{session_id}")
async def stop_chat(
    session_id: str,
    user: User = Depends(get_current_user),
):
    """Stop a chat session and deprovision its agent container."""
    success = await agent_proxy.deprovision(session_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to stop session")
    return {"status": "terminated", "session_id": session_id}


@router.get("/history/{session_id}")
async def get_chat_history(
    session_id: str,
    user: User = Depends(get_current_user),
):
    """Retrieve chat history for a session from the agent container."""
    item = await dynamo_service.get_item(
        settings.DYNAMODB_SESSIONS_TABLE,
        {"session_id": session_id},
    )
    if not item or not item.get("container_url"):
        raise HTTPException(status_code=404, detail="Session not found")

    if item.get("user_id") != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    import httpx

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"http://{item['container_url']}/history"
        )
        response.raise_for_status()
        return response.json()
