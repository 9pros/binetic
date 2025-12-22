"""
Infrastructure Module - Cloud Provider Adapters

Provides adapters for Cloudflare and other infrastructure.
"""

from .cloudflare import (
    KVAdapter,
    D1Adapter,
    R2Adapter,
    CloudflareEnv,
    handle_request,
)

__all__ = [
    "KVAdapter",
    "D1Adapter",
    "R2Adapter",
    "CloudflareEnv",
    "handle_request",
]
