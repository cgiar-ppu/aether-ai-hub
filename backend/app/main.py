# CI trigger
import logging

import boto3
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import agents, chat, dashboard, files, users, workflows

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CGIAR AI Co-Scientist API",
    version="1.0.0",
    description="Main Backend - Auth, CRUD, File Manager, Agent Proxy",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents.router)
app.include_router(chat.router)
app.include_router(workflows.router)
app.include_router(files.router)
app.include_router(dashboard.router)
app.include_router(users.router)


@app.get("/api/health", tags=["health"])
async def health_check():
    """Health check endpoint. No authentication required."""
    return {
        "status": "healthy",
        "service": "co-scientist-backend",
        "version": "1.0.0",
    }


@app.on_event("startup")
async def startup_event():
    """Verify configuration and DynamoDB table connectivity on startup."""
    logger.info("Starting CGIAR AI Co-Scientist Backend v1.0.0")
    logger.info("Region: %s", settings.AWS_REGION)
    logger.info("CORS origins: %s", settings.CORS_ORIGINS)

    try:
        dynamodb = boto3.client("dynamodb", region_name=settings.AWS_REGION)
        for table_name in [
            settings.DYNAMODB_SESSIONS_TABLE,
            settings.DYNAMODB_WORKFLOWS_TABLE,
        ]:
            response = dynamodb.describe_table(TableName=table_name)
            status = response["Table"]["TableStatus"]
            logger.info("DynamoDB table %s: %s", table_name, status)
    except Exception as e:
        logger.warning("Could not verify DynamoDB tables: %s", e)
