"""
Exception Handling
------------------
Standardized error generation and formatting.
"""

from typing import Optional, Dict, Any
from fastapi import HTTPException
from fastapi.responses import JSONResponse
from fastapi import Request

def raise_error(status_code: int, message: str, headers: Optional[Dict[str, Any]] = None):
    """
    Standardize HTTP error responses across the application.
    Returns:
    {
      "error": {
        "code": status_code,
        "message": message
      }
    }
    """
    raise HTTPException(
        status_code=status_code,
        detail={"error": {"code": status_code, "message": message}},
        headers=headers
    )

async def custom_http_exception_handler(request: Request, exc: HTTPException):
    """
    Format FastAPI HTTPExceptions to our preferred structure.
    Overrides default FastAPI text/detail mechanism.
    """
    headers = getattr(exc, "headers", None)
    
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content=exc.detail, headers=headers)
    
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.status_code, "message": exc.detail}},
        headers=headers
    )
