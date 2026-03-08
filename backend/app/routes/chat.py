import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket
from jose import JWTError

from app.auth.cognito import verify_cognito_token
from app.auth.middleware import get_optional_user
from app.models import SessionStatus, User
from app.models.schemas import StartChatRequest
from app.services.agent_proxy import agent_proxy
from app.services.dynamo_service import dynamo_service
from app.config import settings

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/start")
async def start_chat(
    body: StartChatRequest,
    user: User = Depends(get_optional_user),
):
    """Start a new chat session by provisioning an agent container.

    Returns the session ID and provisioning status.
    """
    session_id = str(uuid.uuid4())
    agent_type = body.agent_type.value if body.agent_type else "default"
    session = await agent_proxy.provision_container(user.id, session_id, agent_type)
    return {
        "session_id": session.id,
        "status": session.status.value,
        "container_url": session.container_url,
    }


@router.get("/status/{session_id}")
async def get_session_status(
    session_id: str,
    user: User = Depends(get_optional_user),
):
    """Check the current status of a chat session and its container."""
    status = await agent_proxy.check_status(session_id, user.id)
    return status


@router.websocket("/ws/{session_id}")
async def websocket_chat(
    websocket: WebSocket,
    session_id: str,
    token: str = Query(None),
):
    """WebSocket endpoint for real-time chat with an agent container.

    Authenticates via query parameter token if provided. Falls back to guest
    access when no token is supplied (development mode).
    Always accepts the connection first so the client receives proper error
    messages instead of opaque close frames.
    """
    import json as _json
    import logging

    logger = logging.getLogger(__name__)

    # Always accept first so the client can receive error messages
    await websocket.accept()

    user_id = "guest"
    if token:
        try:
            claims = await verify_cognito_token(token)
            user_id = claims.get("sub", "guest")
        except (JWTError, Exception) as exc:
            logger.warning("WS auth failed for session %s: %s", session_id, exc)
            await websocket.send_text(
                _json.dumps({"type": "error", "error": "Invalid or expired token"})
            )
            await websocket.close(code=1008, reason="Invalid token")
            return

    # Verify session is active
    item = await dynamo_service.get_item(
        settings.DYNAMODB_SESSIONS_TABLE,
        {"session_id": session_id, "user_id": user_id},
    )
    if not item:
        logger.warning(
            "WS session not found: session_id=%s user_id=%s", session_id, user_id
        )
        await websocket.send_text(
            _json.dumps({"type": "error", "error": "Session not found. Please start a new chat."})
        )
        await websocket.close(code=1008, reason="Session not found")
        return

    status = item.get("status")
    if status == SessionStatus.TERMINATED.value:
        logger.warning(
            "WS session terminated: session_id=%s", session_id
        )
        await websocket.send_text(
            _json.dumps({"type": "error", "error": "Session has ended. Please start a new chat."})
        )
        await websocket.close(code=1008, reason="Session terminated")
        return

    if status not in (SessionStatus.ACTIVE.value, SessionStatus.PROVISIONING.value):
        logger.warning(
            "WS session not connectable: session_id=%s status=%s",
            session_id,
            status,
        )
        await websocket.send_text(
            _json.dumps({
                "type": "error",
                "error": f"Session is {status or 'unknown'}. Please wait or retry.",
            })
        )
        await websocket.close(code=1008, reason="Session not active")
        return

    await agent_proxy.relay_websocket(websocket, session_id, user_id)


@router.post("/stop/{session_id}")
async def stop_chat(
    session_id: str,
    user: User = Depends(get_optional_user),
):
    """Stop a chat session and deprovision its agent container."""
    success = await agent_proxy.deprovision(session_id, user.id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to stop session")
    return {"status": "terminated", "session_id": session_id}


@router.get("/history/{session_id}")
async def get_chat_history(
    session_id: str,
    user: User = Depends(get_optional_user),
):
    """Retrieve chat history for a session from the agent container."""
    item = await dynamo_service.get_item(
        settings.DYNAMODB_SESSIONS_TABLE,
        {"session_id": session_id, "user_id": user.id},
    )
    if not item or not item.get("container_url"):
        raise HTTPException(status_code=404, detail="Session not found")

    import httpx

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"http://{item['container_url']}/history"
        )
        response.raise_for_status()
        return response.json()
