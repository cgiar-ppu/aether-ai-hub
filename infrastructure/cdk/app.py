#!/usr/bin/env python3
# CI trigger
import aws_cdk as cdk

from stacks.shared_stack import SharedStack
from stacks.auth_stack import AuthStack
from stacks.network_stack import NetworkStack
from stacks.backend_stack import BackendStack

app = cdk.App()

env = cdk.Environment(account="919959486181", region="eu-central-1")

# --- Shared resources (DynamoDB, S3, ECR) ---
shared = SharedStack(app, "CoScientistShared", env=env)

# --- Authentication (Cognito) ---
auth = AuthStack(app, "CoScientistAuth", env=env)

# --- Networking (VPC, Security Groups) ---
network = NetworkStack(app, "CoScientistNetwork", env=env)

# --- Backend (EC2 + ALB) ---
backend = BackendStack(
    app,
    "CoScientistBackend",
    vpc=network.vpc,
    sg_alb=network.sg_alb,
    sg_backend=network.sg_backend,
    backend_ecr=shared.backend_ecr,
    env=env,
)
backend.add_dependency(shared)
backend.add_dependency(network)

# NOTE: Agent Service (ASG + Lambdas) is managed by the co-scientist-agents
# repo's own CloudFormation stack. Do NOT duplicate it here.

app.synth()
