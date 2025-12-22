"""Core tests aligned with current core APIs.

These are intentionally minimal and avoid external network calls.
"""

from tests.framework import test, suite, TestCategory, Assertions

from core.operators import OperatorRegistry, OperatorType, OperatorSignature, OperatorPipeline
from core.memtools import MemtoolRegistry
from core.discovery import DiscoveryEngine, DiscoverySource, DiscoveryMethod
from core.network import EmergentNetwork, Signal, SignalType


core_suite = suite("core", TestCategory.UNIT)


@test("core", "operator_register_and_get")
async def test_operator_register_and_get(assert_: Assertions):
    registry = OperatorRegistry()

    sig = OperatorSignature(
        operator_id="op_test_1",
        operator_type=OperatorType.COMPUTE,
        endpoint_url="https://example.com/api",
        method="POST",
        headers={},
        request_template={},
        required_params=[],
        optional_params=[],
    )

    await registry.register(sig)
    got = await registry.get("op_test_1")

    assert_.not_none(got)
    assert_.equal(got.operator_id, "op_test_1")


@test("core", "operator_invoke_missing")
async def test_operator_invoke_missing(assert_: Assertions):
    registry = OperatorRegistry()

    inv = await registry.invoke("does_not_exist", {"x": 1})
    assert_.false(inv.success)
    assert_.true("not found" in (inv.error or "").lower())


@test("core", "operator_pipeline_fails_cleanly")
async def test_operator_pipeline_fails_cleanly(assert_: Assertions):
    registry = OperatorRegistry()

    pipe = OperatorPipeline(registry).add("missing_op")
    res = await pipe.execute({"a": 1})

    assert_.false(res["success"])
    assert_.equal(res["failed_at_step"], 0)


@test("core", "memtools_store_and_recall")
async def test_memtools_store_and_recall(assert_: Assertions):
    mem = MemtoolRegistry()

    stored = await mem.store({"hello": "world"}, memory_type="semantic")
    recalled = await mem.recall(memory_id=stored.memory_id)

    assert_.equal(len(recalled), 1)
    assert_.equal(recalled[0].memory_id, stored.memory_id)


@test("core", "discovery_no_http_client_returns_empty")
async def test_discovery_no_http_client_returns_empty(assert_: Assertions):
    eng = DiscoveryEngine(http_client=None)
    eng.register_source(
        DiscoverySource(
            source_id="s1",
            name="Test",
            base_url="https://example.com",
            discovery_method=DiscoveryMethod.OPENAPI,
            discovery_path="/openapi.json",
        )
    )

    out = await eng.discover_all()

    assert_.true("s1" in out)
    assert_.equal(out["s1"], [])


@test("core", "network_create_and_connect")
async def test_network_create_and_connect(assert_: Assertions):
    net = EmergentNetwork()

    a = await net.create_slot(slot_type="test")
    b = await net.create_slot(slot_type="test")

    await net.connect_slots(a.slot_id, b.slot_id)

    assert_.true(b.slot_id in net.slots[a.slot_id].connections)
    assert_.true(a.slot_id in net.slots[b.slot_id].connections)


@test("core", "network_send_signal_to_target")
async def test_network_send_signal_to_target(assert_: Assertions):
    net = EmergentNetwork()

    src = await net.create_slot(slot_type="test")
    tgt = await net.create_slot(slot_type="test")

    sig = Signal(
        signal_id="sig_test",
        signal_type=SignalType.QUERY,
        source_slot=src.slot_id,
        target_slot=tgt.slot_id,
        payload={"q": "hi"},
    )

    await net.send_signal(sig)

    assert_.equal(len(net.slots[tgt.slot_id].signal_queue), 1)
    assert_.equal(net.slots[tgt.slot_id].signal_queue[0].signal_id, "sig_test")

