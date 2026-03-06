from aws_cdk import (
    CfnOutput,
    Stack,
    aws_ec2 as ec2,
)
from constructs import Construct


class NetworkStack(Stack):
    """VPC, subnets, and security groups for the platform."""

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # --- VPC ---
        self.vpc = ec2.Vpc(
            self,
            "CoScientistVpc",
            vpc_name="co-scientist-vpc",
            max_azs=2,
            nat_gateways=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
            ],
        )

        # --- Security Groups ---
        self.sg_alb = ec2.SecurityGroup(
            self,
            "SgAlb",
            vpc=self.vpc,
            security_group_name="co-scientist-sg-alb",
            description="ALB - allow inbound HTTP/HTTPS from internet",
        )
        self.sg_alb.add_ingress_rule(
            ec2.Peer.any_ipv4(), ec2.Port.tcp(80), "HTTP from internet"
        )
        self.sg_alb.add_ingress_rule(
            ec2.Peer.any_ipv4(), ec2.Port.tcp(443), "HTTPS from internet"
        )

        self.sg_backend = ec2.SecurityGroup(
            self,
            "SgBackend",
            vpc=self.vpc,
            security_group_name="co-scientist-sg-backend",
            description="Backend EC2 - allow inbound 8000 from ALB",
        )
        self.sg_backend.add_ingress_rule(
            self.sg_alb, ec2.Port.tcp(8000), "Backend port from ALB"
        )

        self.sg_agents = ec2.SecurityGroup(
            self,
            "SgAgents",
            vpc=self.vpc,
            security_group_name="co-scientist-sg-agents",
            description="Agent containers - allow inbound 7777 from backend",
        )
        self.sg_agents.add_ingress_rule(
            self.sg_backend, ec2.Port.tcp(7777), "Agent port from backend"
        )

        # --- Outputs ---
        CfnOutput(self, "VpcId", value=self.vpc.vpc_id)
        CfnOutput(self, "SgAlbId", value=self.sg_alb.security_group_id)
        CfnOutput(self, "SgBackendId", value=self.sg_backend.security_group_id)
        CfnOutput(self, "SgAgentsId", value=self.sg_agents.security_group_id)
