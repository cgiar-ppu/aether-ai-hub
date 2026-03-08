import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import boto3
import httpx
import websockets
from fastapi import WebSocket, WebSocketDisconnect

from app.config import settings
from app.models import Session, SessionStatus, Workflow
from app.services.dynamo_service import dynamo_service

logger = logging.getLogger(__name__)


class AgentProxy:
    """Proxy between the main backend and the Agent Service containers.

    Handles container provisioning via Lambda, WebSocket relay,
    status checks, and deprovisioning.
    """

    def __init__(self) -> None:
        self._lambda = boto3.client("lambda", region_name=settings.AWS_REGION)

    async def _invoke_lambda(
        self,
        function_name: str,
        payload: Dict[str, Any],
        retries: int = 3,
        timeout: float = 60.0,
    ) -> Dict[str, Any]:
        """Invoke a Lambda function with retries and exponential backoff.

        Lambda functions in the co-scientist-agents stack expect API Gateway
        format payloads and return API Gateway format responses:
          Request:  {"body": "{\"userId\": ...}"}  or  {"pathParameters": {...}}
          Response: {"statusCode": 200, "body": "{...}"}
        This method handles the response parsing automatically.
        """
        last_error: Optional[Exception] = None

        for attempt in range(retries):
            try:
                response = await asyncio.to_thread(
                    self._lambda.invoke,
                    FunctionName=function_name,
                    InvocationType="RequestResponse",
                    Payload=json.dumps(payload).encode(),
                )
                result = json.loads(response["Payload"].read().decode())
                if response.get("FunctionError"):
                    raise RuntimeError(f"Lambda error: {result}")

                # Parse API Gateway response format
                if "statusCode" in result and "body" in result:
                    status_code = result["statusCode"]
                    body = json.loads(result["body"]) if isinstance(result["body"], str) else result["body"]
                    if status_code >= 400:
                        raise RuntimeError(
                            f"Lambda returned {status_code}: {body.get('error', body)}"
                        )
                    return body

                return result
            except Exception as e:
                last_error = e
                if attempt < retries - 1:
                    wait = 2 ** attempt
                    logger.warning(
                        "Lambda %s attempt %d failed, retrying in %ds: %s",
                        function_name,
                        attempt + 1,
                        wait,
                        e,
                    )
                    await asyncio.sleep(wait)

        raise RuntimeError(
            f"Lambda {function_name} failed after {retries} attempts: {last_error}"
        )

    async def _get_session(self, session_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Look up a session from DynamoDB using both composite key parts."""
        return await dynamo_service.get_item(
            settings.DYNAMODB_SESSIONS_TABLE,
            {"session_id": session_id, "user_id": user_id},
        )

    async def provision_container(
        self, user_id: str, session_id: str, agent_type: str = "default"
    ) -> Session:
        """Provision a new agent container via Lambda.

        Invokes the provision Lambda (API Gateway format), saves the session
        to DynamoDB, and returns the session with container URL.
        ``agent_type`` is forwarded so the container can load the correct
        agent personality / system prompt.
        """
        now = datetime.now(timezone.utc)

        # --- Direct mode: skip Lambda, point straight at the persistent agent ---
        if settings.AGENT_DIRECT_URL:
            container_url = settings.AGENT_DIRECT_URL
            session = Session(
                id=session_id,
                user_id=user_id,
                container_url=container_url,
                status=SessionStatus.ACTIVE,
                created_at=now,
            )
            await dynamo_service.put_item(
                settings.DYNAMODB_SESSIONS_TABLE,
                {
                    "session_id": session.id,
                    "user_id": user_id,
                    "container_url": container_url,
                    "container_id": "",
                    "instance_id": "",
                    "status": session.status.value,
                    "created_at": now.isoformat(),
                },
            )
            return session

        # --- Lambda provisioning mode ---
        # Lambda expects API Gateway format with camelCase field names
        result = await self._invoke_lambda(
            settings.LAMBDA_PROVISION_FUNCTION,
            {
                "body": json.dumps({
                    "userId": user_id,
                    "sessionId": session_id,
                    "agentId": agent_type,
                }),
            },
        )

        # Lambda returns camelCase: appUrl, userId, coldStart
        # Strip protocol prefix — relay_websocket prepends ws:// itself
        raw_url = result.get("appUrl", "")
        container_url = raw_url.replace("http://", "").replace("https://", "")

        # Always start as PROVISIONING — the status endpoint will promote to
        # ACTIVE only when the container health-check confirms it is ready.
        # The provision Lambda may optimistically return "ready"/"active"
        # before the container is actually serving requests.
        status = SessionStatus.PROVISIONING
        session = Session(
            id=session_id,
            user_id=user_id,
            container_url=container_url or None,
            container_id=result.get("containerId"),
            instance_id=result.get("instanceId"),
            status=status,
            created_at=now,
        )

        await dynamo_service.put_item(
            settings.DYNAMODB_SESSIONS_TABLE,
            {
                "session_id": session.id,
                "user_id": user_id,
                "container_url": container_url,
                "container_id": session.container_id or "",
                "instance_id": session.instance_id or "",
                "status": session.status.value,
                "created_at": now.isoformat(),
            },
        )

        return session

    async def relay_websocket(
        self, frontend_ws: WebSocket, session_id: str, user_id: str = "guest"
    ) -> None:
        """Bidirectional WebSocket relay between frontend and agent container."""
        item = await self._get_session(session_id, user_id)
        if not item or not item.get("container_url"):
            try:
                await frontend_ws.send_text(
                    json.dumps({"type": "error", "error": "Session has no container URL"})
                )
            except Exception:
                pass
            await frontend_ws.close(code=1008, reason="Session not found")
            return

        container_url = item["container_url"]
        ws_url = f"ws://{container_url}/ws/chat"
        logger.info(
            "Relay connecting to container: %s (session=%s)", ws_url, session_id
        )

        try:
            async with websockets.connect(
                ws_url, open_timeout=15, close_timeout=5
            ) as container_ws:
                logger.info("Container WS connected for session %s", session_id)

                async def forward_to_container():
                    try:
                        while True:
                            data = await frontend_ws.receive_text()
                            await container_ws.send(data)
                    except WebSocketDisconnect:
                        logger.info("Frontend disconnected for session %s", session_id)

                async def forward_to_frontend():
                    try:
                        async for message in container_ws:
                            await frontend_ws.send_text(
                                message if isinstance(message, str) else message.decode()
                            )
                    except websockets.ConnectionClosed:
                        logger.info(
                            "Container WS closed for session %s", session_id
                        )

                async def heartbeat():
                    try:
                        while True:
                            await asyncio.sleep(30)
                            await container_ws.ping()
                    except Exception:
                        pass

                tasks = [
                    asyncio.create_task(forward_to_container()),
                    asyncio.create_task(forward_to_frontend()),
                    asyncio.create_task(heartbeat()),
                ]
                done, pending = await asyncio.wait(
                    tasks, return_when=asyncio.FIRST_COMPLETED
                )
                for task in pending:
                    task.cancel()

        except (ConnectionRefusedError, OSError) as e:
            logger.error(
                "Cannot reach container %s for session %s: %s",
                ws_url,
                session_id,
                e,
            )
            try:
                await frontend_ws.send_text(
                    json.dumps({
                        "type": "error",
                        "error": "Agent container is not reachable. It may still be starting — please retry.",
                    })
                )
            except Exception:
                pass
        except Exception as e:
            logger.error("WebSocket relay error for session %s: %s", session_id, e)
            try:
                await frontend_ws.send_text(
                    json.dumps({
                        "type": "error",
                        "error": f"Connection to agent lost: {e}",
                    })
                )
            except Exception:
                pass
        finally:
            try:
                await frontend_ws.close()
            except Exception:
                pass

    async def check_status(
        self, session_id: str, user_id: str = "guest"
    ) -> Dict[str, Any]:
        """Check the status of an agent container via Lambda.

        Calls the status Lambda with the userId, then updates DynamoDB
        if the container has become ready.
        """
        # --- Direct mode: always healthy ---
        if settings.AGENT_DIRECT_URL:
            return {
                "status": "active",
                "container_url": settings.AGENT_DIRECT_URL,
                "healthy": True,
            }

        # --- Lambda provisioning mode ---
        result = await self._invoke_lambda(
            settings.LAMBDA_STATUS_FUNCTION,
            {"pathParameters": {"userId": user_id}},
        )

        # Map Lambda response fields (camelCase → snake_case)
        raw_url = result.get("appUrl", "")
        container_url = raw_url.replace("http://", "").replace("https://", "")
        status = result.get("status", "unknown")
        healthy = result.get("healthy", False)

        # Update session in DynamoDB if container is now ready
        if container_url and status in ("ready", "running"):
            await dynamo_service.update_item(
                settings.DYNAMODB_SESSIONS_TABLE,
                {"session_id": session_id, "user_id": user_id},
                {
                    "container_url": container_url,
                    "status": SessionStatus.ACTIVE.value,
                },
            )

        return {
            "status": "active" if healthy else status,
            "container_url": container_url or None,
            "healthy": healthy,
        }

    async def deprovision(
        self, session_id: str, user_id: str = "guest"
    ) -> bool:
        """Deprovision an agent container and update DynamoDB."""
        # --- Direct mode: just mark terminated in DynamoDB, no Lambda call ---
        if not settings.AGENT_DIRECT_URL:
            try:
                await self._invoke_lambda(
                    settings.LAMBDA_DEPROVISION_FUNCTION,
                    {"pathParameters": {"userId": user_id}},
                )
            except RuntimeError as e:
                logger.warning("Deprovision Lambda error (non-fatal): %s", e)

        await dynamo_service.update_item(
            settings.DYNAMODB_SESSIONS_TABLE,
            {"session_id": session_id, "user_id": user_id},
            {"status": SessionStatus.TERMINATED.value},
        )
        return True

    async def execute_workflow(
        self, session_id: str, user_id: str, workflow: Workflow
    ) -> Dict[str, Any]:
        """Execute a workflow on the agent container via HTTP POST."""
        item = await self._get_session(session_id, user_id)
        if not item or not item.get("container_url"):
            raise RuntimeError(f"Session {session_id} not found or has no container")

        container_url = item["container_url"]
        payload = {
            "workflow_id": workflow.id,
            "steps": [
                {
                    "agent_type": step.agent_type.value,
                    "input_data": step.input_data,
                }
                for step in workflow.steps
            ],
        }

        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                f"http://{container_url}/workflow",
                json=payload,
            )
            response.raise_for_status()
            return response.json()


agent_proxy = AgentProxy()
