"""
Security Tests - Test suite for security layer

Tests for authentication, authorization, keys, and policies.
"""

from ..framework import test, suite, TestCategory, Assertions
from ...security.policies import (
    Policy, Permission, PermissionLevel, ResourceType,
    PolicyEngine, RateLimit, Restriction,
)
from ...security.keys import APIKey, KeyScope, KeyStatus, KeyManager
from ...security.auth import AuthToken, AuthContext, AuthGateway


# Create security test suite
security_suite = suite("security", TestCategory.SECURITY)


# ============================================================================
# Policy Tests
# ============================================================================

@test("security", "policy_creation")
async def test_policy_creation(assert_: Assertions):
    """Test policy creation and registration"""
    engine = PolicyEngine()
    
    policy = Policy(
        policy_id="test_policy",
        name="Test Policy",
        description="A test policy",
    )
    policy.permissions.append(Permission(
        resource_type=ResourceType.OPERATOR,
        resource_id="*",
        level=PermissionLevel.EXECUTE,
    ))
    
    engine.register_policy(policy)
    
    retrieved = engine.get_policy("test_policy")
    assert_.not_none(retrieved, "Policy should be retrievable")
    assert_.equal(retrieved.name, "Test Policy")
    assert_.equal(len(retrieved.permissions), 1)


@test("security", "permission_check")
async def test_permission_check(assert_: Assertions):
    """Test permission level checking"""
    engine = PolicyEngine()
    
    policy = Policy(policy_id="perm_test")
    policy.permissions.append(Permission(
        resource_type=ResourceType.SLOT,
        resource_id="slot_1",
        level=PermissionLevel.WRITE,
    ))
    
    engine.register_policy(policy)
    
    # Should have WRITE access
    assert_.true(
        engine.check_permission(
            "perm_test",
            ResourceType.SLOT,
            "slot_1",
            PermissionLevel.WRITE,
        )
    )
    
    # Should have READ access (lower than WRITE)
    assert_.true(
        engine.check_permission(
            "perm_test",
            ResourceType.SLOT,
            "slot_1",
            PermissionLevel.READ,
        )
    )
    
    # Should NOT have ADMIN access (higher than WRITE)
    assert_.false(
        engine.check_permission(
            "perm_test",
            ResourceType.SLOT,
            "slot_1",
            PermissionLevel.ADMIN,
        )
    )


@test("security", "wildcard_permissions")
async def test_wildcard_permissions(assert_: Assertions):
    """Test wildcard resource permissions"""
    engine = PolicyEngine()
    
    policy = Policy(policy_id="wildcard_test")
    policy.permissions.append(Permission(
        resource_type=ResourceType.OPERATOR,
        resource_id="*",  # Wildcard
        level=PermissionLevel.EXECUTE,
    ))
    
    engine.register_policy(policy)
    
    # Should work for any operator
    assert_.true(
        engine.check_permission(
            "wildcard_test",
            ResourceType.OPERATOR,
            "any_operator",
            PermissionLevel.EXECUTE,
        )
    )
    
    assert_.true(
        engine.check_permission(
            "wildcard_test",
            ResourceType.OPERATOR,
            "another_operator",
            PermissionLevel.EXECUTE,
        )
    )


@test("security", "rate_limit_config")
async def test_rate_limit_config(assert_: Assertions):
    """Test rate limit configuration"""
    rate_limit = RateLimit(
        requests_per_minute=60,
        requests_per_hour=1000,
        requests_per_day=10000,
        max_concurrent=10,
    )
    
    assert_.equal(rate_limit.requests_per_minute, 60)
    assert_.equal(rate_limit.max_concurrent, 10)


# ============================================================================
# Key Tests
# ============================================================================

@test("security", "key_creation")
async def test_key_creation(assert_: Assertions):
    """Test API key creation"""
    manager = KeyManager()
    
    key, raw_key = await manager.create_key(
        scope=KeyScope.USER,
        owner_id="test_owner",
        policy_id="default_user",
    )
    
    assert_.not_none(key)
    assert_.not_none(raw_key)
    assert_.true(raw_key.startswith("fgk_user_"))
    assert_.equal(key.scope, KeyScope.USER)
    assert_.equal(key.owner_id, "test_owner")
    assert_.equal(key.status, KeyStatus.ACTIVE)


@test("security", "key_verification")
async def test_key_verification(assert_: Assertions):
    """Test API key verification"""
    manager = KeyManager()
    
    key, raw_key = await manager.create_key(
        scope=KeyScope.SERVICE,
        owner_id="service_owner",
    )
    
    # Verify with correct key
    verified = await manager.verify_key(raw_key)
    assert_.not_none(verified, "Key should verify successfully")
    assert_.equal(verified.key_id, key.key_id)
    
    # Verify with wrong key
    invalid = await manager.verify_key("fgk_service_invalid123")
    assert_.none(invalid, "Invalid key should not verify")


@test("security", "key_revocation")
async def test_key_revocation(assert_: Assertions):
    """Test API key revocation"""
    manager = KeyManager()
    
    key, raw_key = await manager.create_key(
        scope=KeyScope.USER,
        owner_id="revoke_test",
    )
    
    # Revoke key
    success = await manager.revoke_key(key.key_id)
    assert_.true(success)
    
    # Should not verify after revocation
    verified = await manager.verify_key(raw_key)
    assert_.none(verified, "Revoked key should not verify")


@test("security", "key_suspension")
async def test_key_suspension(assert_: Assertions):
    """Test key suspension and reactivation"""
    manager = KeyManager()
    
    key, raw_key = await manager.create_key(
        scope=KeyScope.USER,
        owner_id="suspend_test",
    )
    
    # Suspend
    await manager.suspend_key(key.key_id, "Testing suspension")
    suspended = manager._keys[key.key_id]
    assert_.equal(suspended.status, KeyStatus.SUSPENDED)
    
    # Should not verify while suspended
    verified = await manager.verify_key(raw_key)
    assert_.none(verified)
    
    # Reactivate
    await manager.reactivate_key(key.key_id)
    reactivated = manager._keys[key.key_id]
    assert_.equal(reactivated.status, KeyStatus.ACTIVE)
    
    # Should verify after reactivation
    verified = await manager.verify_key(raw_key)
    assert_.not_none(verified)


@test("security", "key_rotation")
async def test_key_rotation(assert_: Assertions):
    """Test key rotation"""
    manager = KeyManager()
    
    old_key, old_raw = await manager.create_key(
        scope=KeyScope.SERVICE,
        owner_id="rotate_test",
    )
    
    # Rotate key
    new_key, new_raw = await manager.rotate_key(old_key.key_id)
    
    assert_.not_none(new_key)
    assert_.not_equal(old_raw, new_raw)
    assert_.equal(new_key.owner_id, old_key.owner_id)
    assert_.equal(new_key.scope, old_key.scope)
    
    # Old key should be revoked
    old_verified = await manager.verify_key(old_raw)
    assert_.none(old_verified)
    
    # New key should work
    new_verified = await manager.verify_key(new_raw)
    assert_.not_none(new_verified)


# ============================================================================
# Auth Tests
# ============================================================================

@test("security", "token_encoding")
async def test_token_encoding(assert_: Assertions):
    """Test JWT token encoding and decoding"""
    token = AuthToken(
        key_id="key_123",
        owner_id="owner_456",
        scope="user",
        permissions=["read", "execute"],
    )
    
    encoded = token.encode("test-secret")
    assert_.not_none(encoded)
    assert_.true(len(encoded) > 50)
    
    # Decode
    decoded = AuthToken.decode(encoded, "test-secret")
    assert_.not_none(decoded)
    assert_.equal(decoded.key_id, "key_123")
    assert_.equal(decoded.owner_id, "owner_456")
    assert_.equal(decoded.scope, "user")


@test("security", "token_expiration")
async def test_token_expiration(assert_: Assertions):
    """Test token expiration handling"""
    # Create expired token
    import time
    token = AuthToken(
        key_id="expired_key",
        owner_id="owner",
        scope="user",
        expires_at=time.time() - 100,  # Expired 100 seconds ago
    )
    
    assert_.true(token.is_expired())


@test("security", "auth_gateway")
async def test_auth_gateway(assert_: Assertions):
    """Test authentication gateway"""
    from ...security.keys import get_key_manager
    from ...security.policies import get_policy_engine
    
    keys = KeyManager()
    policies = PolicyEngine()
    
    # Register a policy
    policy = Policy(
        policy_id="test_user",
        name="Test User",
    )
    policy.permissions.append(Permission(
        resource_type=ResourceType.OPERATOR,
        resource_id="*",
        level=PermissionLevel.EXECUTE,
    ))
    policies.register_policy(policy)
    
    # Create gateway
    gateway = AuthGateway(
        key_manager=keys,
        policy_engine=policies,
        jwt_secret="test-secret",
    )
    
    # Create a key
    key, raw_key = await keys.create_key(
        scope=KeyScope.USER,
        owner_id="gateway_test",
        policy_id="test_user",
    )
    
    # Authenticate
    context = await gateway.authenticate(raw_key)
    
    assert_.true(context.is_authenticated)
    assert_.equal(context.owner_id, "gateway_test")
    assert_.equal(context.scope, "user")


@test("security", "authorization_check")
async def test_authorization_check(assert_: Assertions):
    """Test authorization checking"""
    keys = KeyManager()
    policies = PolicyEngine()
    
    # Setup policy with specific permissions
    policy = Policy(policy_id="limited_user")
    policy.permissions.append(Permission(
        resource_type=ResourceType.SLOT,
        resource_id="*",
        level=PermissionLevel.READ,
    ))
    policies.register_policy(policy)
    
    gateway = AuthGateway(
        key_manager=keys,
        policy_engine=policies,
        jwt_secret="test-secret",
    )
    
    # Create key with limited policy
    key, raw_key = await keys.create_key(
        scope=KeyScope.READONLY,
        owner_id="limited_user",
        policy_id="limited_user",
    )
    
    # Authenticate
    context = await gateway.authenticate(raw_key)
    
    # Should have READ access to slots
    can_read = await gateway.authorize(
        context,
        ResourceType.SLOT,
        "any_slot",
        PermissionLevel.READ,
    )
    assert_.true(can_read)
    
    # Should NOT have WRITE access
    can_write = await gateway.authorize(
        context,
        ResourceType.SLOT,
        "any_slot",
        PermissionLevel.WRITE,
    )
    assert_.false(can_write)
