from aws_cdk import (
    CfnOutput,
    Stack,
    aws_cognito as cognito,
)
from constructs import Construct


class AuthStack(Stack):
    """Cognito User Pool for authentication."""

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # --- Cognito User Pool ---
        self.user_pool = cognito.UserPool(
            self,
            "UserPool",
            user_pool_name="co-scientist-users",
            self_sign_up_enabled=True,
            sign_in_aliases=cognito.SignInAliases(email=True),
            auto_verify=cognito.AutoVerifiedAttrs(email=True),
            password_policy=cognito.PasswordPolicy(
                min_length=8,
                require_uppercase=True,
                require_lowercase=True,
                require_digits=True,
                require_symbols=False,
            ),
            mfa=cognito.Mfa.OPTIONAL,
            mfa_second_factor=cognito.MfaSecondFactor(otp=True, sms=False),
            account_recovery=cognito.AccountRecovery.EMAIL_ONLY,
            standard_attributes=cognito.StandardAttributes(
                email=cognito.StandardAttribute(required=True, mutable=True),
                fullname=cognito.StandardAttribute(required=False, mutable=True),
            ),
        )

        # --- App Client ---
        self.app_client = self.user_pool.add_client(
            "SpaClient",
            user_pool_client_name="co-scientist-spa",
            auth_flows=cognito.AuthFlow(
                user_srp=True,
                user_password=True,
            ),
            o_auth=cognito.OAuthSettings(
                flows=cognito.OAuthFlows(
                    implicit_code_grant=True,
                    authorization_code_grant=True,
                ),
                scopes=[
                    cognito.OAuthScope.OPENID,
                    cognito.OAuthScope.EMAIL,
                    cognito.OAuthScope.PROFILE,
                ],
                callback_urls=[
                    "https://www.ai-co-scientist-app.synapsis-analytics.com/callback",
                    "http://localhost:5173/callback",
                ],
                logout_urls=[
                    "https://www.ai-co-scientist-app.synapsis-analytics.com",
                    "http://localhost:5173",
                ],
            ),
            generate_secret=False,
            prevent_user_existence_errors=True,
        )

        # --- Cognito Domain ---
        self.user_pool.add_domain(
            "CognitoDomain",
            cognito_domain=cognito.CognitoDomainOptions(
                domain_prefix="co-scientist-cgiar",
            ),
        )

        # --- Outputs ---
        CfnOutput(self, "UserPoolId", value=self.user_pool.user_pool_id)
        CfnOutput(self, "UserPoolArn", value=self.user_pool.user_pool_arn)
        CfnOutput(self, "AppClientId", value=self.app_client.user_pool_client_id)
        CfnOutput(
            self,
            "CognitoDomainUrl",
            value=f"co-scientist-cgiar.auth.{self.region}.amazoncognito.com",
        )
