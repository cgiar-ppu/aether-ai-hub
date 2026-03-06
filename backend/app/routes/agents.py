from typing import List

from fastapi import APIRouter, Depends, HTTPException

from app.auth.middleware import get_current_user
from app.config import settings
from app.models import Agent, AgentType, User
from app.models.schemas import AgentConfigRequest
from app.services.dynamo_service import dynamo_service

router = APIRouter(prefix="/api/agents", tags=["agents"])

AGENTS_CATALOG: List[Agent] = [
    Agent(
        id="literature_analyst",
        name="Literature Analyst",
        type=AgentType.LITERATURE_ANALYST,
        description=(
            "Searches and analyzes scientific papers, CGIAR reports, FAO, IFPRI. "
            "Extracts key findings and identifies gaps."
        ),
        capabilities=["Paper search", "Meta-analysis", "Gap identification"],
        example_prompts=[
            "Analyze the literature on food security in sub-Saharan Africa",
            "What recent research exists on regenerative agriculture?",
        ],
        icon="book-open",
    ),
    Agent(
        id="data_harmonizer",
        name="Data Harmonizer",
        type=AgentType.DATA_HARMONIZER,
        description=(
            "Cleans, normalizes and cross-references agricultural datasets "
            "from FAOSTAT, World Bank, national surveys."
        ),
        capabilities=["Data cleaning", "Normalization", "Dataset cross-referencing"],
        example_prompts=[
            "Harmonize crop yield data from FAOSTAT and World Bank",
            "Normalize survey data from Kenya and Ethiopia",
        ],
        icon="database",
    ),
    Agent(
        id="hypothesis_generator",
        name="Hypothesis Generator",
        type=AgentType.HYPOTHESIS_GENERATOR,
        description=(
            "Generates research hypotheses using PICO framework based on "
            "available evidence."
        ),
        capabilities=["PICO generation", "Novelty ranking", "Feasibility analysis"],
        example_prompts=[
            "Generate hypotheses about climate adaptation in South Asia",
            "What novel research questions emerge from recent nutrition data?",
        ],
        icon="lightbulb",
    ),
    Agent(
        id="experiment_designer",
        name="Experiment Designer",
        type=AgentType.EXPERIMENT_DESIGNER,
        description=(
            "Designs experimental protocols, sampling plans and sample size "
            "calculations."
        ),
        capabilities=["Statistical design", "Sampling plans", "Power analysis"],
        example_prompts=[
            "Design a randomized trial for drought-resistant varieties",
            "Calculate sample size for a multi-site crop trial",
        ],
        icon="flask",
    ),
    Agent(
        id="peer_reviewer",
        name="Peer Reviewer",
        type=AgentType.PEER_REVIEWER,
        description=(
            "Critically reviews outputs against CGIAR-QA standards. "
            "Evaluates methodological rigor and biases."
        ),
        capabilities=["Methodological review", "Bias detection", "Quality scoring"],
        example_prompts=[
            "Review the methodology of this impact evaluation",
            "Assess the statistical rigor of these results",
        ],
        icon="check-circle",
    ),
    Agent(
        id="report_synthesizer",
        name="Report Synthesizer",
        type=AgentType.REPORT_SYNTHESIZER,
        description=(
            "Compiles results from all agents into structured CGIAR-format reports."
        ),
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

_AGENTS_BY_TYPE = {a.type.value: a for a in AGENTS_CATALOG}


@router.get("/", response_model=List[Agent])
async def list_agents(user: User = Depends(get_current_user)):
    """List all available AI agents with their metadata and capabilities."""
    return AGENTS_CATALOG


@router.get("/{agent_type}", response_model=Agent)
async def get_agent(agent_type: AgentType, user: User = Depends(get_current_user)):
    """Get detailed information about a specific agent type."""
    agent = _AGENTS_BY_TYPE.get(agent_type.value)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.post("/{agent_type}/configure")
async def configure_agent(
    agent_type: AgentType,
    config: AgentConfigRequest,
    user: User = Depends(get_current_user),
):
    """Save user-specific configuration for an agent type."""
    if agent_type.value not in _AGENTS_BY_TYPE:
        raise HTTPException(status_code=404, detail="Agent not found")

    await dynamo_service.put_item(
        settings.DYNAMODB_SESSIONS_TABLE,
        {
            "session_id": f"config:{user.id}:{agent_type.value}",
            "user_id": user.id,
            "agent_type": agent_type.value,
            "parameters": config.parameters,
            "custom_prompts": config.custom_prompts,
        },
    )
    return {"status": "saved", "agent_type": agent_type.value}
