import time
from typing import Any, Dict

import httpx
from jose import JWTError, jwt
from jose.exceptions import ExpiredSignatureError, JWTClaimsError

from app.config import settings

_jwks_cache: Dict[str, Any] = {}
_jwks_cache_time: float = 0.0
_JWKS_CACHE_TTL = 3600  # 1 hour


async def _get_jwks() -> Dict[str, Any]:
    """Download and cache JWKS from Cognito with 1-hour TTL."""
    global _jwks_cache, _jwks_cache_time

    now = time.time()
    if _jwks_cache and (now - _jwks_cache_time) < _JWKS_CACHE_TTL:
        return _jwks_cache

    jwks_url = settings.get_jwks_url()
    async with httpx.AsyncClient() as client:
        response = await client.get(jwks_url, timeout=10.0)
        response.raise_for_status()
        _jwks_cache = response.json()
        _jwks_cache_time = now

    return _jwks_cache


async def verify_cognito_token(token: str) -> Dict[str, Any]:
    """Validate a JWT token issued by Cognito.

    Returns the decoded claims including sub, email, and cognito:groups.

    Raises:
        ExpiredSignatureError: Token has expired.
        JWTClaimsError: Token claims are invalid.
        JWTError: Token is malformed or signature is invalid.
    """
    jwks = await _get_jwks()

    # Extract the key ID from the token header
    unverified_header = jwt.get_unverified_header(token)
    kid = unverified_header.get("kid")

    # Find the matching key
    rsa_key: Dict[str, str] = {}
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            rsa_key = {
                "kty": key["kty"],
                "kid": key["kid"],
                "use": key["use"],
                "n": key["n"],
                "e": key["e"],
            }
            break

    if not rsa_key:
        raise JWTError("Unable to find matching key in JWKS")

    issuer = f"https://cognito-idp.{settings.AWS_REGION}.amazonaws.com/{settings.COGNITO_USER_POOL_ID}"

    claims = jwt.decode(
        token,
        rsa_key,
        algorithms=["RS256"],
        audience=settings.COGNITO_CLIENT_ID,
        issuer=issuer,
    )

    return {
        "sub": claims.get("sub"),
        "email": claims.get("email"),
        "cognito:groups": claims.get("cognito:groups", []),
        "name": claims.get("name", claims.get("email", "")),
    }
