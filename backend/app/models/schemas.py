from typing import List, Optional

from pydantic import BaseModel

from . import AgentType, ConfidenceLevel


class CreateWorkflowRequest(BaseModel):
    """Request body for creating a new workflow."""
    name: str
    description: str = ""
    steps: List["WorkflowStepInput"] = []


class WorkflowStepInput(BaseModel):
    """Input for a workflow step."""
    agent_type: AgentType
    input_data: Optional[dict] = None


class UpdateUserRequest(BaseModel):
    """Request body for updating user profile."""
    name: Optional[str] = None
    preferences: Optional[dict] = None


class AgentConfigRequest(BaseModel):
    """Request body for agent configuration."""
    parameters: dict = {}
    custom_prompts: List[str] = []


class FileUploadRequest(BaseModel):
    """Request body for generating a presigned upload URL."""
    filename: str
    content_type: str


class StartChatRequest(BaseModel):
    """Request body for starting a chat session."""
    agent_type: Optional[AgentType] = None


class ExecuteWorkflowRequest(BaseModel):
    """Request body for executing a workflow."""
    pass


class DashboardStatsResponse(BaseModel):
    """Response for dashboard statistics."""
    total_sessions: int = 0
    total_workflows: int = 0
    total_files: int = 0
    last_activity: Optional[str] = None


class UsageByAgentResponse(BaseModel):
    """Usage statistics per agent type."""
    agent_type: str
    count: int = 0


class ActivityItem(BaseModel):
    """A recent activity entry."""
    type: str
    description: str
    timestamp: str
    agent_type: Optional[str] = None
