"""
Security and performance middleware for the API
"""

import logging
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Dict

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple in-memory rate limiting middleware
    For production, use Redis-based solution
    """

    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests: Dict[str, list] = defaultdict(list)
        self.cleanup_interval = timedelta(minutes=5)
        self.last_cleanup = datetime.now(timezone.utc)

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)

        # Get client IP
        client_ip = request.client.host
        current_time = datetime.now(timezone.utc)

        # Cleanup old requests periodically
        if current_time - self.last_cleanup > self.cleanup_interval:
            self._cleanup_old_requests()
            self.last_cleanup = current_time

        # Check rate limit
        minute_ago = current_time - timedelta(minutes=1)
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip] if req_time > minute_ago
        ]

        if len(self.requests[client_ip]) >= self.requests_per_minute:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Trop de requêtes. Veuillez réessayer dans une minute.",
                    "retry_after": 60,
                },
            )

        # Record this request
        self.requests[client_ip].append(current_time)

        # Process request
        response = await call_next(request)
        return response

    def _cleanup_old_requests(self):
        """Remove requests older than 5 minutes"""
        cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=5)
        for ip in list(self.requests.keys()):
            self.requests[ip] = [
                req_time for req_time in self.requests[ip] if req_time > cutoff_time
            ]
            if not self.requests[ip]:
                del self.requests[ip]


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Log all requests with timing information
    """

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        # Log request
        logger.info(
            f"Request: {request.method} {request.url.path} "
            f"from {request.client.host}"
        )

        # Process request
        try:
            response = await call_next(request)
            process_time = (time.time() - start_time) * 1000

            # Add timing header
            response.headers["X-Process-Time"] = f"{process_time:.2f}ms"

            # Log response
            logger.info(f"Response: {response.status_code} " f"in {process_time:.2f}ms")

            return response
        except Exception as e:
            process_time = (time.time() - start_time) * 1000
            logger.error(f"Error: {str(e)} after {process_time:.2f}ms", exc_info=True)
            raise


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Add security headers to all responses.

    `FRAME_ANCESTORS` controls who may embed the app:
      - production default: 'self' (clickjacking protection)
      - development/preview: 'self' + any origin, so the live preview iframe
        and mobile-web wrappers keep working.
    """

    def __init__(self, app, frame_ancestors: str = "'self'"):
        super().__init__(app)
        self.frame_ancestors = frame_ancestors

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "img-src 'self' data: blob: https:; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "font-src 'self' data:; "
            "connect-src 'self' https:; "
            f"frame-ancestors {self.frame_ancestors};"
        )
        # X-Frame-Options is superseded by CSP frame-ancestors and blocks
        # legitimate embedding (preview iframes) — only allow same-origin.
        response.headers["X-Frame-Options"] = "SAMEORIGIN"

        return response


class CORSSecurityMiddleware(BaseHTTPMiddleware):
    """
    Enhanced CORS security with allowed origins validation
    """

    def __init__(self, app, allowed_origins: list):
        super().__init__(app)
        self.allowed_origins = allowed_origins

    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin")

        # Check if origin is allowed
        if origin and origin not in self.allowed_origins:
            logger.warning(f"Blocked request from unauthorized origin: {origin}")
            return JSONResponse(
                status_code=403, content={"detail": "Origin not allowed"}
            )

        return await call_next(request)
