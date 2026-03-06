from aws_cdk import (
    CfnOutput,
    Duration,
    Stack,
    aws_ec2 as ec2,
    aws_ecr as ecr,
    aws_elasticloadbalancingv2 as elbv2,
    aws_elasticloadbalancingv2_targets as targets,
    aws_iam as iam,
)
from constructs import Construct


class BackendStack(Stack):
    """EC2 backend instance behind an internet-facing ALB."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc: ec2.IVpc,
        sg_alb: ec2.ISecurityGroup,
        sg_backend: ec2.ISecurityGroup,
        backend_ecr: ecr.IRepository,
        **kwargs,
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # --- IAM Role for Backend EC2 ---
        role = iam.Role(
            self,
            "BackendRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AmazonDynamoDBFullAccess"
                ),
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AmazonS3FullAccess"
                ),
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "CloudWatchLogsFullAccess"
                ),
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AmazonSSMManagedInstanceCore"
                ),
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AmazonEC2ContainerRegistryReadOnly"
                ),
            ],
        )
        role.add_to_policy(
            iam.PolicyStatement(
                actions=["lambda:InvokeFunction"],
                resources=[
                    f"arn:aws:lambda:{self.region}:{self.account}:function:co-scientist-*"
                ],
            )
        )

        # --- User Data Script ---
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "yum install -y docker",
            "systemctl start docker",
            "systemctl enable docker",
            "usermod -aG docker ec2-user",
            # Login to ECR
            f"aws ecr get-login-password --region {self.region} | docker login --username AWS --password-stdin {self.account}.dkr.ecr.{self.region}.amazonaws.com",
            # Pull and run backend
            f"docker pull {backend_ecr.repository_uri}:latest",
            f"docker run -d --name backend -p 8000:8000 --restart unless-stopped {backend_ecr.repository_uri}:latest",
        )

        # --- EC2 Instance ---
        self.instance = ec2.Instance(
            self,
            "BackendInstance",
            instance_type=ec2.InstanceType("t3.small"),
            machine_image=ec2.AmazonLinuxImage(
                generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023,
            ),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_group=sg_backend,
            role=role,
            user_data=user_data,
        )

        # --- ALB ---
        self.alb = elbv2.ApplicationLoadBalancer(
            self,
            "BackendAlb",
            vpc=vpc,
            internet_facing=True,
            security_group=sg_alb,
            load_balancer_name="co-scientist-backend-alb",
        )

        # Target Group
        target_group = elbv2.ApplicationTargetGroup(
            self,
            "BackendTargetGroup",
            vpc=vpc,
            port=8000,
            protocol=elbv2.ApplicationProtocol.HTTP,
            targets=[targets.InstanceTarget(self.instance, port=8000)],
            health_check=elbv2.HealthCheck(
                path="/api/health",
                interval=Duration.seconds(30),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3,
            ),
            target_group_name="co-scientist-backend-tg",
        )

        # Listener
        self.alb.add_listener(
            "HttpListener",
            port=80,
            default_target_groups=[target_group],
        )

        # --- Outputs ---
        CfnOutput(
            self,
            "AlbDnsName",
            value=self.alb.load_balancer_dns_name,
            description="ALB DNS name - configure in Amplify as /api/* proxy target",
        )
        CfnOutput(self, "InstanceId", value=self.instance.instance_id)
