"""
Kernel Policy Enforcement - Global Guardrails

This module provides a "kernel-level" policy layer that applies to *all* actions
regardless of the caller's per-key policy.

Design goals:
- Master retains control: can view/modify kernel policies.
- Kernel policies can hard-deny operators/endpoints/memory/discovery.
- Explicit "break-glass" bypass is possible only for MASTER.

NOTE: This is intentionally minimal and uses the existing Policy/PolicyEngine
primitives in security/policies.py.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple
import logging
import time

from .policies import (
    Policy,
    Permission,
    PermissionLevel,
    ResourceType,
    get_policy_engine,
)

logger = logging.getLogger(__name__)

KERNEL_POLICY_PREFIX = "kpol_"
DEFAULT_KERNEL_POLICY_ID = "kpol_default"


@dataclass(frozen=True)
class KernelDecision:
    allowed: bool
    reason: str
    policy_id: Optional[str] = None


class KernelPolicyEnforcer:
    """Global policy enforcement applied before side-effects."""

    def __init__(self):
        self._policy_engine = get_policy_engine()
        self._ensure_default_policy()

    def _ensure_default_policy(self) -> None:
        if DEFAULT_KERNEL_POLICY_ID in self._policy_engine._policies:
            return

        # Default kernel policy is an "allow-all" baseline with MASTER permissions.
        # Deny/allow lists (denied_operators/denied_endpoints/allowed_*) are the primary control knobs.
        p = Policy(
            policy_id=DEFAULT_KERNEL_POLICY_ID,
            name="Kernel Default",
            description="Kernel baseline policy (allow-all unless constrained).",
            permissions=[
                Permission(ResourceType.SYSTEM, None, PermissionLevel.MASTER),
                Permission(ResourceType.OPERATOR, None, PermissionLevel.MASTER),
                Permission(ResourceType.NETWORK, None, PermissionLevel.MASTER),
                Permission(ResourceType.SLOT, None, PermissionLevel.MASTER),
                Permission(ResourceType.AUDIT, None, PermissionLevel.MASTER),
                Permission(ResourceType.KEY, None, PermissionLevel.MASTER),
                Permission(ResourceType.POLICY, None, PermissionLevel.MASTER),
                Permission(ResourceType.USER, None, PermissionLevel.MASTER),
            ],
            created_by="system",
            created_at=time.time(),
            updated_at=time.time(),
            is_active=True,
        )
        self._policy_engine._policies[p.policy_id] = p

    def list_kernel_policies(self, active_only: bool = False) -> List[Policy]:
        policies = [
            p
            for pid, p in self._policy_engine._policies.items()
            if pid.startswith(KERNEL_POLICY_PREFIX)
        ]
        if active_only:
            policies = [p for p in policies if p.is_active]
        return policies

    async def _can_bypass(self, actor_policy_id: Optional[str], actor_context: Dict[str, Any]) -> bool:
        if not actor_policy_id:
            return False
        # Explicit break-glass flag only.
        if not actor_context.get("kernel_bypass"):
            return False
        allowed, _ = await self._policy_engine.check_access(
            actor_policy_id,
            ResourceType.SYSTEM,
            "kernel",
            PermissionLevel.MASTER,
            context={"ip": actor_context.get("ip")},
        )
        return allowed

    async def enforce_operator_invoke(
        self,
        operator_id: str,
        endpoint: str,
        method: str,
        *,
        actor_policy_id: Optional[str] = None,
        actor_context: Optional[Dict[str, Any]] = None,
    ) -> KernelDecision:
        """Enforce kernel policies for an operator invocation."""
        ctx = actor_context or {}

        if await self._can_bypass(actor_policy_id, ctx):
            return KernelDecision(True, "Kernel bypass granted", policy_id=None)

        # Transport invariant: require TLS for non-localhost endpoints.
        # This is enforced at the kernel boundary so operators/discovery cannot accidentally
        # send plaintext traffic over the public internet.
        if endpoint.startswith("http://") and not (
            endpoint.startswith("http://localhost")
            or endpoint.startswith("http://127.0.0.1")
            or endpoint.startswith("http://0.0.0.0")
        ):
            return KernelDecision(False, "Insecure transport: HTTPS required", policy_id=None)

        for p in self.list_kernel_policies(active_only=True):
            allowed, reason = await self._policy_engine.check_operator_access(
                p.policy_id,
                operator_id,
                context={"ip": ctx.get("ip")},
            )
            if not allowed:
                return KernelDecision(False, f"Denied by {p.policy_id}: {reason}", policy_id=p.policy_id)

            allowed, reason = await self._policy_engine.check_endpoint_access(
                p.policy_id,
                endpoint,
                method,
                context={"ip": ctx.get("ip")},
            )
            if not allowed:
                return KernelDecision(False, f"Denied by {p.policy_id}: {reason}", policy_id=p.policy_id)

        return KernelDecision(True, "Allowed")

    async def enforce_memory_store(
        self,
        memory_type: str,
        *,
        actor_policy_id: Optional[str] = None,
        actor_context: Optional[Dict[str, Any]] = None,
    ) -> KernelDecision:
        ctx = actor_context or {}

        if await self._can_bypass(actor_policy_id, ctx):
            return KernelDecision(True, "Kernel bypass granted", policy_id=None)

        resource_id = f"memory:{memory_type}"
        for p in self.list_kernel_policies(active_only=True):
            allowed, reason = await self._policy_engine.check_access(
                p.policy_id,
                ResourceType.SYSTEM,
                resource_id,
                PermissionLevel.WRITE,
                context={"ip": ctx.get("ip")},
            )
            if not allowed:
                return KernelDecision(False, f"Denied by {p.policy_id}: {reason}", policy_id=p.policy_id)

        return KernelDecision(True, "Allowed")

    async def enforce_discovery_register(
        self,
        *,
        capability_type: str,
        endpoint: str,
        method: str,
        actor_policy_id: Optional[str] = None,
        actor_context: Optional[Dict[str, Any]] = None,
    ) -> KernelDecision:
        ctx = actor_context or {}

        if await self._can_bypass(actor_policy_id, ctx):
            return KernelDecision(True, "Kernel bypass granted", policy_id=None)

        if endpoint.startswith("http://") and not (
            endpoint.startswith("http://localhost")
            or endpoint.startswith("http://127.0.0.1")
            or endpoint.startswith("http://0.0.0.0")
        ):
            return KernelDecision(False, "Insecure transport: HTTPS required", policy_id=None)

        resource_id = f"discovery:{capability_type}"
        for p in self.list_kernel_policies(active_only=True):
            allowed, reason = await self._policy_engine.check_access(
                p.policy_id,
                ResourceType.SYSTEM,
                resource_id,
                PermissionLevel.EXECUTE,
                context={"ip": ctx.get("ip")},
            )
            if not allowed:
                return KernelDecision(False, f"Denied by {p.policy_id}: {reason}", policy_id=p.policy_id)

            allowed, reason = await self._policy_engine.check_endpoint_access(
                p.policy_id,
                endpoint,
                method,
                context={"ip": ctx.get("ip")},
            )
            if not allowed:
                return KernelDecision(False, f"Denied by {p.policy_id}: {reason}", policy_id=p.policy_id)

        return KernelDecision(True, "Allowed")


_enforcer: Optional[KernelPolicyEnforcer] = None


def get_kernel_enforcer() -> KernelPolicyEnforcer:
    global _enforcer
    if _enforcer is None:
        _enforcer = KernelPolicyEnforcer()
    return _enforcer
