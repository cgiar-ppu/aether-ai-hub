from typing import List

from fastapi import APIRouter, Depends, HTTPException

from app.auth.middleware import get_current_user
from app.config import settings
from app.models import Agent, AgentRole, AgentType, User
from app.models.schemas import AgentConfigRequest
from app.services.dynamo_service import dynamo_service

router = APIRouter(prefix="/api/agents", tags=["agents"])

# Orchestrator — central intelligence (not a subagent)
ORCHESTRATOR = Agent(
    id="orchestrator",
    name="AI Co-Scientist Orchestrator",
    type=AgentType.LITERATURE_ANALYST,  # placeholder type for the orchestrator
    model="claude-opus-4-6",
    role=AgentRole.ORCHESTRATOR,
    description=(
        "Central intelligence that coordinates all research subagents, "
        "decomposes complex research questions, delegates tasks to specialized "
        "subagents, and synthesizes final results for CGIAR Food, Land & Water research."
    ),
    status="active",
    tools=[],
    capabilities=["Task delegation", "Result synthesis", "Multi-agent coordination"],
    example_prompts=[
        "Run a full systematic review on drought-resistant wheat",
        "Coordinate a hypothesis-to-experiment pipeline for maize yield optimization",
    ],
    icon="brain",
)

# 6 Subagents
AGENTS_CATALOG: List[Agent] = [
    Agent(
        id="literature-analyst",
        name="Literature Analyst",
        type=AgentType.LITERATURE_ANALYST,
        model="claude-sonnet-4",
        role=AgentRole.SUBAGENT,
        description=(
            "Analyzes scientific literature from global agricultural databases, "
            "extracts key findings, identifies research gaps, and synthesizes "
            "systematic reviews on crop science topics for CGIAR research programs."
        ),
        tools=["web_search", "file_read", "memory_store"],
        capabilities=["Paper search", "Meta-analysis", "Gap identification"],
        example_prompts=[
            "Analyze the literature on food security in sub-Saharan Africa",
            "What recent research exists on regenerative agriculture?",
        ],
        icon="book-open",
    ),
    Agent(
        id="data-harmonizer",
        name="Data Harmonizer",
        type=AgentType.DATA_HARMONIZER,
        model="claude-sonnet-4",
        role=AgentRole.SUBAGENT,
        description=(
            "Processes and harmonizes experimental datasets from multiple sources, "
            "cleans data, standardizes formats, runs statistical analyses, and "
            "generates visualizations for agricultural research data."
        ),
        tools=["bash", "file_read", "file_write"],
        capabilities=["Data cleaning", "Normalization", "Dataset cross-referencing"],
        example_prompts=[
            "Harmonize crop yield data from FAOSTAT and World Bank",
            "Normalize survey data from Kenya and Ethiopia",
        ],
        icon="database",
    ),
    Agent(
        id="hypothesis-generator",
        name="Hypothesis Generator",
        type=AgentType.HYPOTHESIS_GENERATOR,
        model="claude-sonnet-4",
        role=AgentRole.SUBAGENT,
        description=(
            "Generates novel research hypotheses by cross-referencing existing "
            "literature, experimental data, and domain knowledge. Identifies "
            "unexplored connections in crop science and agricultural systems."
        ),
        tools=["memory_read", "web_search"],
        capabilities=["PICO generation", "Novelty ranking", "Feasibility analysis"],
        example_prompts=[
            "Generate hypotheses about climate adaptation in South Asia",
            "What novel research questions emerge from recent nutrition data?",
        ],
        icon="lightbulb",
    ),
    Agent(
        id="experiment-designer",
        name="Experiment Designer",
        type=AgentType.EXPERIMENT_DESIGNER,
        model="claude-sonnet-4",
        role=AgentRole.SUBAGENT,
        description=(
            "Designs experimental protocols with statistical power analysis, "
            "randomization schemes, treatment structures, and resource "
            "optimization for field trials and laboratory studies."
        ),
        tools=["bash", "file_write"],
        capabilities=["Statistical design", "Sampling plans", "Power analysis"],
        example_prompts=[
            "Design a randomized trial for drought-resistant varieties",
            "Calculate sample size for a multi-site crop trial",
        ],
        icon="flask",
    ),
    Agent(
        id="peer-reviewer",
        name="Peer Reviewer",
        type=AgentType.PEER_REVIEWER,
        model="claude-sonnet-4",
        role=AgentRole.SUBAGENT,
        description=(
            "Reviews research outputs for methodological rigor, statistical "
            "validity, logical consistency, and alignment with CGIAR standards. "
            "Provides structured feedback and improvement suggestions."
        ),
        tools=["memory_read", "file_read"],
        capabilities=["Methodological review", "Bias detection", "Quality scoring"],
        example_prompts=[
            "Review the methodology of this impact evaluation",
            "Assess the statistical rigor of these results",
        ],
        icon="check-circle",
    ),
    Agent(
        id="report-synthesizer",
        name="Report Synthesizer",
        type=AgentType.REPORT_SYNTHESIZER,
        model="claude-sonnet-4",
        role=AgentRole.SUBAGENT,
        description=(
            "Compiles research findings into structured reports, policy briefs, "
            "donor summaries, and publication-ready manuscripts following "
            "CGIAR reporting standards and formatting guidelines."
        ),
        tools=["file_read", "file_write", "memory_read"],
        capabilities=[
            "Result synthesis",
            "PDF/DOCX generation",
            "Executive summaries",
        ],
        example_prompts=[
            "Synthesize all findings into a policy brief",
            "Generate an executive summary for the research report",
        ],
        icon="file-text",
    ),
]

# Lookup maps for both hyphenated IDs and enum type values
_AGENTS_BY_ID = {a.id: a for a in AGENTS_CATALOG}
_AGENTS_BY_TYPE = {a.type.value: a for a in AGENTS_CATALOG}


@router.get("/", response_model=List[Agent])
async def list_agents(user: User = Depends(get_current_user)):
    """List all available AI agents including the orchestrator."""
    return [ORCHESTRATOR] + AGENTS_CATALOG


@router.get("/orchestrator", response_model=Agent)
async def get_orchestrator(user: User = Depends(get_current_user)):
    """Get the orchestrator agent details."""
    return ORCHESTRATOR


@router.get("/{agent_id}", response_model=Agent)
async def get_agent(agent_id: str, user: User = Depends(get_current_user)):
    """Get detailed information about a specific agent by ID or type."""
    if agent_id == "orchestrator":
        return ORCHESTRATOR
    # Support both hyphenated IDs and underscore type values
    agent = _AGENTS_BY_ID.get(agent_id) or _AGENTS_BY_TYPE.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.get("/{agent_id}/status")
async def get_agent_status(agent_id: str, user: User = Depends(get_current_user)):
    """Check the status of a specific agent (in production, checks container status)."""
    if agent_id == "orchestrator":
        return {"agent_id": "orchestrator", "status": "active", "sessions": 0}
    agent = _AGENTS_BY_ID.get(agent_id) or _AGENTS_BY_TYPE.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"agent_id": agent.id, "status": "active", "sessions": 0}


@router.post("/{agent_id}/configure")
async def configure_agent(
    agent_id: str,
    config: AgentConfigRequest,
    user: User = Depends(get_current_user),
):
    """Save user-specific configuration for an agent."""
    agent = _AGENTS_BY_ID.get(agent_id) or _AGENTS_BY_TYPE.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    await dynamo_service.put_item(
        settings.DYNAMODB_SESSIONS_TABLE,
        {
            "session_id": f"config:{user.id}:{agent.id}",
            "user_id": user.id,
            "agent_id": agent.id,
            "parameters": config.parameters,
            "custom_prompts": config.custom_prompts,
        },
    )
    return {"status": "saved", "agent_id": agent.id}
