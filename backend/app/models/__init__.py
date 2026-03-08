from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel


class AgentType(str, Enum):
    LITERATURE_ANALYST = "literature_analyst"
    DATA_HARMONIZER = "data_harmonizer"
    HYPOTHESIS_GENERATOR = "hypothesis_generator"
    EXPERIMENT_DESIGNER = "experiment_designer"
    PEER_REVIEWER = "peer_reviewer"
    REPORT_SYNTHESIZER = "report_synthesizer"


class ConfidenceLevel(str, Enum):
    GREEN = "green"
    AMBER = "amber"
    RED = "red"


class SessionStatus(str, Enum):
    PROVISIONING = "provisioning"
    ACTIVE = "active"
    TERMINATING = "terminating"
    TERMINATED = "terminated"


class User(BaseModel):
    id: str
    email: str
    name: str = ""
    role: str = "user"
    groups: List[str] = []


class WorkflowStep(BaseModel):
    agent_type: AgentType
    input_data: Optional[dict] = None
    output_data: Optional[dict] = None
    status: str = "pending"
    confidence: Optional[ConfidenceLevel] = None


class AgentRole(str, Enum):
    ORCHESTRATOR = "orchestrator"
    SUBAGENT = "subagent"


class Agent(BaseModel):
    id: str
    name: str
    type: AgentType
    model: str = "claude-sonnet-4"
    role: AgentRole = AgentRole.SUBAGENT
    description: str
    system_prompt: str = ""
    status: str = "available"
    tools: List[str] = []
    capabilities: List[str] = []
    example_prompts: List[str] = []
    icon: str = ""


class Session(BaseModel):
    id: str
    user_id: str
    container_url: Optional[str] = None
    container_id: Optional[str] = None
    instance_id: Optional[str] = None
    status: SessionStatus = SessionStatus.PROVISIONING
    created_at: datetime
    expires_at: Optional[datetime] = None


class Workflow(BaseModel):
    id: str
    user_id: str
    name: str
    description: str = ""
    steps: List[WorkflowStep] = []
    status: str = "draft"
    created_at: datetime
    updated_at: Optional[datetime] = None


class ChatMessage(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    timestamp: datetime
    agent_type: Optional[AgentType] = None


class FileMetadata(BaseModel):
    key: str
    name: str
    size: int
    content_type: str
    uploaded_at: datetime
    user_id: str
