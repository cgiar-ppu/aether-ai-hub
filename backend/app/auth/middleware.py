from typing import Optional

from fastapi import Header, HTTPException
from jose import JWTError
from jose.exceptions import ExpiredSignatureError, JWTClaimsError

from app.auth.cognito import verify_cognito_token
from app.models import User


async def get_current_user(authorization: str = Header(...)) -> User:
    """Extract and validate the Bearer token, returning the authenticated user.

    Raises HTTPException 401 if the token is missing, expired, or invalid.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    token = authorization[len("Bearer "):]

    try:
        claims = await verify_cognito_token(token)
    except (ExpiredSignatureError, JWTClaimsError, JWTError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return User(
        id=claims["sub"],
        email=claims["email"],
        name=claims.get("name", ""),
        role="admin" if "admins" in claims.get("cognito:groups", []) else "user",
        groups=claims.get("cognito:groups", []),
    )


async def get_optional_user(
    authorization: Optional[str] = Header(None),
) -> Optional[User]:
    """Return the authenticated user if a valid token is provided, otherwise None."""
    if not authorization:
        return None
    try:
        return await get_current_user(authorization)
    except HTTPException:
        return None
