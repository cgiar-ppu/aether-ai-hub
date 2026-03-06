from aws_cdk import (
    CfnOutput,
    Duration,
    Stack,
    aws_autoscaling as autoscaling,
    aws_ec2 as ec2,
    aws_ecr as ecr,
    aws_elasticloadbalancingv2 as elbv2,
    aws_events as events,
    aws_events_targets as events_targets,
    aws_iam as iam,
    aws_lambda as _lambda,
)
from constructs import Construct


PROVISION_HANDLER = """\
import json
import boto3
import time

ssm = boto3.client("ssm")
ec2_client = boto3.client("ec2")
dynamodb = boto3.resource("dynamodb")


def handler(event, context):
    user_id = event["user_id"]
    session_id = event["session_id"]

    # Find an instance with capacity (< 3 containers)
    response = ec2_client.describe_instances(
        Filters=[
            {"Name": "tag:aws:autoscaling:groupName", "Values": ["co-scientist-agents-asg"]},
            {"Name": "instance-state-name", "Values": ["running"]},
        ]
    )

    target_instance = None
    for reservation in response["Reservations"]:
        for instance in reservation["Instances"]:
            target_instance = instance
            break
        if target_instance:
            break

    if not target_instance:
        return {"statusCode": 503, "body": "No available instances"}

    instance_id = target_instance["InstanceId"]
    private_ip = target_instance["PrivateIpAddress"]

    # Run container via SSM
    container_name = f"agent-{session_id[:8]}"
    port = 7777 + hash(session_id) % 1000

    cmd = f"docker run -d --name {container_name} -p {port}:7777 co-scientist-agents:latest"
    ssm.send_command(
        InstanceIds=[instance_id],
        DocumentName="AWS-RunShellScript",
        Parameters={"commands": [cmd]},
    )

    time.sleep(2)

    container_url = f"{private_ip}:{port}"

    # Save to DynamoDB
    table = dynamodb.Table("co-scientist-sessions")
    table.put_item(Item={
        "session_id": session_id,
        "user_id": user_id,
        "container_url": container_url,
        "container_id": container_name,
        "instance_id": instance_id,
        "status": "active",
        "created_at": str(int(time.time())),
    })

    return {
        "container_url": container_url,
        "container_id": container_name,
        "instance_id": instance_id,
    }
"""

DEPROVISION_HANDLER = """\
import json
import boto3

ssm = boto3.client("ssm")
dynamodb = boto3.resource("dynamodb")


def handler(event, context):
    session_id = event["session_id"]
    table = dynamodb.Table("co-scientist-sessions")

    response = table.get_item(Key={"session_id": session_id})
    item = response.get("Item")
    if not item:
        return {"status": "not_found"}

    instance_id = item.get("instance_id")
    container_id = item.get("container_id")

    if instance_id and container_id:
        cmd = f"docker stop {container_id} && docker rm {container_id}"
        ssm.send_command(
            InstanceIds=[instance_id],
            DocumentName="AWS-RunShellScript",
            Parameters={"commands": [cmd]},
        )

    table.update_item(
        Key={"session_id": session_id},
        UpdateExpression="SET #s = :s",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":s": "terminated"},
    )

    return {"status": "terminated"}
"""

STATUS_HANDLER = """\
import json
import boto3
import time

dynamodb = boto3.resource("dynamodb")


def handler(event, context):
    session_id = event["session_id"]
    table = dynamodb.Table("co-scientist-sessions")

    response = table.get_item(Key={"session_id": session_id})
    item = response.get("Item")
    if not item:
        return {"status": "not_found"}

    created = int(item.get("created_at", 0))
    uptime = int(time.time()) - created if created else 0

    return {
        "status": item.get("status", "unknown"),
        "container_url": item.get("container_url"),
        "uptime": uptime,
    }
"""

CLEANUP_HANDLER = """\
import json
import boto3
import time

ssm = boto3.client("ssm")
dynamodb = boto3.resource("dynamodb")


def handler(event, context):
    table = dynamodb.Table("co-scientist-sessions")
    now = int(time.time())
    threshold = now - 1800  # 30 minutes

    response = table.scan(
        FilterExpression="#s = :active",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":active": "active"},
    )

    cleaned = 0
    for item in response.get("Items", []):
        created = int(item.get("created_at", 0))
        if created < threshold:
            instance_id = item.get("instance_id")
            container_id = item.get("container_id")
            session_id = item["session_id"]

            if instance_id and container_id:
                try:
                    ssm.send_command(
                        InstanceIds=[instance_id],
                        DocumentName="AWS-RunShellScript",
                        Parameters={"commands": [f"docker stop {container_id} && docker rm {container_id}"]},
                    )
                except Exception:
                    pass

            table.update_item(
                Key={"session_id": session_id},
                UpdateExpression="SET #s = :s",
                ExpressionAttributeNames={"#s": "status"},
                ExpressionAttributeValues={":s": "terminated"},
            )
            cleaned += 1

    return {"cleaned": cleaned}
"""


class AgentServiceStack(Stack):
    """Agent Service: ASG with Spot instances + Lambda orchestration."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc: ec2.IVpc,
        sg_agents: ec2.ISecurityGroup,
        sg_backend: ec2.ISecurityGroup,
        agents_ecr: ecr.IRepository,
        **kwargs,
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # --- IAM Role for Agent EC2 instances ---
        agent_role = iam.Role(
            self,
            "AgentInstanceRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AmazonSSMManagedInstanceCore"
                ),
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AmazonEC2ContainerRegistryReadOnly"
                ),
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "CloudWatchLogsFullAccess"
                ),
            ],
        )

        # --- User Data ---
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "yum install -y docker",
            "systemctl start docker",
            "systemctl enable docker",
            "usermod -aG docker ec2-user",
            f"aws ecr get-login-password --region {self.region} | docker login --username AWS --password-stdin {self.account}.dkr.ecr.{self.region}.amazonaws.com",
            f"docker pull {agents_ecr.repository_uri}:latest",
        )

        # --- Launch Template ---
        launch_template = ec2.LaunchTemplate(
            self,
            "AgentLaunchTemplate",
            instance_type=ec2.InstanceType("t4g.xlarge"),
            machine_image=ec2.AmazonLinuxImage(
                generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023,
                cpu_type=ec2.AmazonLinuxCpuType.ARM_64,
            ),
            role=agent_role,
            security_group=sg_agents,
            user_data=user_data,
        )

        # --- ASG ---
        self.asg = autoscaling.AutoScalingGroup(
            self,
            "AgentAsg",
            auto_scaling_group_name="co-scientist-agents-asg",
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            mixed_instances_policy=autoscaling.MixedInstancesPolicy(
                instances_distribution=autoscaling.InstancesDistribution(
                    on_demand_percentage_above_base_capacity=0,
                    spot_allocation_strategy=autoscaling.SpotAllocationStrategy.CAPACITY_OPTIMIZED,
                ),
                launch_template=launch_template,
                launch_template_overrides=[
                    autoscaling.LaunchTemplateOverrides(
                        instance_type=ec2.InstanceType("t4g.xlarge")
                    ),
                    autoscaling.LaunchTemplateOverrides(
                        instance_type=ec2.InstanceType("t4g.2xlarge")
                    ),
                ],
            ),
            min_capacity=0,
            max_capacity=5,
            desired_capacity=0,
        )

        # --- Lambda IAM Role ---
        lambda_role = iam.Role(
            self,
            "LambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                ),
            ],
        )
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "ssm:SendCommand",
                    "ssm:GetCommandInvocation",
                ],
                resources=["*"],
            )
        )
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "ec2:DescribeInstances",
                ],
                resources=["*"],
            )
        )
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:Scan",
                ],
                resources=[
                    f"arn:aws:dynamodb:{self.region}:{self.account}:table/co-scientist-sessions",
                ],
            )
        )
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                actions=["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
                resources=["*"],
            )
        )

        # --- Lambda: Provision ---
        provision_fn = _lambda.Function(
            self,
            "ProvisionFunction",
            function_name="co-scientist-provision",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="index.handler",
            code=_lambda.Code.from_inline(PROVISION_HANDLER),
            role=lambda_role,
            timeout=Duration.seconds(60),
            memory_size=256,
        )

        # --- Lambda: Deprovision ---
        deprovision_fn = _lambda.Function(
            self,
            "DeprovisionFunction",
            function_name="co-scientist-deprovision",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="index.handler",
            code=_lambda.Code.from_inline(DEPROVISION_HANDLER),
            role=lambda_role,
            timeout=Duration.seconds(30),
            memory_size=256,
        )

        # --- Lambda: Status ---
        status_fn = _lambda.Function(
            self,
            "StatusFunction",
            function_name="co-scientist-status",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="index.handler",
            code=_lambda.Code.from_inline(STATUS_HANDLER),
            role=lambda_role,
            timeout=Duration.seconds(10),
            memory_size=128,
        )

        # --- Lambda: Cleanup (scheduled) ---
        cleanup_fn = _lambda.Function(
            self,
            "CleanupFunction",
            function_name="co-scientist-cleanup",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="index.handler",
            code=_lambda.Code.from_inline(CLEANUP_HANDLER),
            role=lambda_role,
            timeout=Duration.seconds(120),
            memory_size=256,
        )

        # EventBridge rule: every 15 minutes
        events.Rule(
            self,
            "CleanupSchedule",
            schedule=events.Schedule.rate(Duration.minutes(15)),
            targets=[events_targets.LambdaFunction(cleanup_fn)],
        )

        # --- Internal ALB for agent containers ---
        internal_alb = elbv2.ApplicationLoadBalancer(
            self,
            "AgentInternalAlb",
            vpc=vpc,
            internet_facing=False,
            security_group=sg_agents,
            load_balancer_name="co-scientist-agents-alb",
        )

        CfnOutput(
            self,
            "InternalAlbDns",
            value=internal_alb.load_balancer_dns_name,
            description="Internal ALB for agent containers",
        )
        CfnOutput(self, "AsgName", value=self.asg.auto_scaling_group_name)
        CfnOutput(self, "ProvisionFunctionArn", value=provision_fn.function_arn)
        CfnOutput(self, "CleanupFunctionArn", value=cleanup_fn.function_arn)
