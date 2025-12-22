"""Security tests aligned with current security APIs.

These tests focus on in-memory behavior (no external storage adapters).
"""

import time

from tests.framework import test, suite, TestCategory, Assertions

from security.policies import PolicyEngine, Permission, PermissionLevel, ResourceType
from security.keys import KeyManager, KeyScope, KeyStatus
from security.auth import AuthGateway, AuthToken


security_suite = suite("security", TestCategory.SECURITY)


@test("security", "policy_engine_create_and_check_access")
async def test_policy_engine_create_and_check_access(assert_: Assertions):
    engine = PolicyEngine()

    policy = await engine.create_policy(
        name="Test Policy",
        permissions=[Permission(ResourceType.SLOT, None, PermissionLevel.READ)],
        created_by="tests",
    )

    allowed, _ = await engine.check_access(
        policy.policy_id,
        ResourceType.SLOT,
        "slot_1",
        PermissionLevel.READ,
        context={"ip": "127.0.0.1"},
    )
    assert_.true(allowed)

    denied, _ = await engine.check_access(
        policy.policy_id,
        ResourceType.SLOT,
        "slot_1",
        PermissionLevel.WRITE,
        context={"ip": "127.0.0.1"},
    )
    assert_.false(denied)


@test("security", "key_lifecycle_create_verify_revoke")
async def test_key_lifecycle_create_verify_revoke(assert_: Assertions):
    manager = KeyManager()

    key, raw_key = await manager.create_key(
        owner_id="test_owner",
        scope=KeyScope.USER,
        policy_id="pol_user",
    )

    assert_.not_none(key)
    assert_.true(raw_key.startswith("bnk_user_"))
    assert_.equal(key.status, KeyStatus.ACTIVE)

    verified, msg = await manager.verify_key(raw_key)
    assert_.equal(msg, "OK")
    assert_.not_none(verified)
    assert_.equal(verified.key_id, key.key_id)

    success = await manager.revoke_key(key.key_id)
    assert_.true(success)

    verified2, msg2 = await manager.verify_key(raw_key)
    assert_.none(verified2)
    assert_.true(msg2.lower() != "ok")


@test("security", "key_suspension_and_reactivation")
async def test_key_suspension_and_reactivation(assert_: Assertions):
    manager = KeyManager()
    key, raw_key = await manager.create_key(owner_id="suspend_test", scope=KeyScope.USER)

    ok = await manager.suspend_key(key.key_id)
    assert_.true(ok)

    verified, _ = await manager.verify_key(raw_key)
    assert_.none(verified)

    ok2 = await manager.reactivate_key(key.key_id)
    assert_.true(ok2)

    verified2, msg2 = await manager.verify_key(raw_key)
    assert_.equal(msg2, "OK")
    assert_.not_none(verified2)


@test("security", "key_rotation")
async def test_key_rotation(assert_: Assertions):
    manager = KeyManager()
    old_key, old_raw = await manager.create_key(owner_id="rotate_test", scope=KeyScope.SERVICE)

    new_key, new_raw = await manager.rotate_key(old_key.key_id)
    assert_.not_none(new_key)
    assert_.not_none(new_raw)
    assert_.not_equal(old_raw, new_raw)

    old_verified, _ = await manager.verify_key(old_raw)
    assert_.none(old_verified)

    new_verified, msg = await manager.verify_key(new_raw)
    assert_.equal(msg, "OK")
    assert_.not_none(new_verified)


@test("security", "auth_token_encode_decode")
async def test_auth_token_encode_decode(assert_: Assertions):
    now = time.time()
    token = AuthToken(
        token_id="tok_1",
        key_id="key_1",
        owner_id="owner_1",
        policy_id="pol_user",
        issued_at=now,
        expires_at=now + 60,
        scope="user",
    )

    encoded = token.encode(secret="test-secret")
    decoded = AuthToken.decode(encoded, secret="test-secret")

    assert_.not_none(decoded)
    assert_.equal(decoded.key_id, "key_1")
    assert_.equal(decoded.owner_id, "owner_1")


@test("security", "auth_gateway_authenticate_api_key")
async def test_auth_gateway_authenticate_api_key(assert_: Assertions):
    keys = KeyManager()
    key, raw_key = await keys.create_key(owner_id="gateway_owner", scope=KeyScope.USER)

    gateway = AuthGateway(key_manager=keys, jwt_secret="test-secret")
    ctx = await gateway.authenticate(api_key=raw_key)

    assert_.true(ctx.authenticated)
    assert_.equal(ctx.owner_id, "gateway_owner")
    assert_.equal(ctx.policy_id, key.policy_id)


@test("security", "auth_gateway_bearer_token")
async def test_auth_gateway_bearer_token(assert_: Assertions):
    keys = KeyManager()
    key, raw_key = await keys.create_key(owner_id="token_owner", scope=KeyScope.USER)

    gateway = AuthGateway(key_manager=keys, jwt_secret="test-secret")
    tok = await gateway.create_token(raw_key, expiry=60)
    assert_.not_none(tok)

    ctx = await gateway.authenticate(bearer_token=tok.encode(secret="test-secret"))
    assert_.true(ctx.authenticated)
    assert_.equal(ctx.owner_id, "token_owner")
