from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(env_prefix="COSCIENTIST_")

    AWS_REGION: str = "eu-west-1"
    COGNITO_USER_POOL_ID: str = ""
    COGNITO_CLIENT_ID: str = ""
    COGNITO_JWKS_URL: str = ""
    DYNAMODB_SESSIONS_TABLE: str = "co-scientist-sessions"
    DYNAMODB_WORKFLOWS_TABLE: str = "co-scientist-workflows"
    S3_BUCKET_USER_DATA: str = ""
    AGENT_SERVICE_BASE_URL: str = "http://localhost:7777"
    LAMBDA_PROVISION_FUNCTION: str = "co-scientist-provision"
    LAMBDA_DEPROVISION_FUNCTION: str = "co-scientist-deprovision"
    LAMBDA_STATUS_FUNCTION: str = "co-scientist-status"
    CORS_ORIGINS: list = [
        "https://www.ai-co-scientist-app.synapsis-analytics.com",
        "https://ai-co-scientist-app.synapsis-analytics.com",
        "http://localhost:5173",
        "http://localhost:3000",
    ]
    AMPLIFY_APP_URL: str = "https://www.ai-co-scientist-app.synapsis-analytics.com"

    def get_jwks_url(self) -> str:
        """Build JWKS URL from Cognito User Pool ID if not explicitly set."""
        if self.COGNITO_JWKS_URL:
            return self.COGNITO_JWKS_URL
        region = self.AWS_REGION
        pool_id = self.COGNITO_USER_POOL_ID
        return f"https://cognito-idp.{region}.amazonaws.com/{pool_id}/.well-known/jwks.json"


settings = Settings()
