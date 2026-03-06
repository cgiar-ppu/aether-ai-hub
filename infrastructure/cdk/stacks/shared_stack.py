from aws_cdk import (
    CfnOutput,
    Duration,
    RemovalPolicy,
    Stack,
    aws_dynamodb as dynamodb,
    aws_ecr as ecr,
    aws_s3 as s3,
)
from constructs import Construct


class SharedStack(Stack):
    """Shared resources: DynamoDB tables, S3 bucket, ECR repositories."""

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # --- DynamoDB: Sessions Table ---
        self.sessions_table = dynamodb.Table(
            self,
            "SessionsTable",
            table_name="co-scientist-sessions",
            partition_key=dynamodb.Attribute(
                name="session_id", type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="user_id", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN,
            time_to_live_attribute="expires_at",
        )

        self.sessions_table.add_global_secondary_index(
            index_name="user-index",
            partition_key=dynamodb.Attribute(
                name="user_id", type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="created_at", type=dynamodb.AttributeType.STRING
            ),
        )

        # --- DynamoDB: Workflows Table ---
        self.workflows_table = dynamodb.Table(
            self,
            "WorkflowsTable",
            table_name="co-scientist-workflows",
            partition_key=dynamodb.Attribute(
                name="workflow_id", type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="user_id", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN,
        )

        self.workflows_table.add_global_secondary_index(
            index_name="user-index",
            partition_key=dynamodb.Attribute(
                name="user_id", type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="created_at", type=dynamodb.AttributeType.STRING
            ),
        )

        # --- S3: User Data Bucket ---
        self.user_data_bucket = s3.Bucket(
            self,
            "UserDataBucket",
            bucket_name=f"co-scientist-user-data-{self.account}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN,
            cors=[
                s3.CorsRule(
                    allowed_headers=["*"],
                    allowed_methods=[
                        s3.HttpMethods.GET,
                        s3.HttpMethods.PUT,
                        s3.HttpMethods.POST,
                    ],
                    allowed_origins=[
                        "https://www.ai-co-scientist-app.synapsis-analytics.com",
                        "https://ai-co-scientist-app.synapsis-analytics.com",
                        "http://localhost:5173",
                    ],
                    max_age=3600,
                )
            ],
            lifecycle_rules=[
                s3.LifecycleRule(
                    prefix="tmp/",
                    expiration=Duration.days(7),
                ),
            ],
        )

        # --- ECR: Backend Repository ---
        self.backend_ecr = ecr.Repository(
            self,
            "BackendEcr",
            repository_name="co-scientist-backend",
            removal_policy=RemovalPolicy.RETAIN,
            image_scan_on_push=True,
        )

        # --- ECR: Agents Repository ---
        self.agents_ecr = ecr.Repository(
            self,
            "AgentsEcr",
            repository_name="co-scientist-agents",
            removal_policy=RemovalPolicy.RETAIN,
            image_scan_on_push=True,
        )

        # --- Outputs ---
        CfnOutput(self, "SessionsTableArn", value=self.sessions_table.table_arn)
        CfnOutput(self, "SessionsTableName", value=self.sessions_table.table_name)
        CfnOutput(self, "WorkflowsTableArn", value=self.workflows_table.table_arn)
        CfnOutput(self, "WorkflowsTableName", value=self.workflows_table.table_name)
        CfnOutput(self, "UserDataBucketArn", value=self.user_data_bucket.bucket_arn)
        CfnOutput(self, "UserDataBucketName", value=self.user_data_bucket.bucket_name)
        CfnOutput(self, "BackendEcrUri", value=self.backend_ecr.repository_uri)
        CfnOutput(self, "AgentsEcrUri", value=self.agents_ecr.repository_uri)
