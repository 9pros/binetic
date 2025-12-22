"""
Core Tests - Test suite for core systems

Tests for operators, network, memtools, discovery, and brain.
"""

from ..framework import test, suite, TestCategory, Assertions
from ...core.operators import (
    OperatorRegistry, OperatorType, OperatorSignature,
    OperatorDiscovery, OperatorPipeline,
)
from ...core.network import (
    EmergentNetwork, ReactiveSlot, Signal, SlotState, ReactiveBinding,
)
from ...core.memtools import MemtoolRegistry, Memory, Pattern
from ...core.discovery import (
    DiscoveryEngine, DiscoverySource, DiscoveryMethod,
    Capability, CapabilityType,
)


# Create core test suite
core_suite = suite("core", TestCategory.UNIT)


# ============================================================================
# Operator Tests
# ============================================================================

@test("core", "operator_registration")
async def test_operator_registration(assert_: Assertions):
    """Test operator registration"""
    registry = OperatorRegistry()
    
    async def my_operator(input_data):
        return {"processed": input_data}
    
    signature = OperatorSignature(
        name="test_op",
        operator_type=OperatorType.MAP,
        description="Test operator",
    )
    
    registry.register("test_op", my_operator, signature)
    
    # Check registration
    assert_.true("test_op" in registry._operators)
    
    # Get operator
    op = registry.get("test_op")
    assert_.not_none(op)


@test("core", "operator_invocation")
async def test_operator_invocation(assert_: Assertions):
    """Test operator invocation"""
    registry = OperatorRegistry()
    
    async def double_operator(x):
        return x * 2
    
    registry.register("double", double_operator)
    
    result = await registry.invoke("double", 5)
    assert_.equal(result, 10)


@test("core", "operator_pipeline")
async def test_operator_pipeline(assert_: Assertions):
    """Test operator pipeline composition"""
    registry = OperatorRegistry()
    
    async def add_one(x):
        return x + 1
    
    async def double(x):
        return x * 2
    
    registry.register("add_one", add_one)
    registry.register("double", double)
    
    pipeline = OperatorPipeline(registry)
    pipeline.add("add_one").add("double")
    
    # (5 + 1) * 2 = 12
    result = await pipeline.execute(5)
    assert_.equal(result, 12)


@test("core", "operator_discovery")
async def test_operator_discovery(assert_: Assertions):
    """Test operator discovery from objects"""
    class MyService:
        async def process(self, data):
            return data
        
        async def validate(self, data):
            return True
        
        def _private(self):
            pass
    
    service = MyService()
    discovery = OperatorDiscovery()
    
    signatures = await discovery.discover_from_object(service, "my_service")
    
    # Should find 2 public async methods
    assert_.equal(len(signatures), 2)
    names = [s.name for s in signatures]
    assert_.contains(names, "my_service.process")
    assert_.contains(names, "my_service.validate")


# ============================================================================
# Network Tests
# ============================================================================

@test("core", "slot_creation")
async def test_slot_creation(assert_: Assertions):
    """Test reactive slot creation"""
    slot = ReactiveSlot(slot_id="test_slot")
    
    assert_.equal(slot.slot_id, "test_slot")
    assert_.equal(slot.state, SlotState.IDLE)
    assert_.equal(len(slot.operators), 0)


@test("core", "network_registration")
async def test_network_registration(assert_: Assertions):
    """Test slot registration in network"""
    network = EmergentNetwork()
    
    slot = ReactiveSlot(slot_id="net_slot")
    network.register_slot(slot)
    
    assert_.contains(network._slots, "net_slot")
    
    retrieved = network.get_slot("net_slot")
    assert_.not_none(retrieved)
    assert_.equal(retrieved.slot_id, "net_slot")


@test("core", "network_connection")
async def test_network_connection(assert_: Assertions):
    """Test slot connections"""
    network = EmergentNetwork()
    
    slot_a = ReactiveSlot(slot_id="slot_a")
    slot_b = ReactiveSlot(slot_id="slot_b")
    
    network.register_slot(slot_a)
    network.register_slot(slot_b)
    
    network.connect("slot_a", "slot_b")
    
    assert_.contains(slot_a.connections, "slot_b")


@test("core", "signal_creation")
async def test_signal_creation(assert_: Assertions):
    """Test signal creation"""
    signal = Signal(
        signal_id="sig_1",
        signal_type="data",
        payload={"value": 42},
        source="test",
    )
    
    assert_.equal(signal.signal_id, "sig_1")
    assert_.equal(signal.payload["value"], 42)


@test("core", "reactive_binding")
async def test_reactive_binding(assert_: Assertions):
    """Test reactive bindings"""
    triggered = []
    
    async def action(signal):
        triggered.append(signal.payload)
    
    binding = ReactiveBinding(
        trigger_type="test_trigger",
        action=action,
    )
    
    signal = Signal(
        signal_id="binding_test",
        signal_type="test_trigger",
        payload="hello",
        source="test",
    )
    
    matches = binding.matches(signal)
    assert_.true(matches)
    
    await binding.execute(signal)
    assert_.equal(len(triggered), 1)
    assert_.equal(triggered[0], "hello")


# ============================================================================
# Memtools Tests
# ============================================================================

@test("core", "memory_store")
async def test_memory_store(assert_: Assertions):
    """Test memory storage"""
    memtools = MemtoolRegistry()
    
    memory = await memtools.store(
        content="Test content",
        memory_type="test",
        importance=0.8,
        tags={"test", "unit"},
    )
    
    assert_.not_none(memory)
    assert_.true(memory.memory_id.startswith("mem_"))
    assert_.equal(memory.content, "Test content")
    assert_.equal(memory.importance, 0.8)
    assert_.contains(memory.tags, "test")


@test("core", "memory_recall")
async def test_memory_recall(assert_: Assertions):
    """Test memory recall"""
    memtools = MemtoolRegistry()
    
    # Store some memories
    await memtools.store(content="Memory 1", tags={"tag1"})
    await memtools.store(content="Memory 2", tags={"tag2"})
    await memtools.store(content="Memory 3", tags={"tag1", "tag2"})
    
    # Recall by tags
    results = await memtools.recall(tags={"tag1"})
    assert_.equal(len(results), 2)


@test("core", "memory_linking")
async def test_memory_linking(assert_: Assertions):
    """Test memory linking"""
    memtools = MemtoolRegistry()
    
    mem_a = await memtools.store(content="Memory A")
    mem_b = await memtools.store(content="Memory B")
    
    success = await memtools.link(mem_a.memory_id, mem_b.memory_id)
    assert_.true(success)
    
    assert_.contains(mem_a.links, mem_b.memory_id)
    assert_.contains(mem_b.links, mem_a.memory_id)


@test("core", "memory_forget")
async def test_memory_forget(assert_: Assertions):
    """Test memory forgetting"""
    memtools = MemtoolRegistry()
    
    mem = await memtools.store(content="To forget", importance=0.05)
    
    forgotten = await memtools.forget(below_importance=0.1)
    assert_.equal(forgotten, 1)
    
    # Should not be recallable
    results = await memtools.recall(memory_id=mem.memory_id)
    assert_.equal(len(results), 0)


@test("core", "pattern_recognition")
async def test_pattern_recognition(assert_: Assertions):
    """Test pattern recognition"""
    memtools = MemtoolRegistry()
    
    pattern = await memtools.recognize_pattern(
        pattern_type="trigger",
        trigger_conditions={"event": "login", "failed": True},
        response_template="Security alert",
    )
    
    assert_.not_none(pattern)
    assert_.true(pattern.pattern_id.startswith("pat_"))
    
    # Match pattern
    matches = await memtools.match_patterns({
        "event": "login",
        "failed": True,
    })
    
    assert_.equal(len(matches), 1)


# ============================================================================
# Discovery Tests
# ============================================================================

@test("core", "discovery_source_registration")
async def test_discovery_source_registration(assert_: Assertions):
    """Test discovery source registration"""
    engine = DiscoveryEngine()
    
    source = DiscoverySource(
        source_id="test_source",
        name="Test API",
        base_url="https://api.example.com",
        discovery_method=DiscoveryMethod.OPENAPI,
        discovery_path="/openapi.json",
    )
    
    engine.register_source(source)
    
    assert_.contains(engine._sources, "test_source")


@test("core", "capability_creation")
async def test_capability_creation(assert_: Assertions):
    """Test capability creation"""
    cap = Capability(
        capability_id="cap_test",
        name="test_endpoint",
        capability_type=CapabilityType.REST_API,
        endpoint="https://api.example.com/test",
        method="POST",
    )
    
    assert_.equal(cap.capability_id, "cap_test")
    assert_.equal(cap.capability_type, CapabilityType.REST_API)
    assert_.equal(cap.success_rate, 1.0)  # No calls yet


@test("core", "capability_search")
async def test_capability_search(assert_: Assertions):
    """Test capability search"""
    engine = DiscoveryEngine()
    
    # Add some capabilities directly
    engine._capabilities["cap_1"] = Capability(
        capability_id="cap_1",
        name="users_list",
        capability_type=CapabilityType.REST_API,
        endpoint="http://api/users",
        tags={"users", "list"},
    )
    
    engine._capabilities["cap_2"] = Capability(
        capability_id="cap_2",
        name="products_list",
        capability_type=CapabilityType.REST_API,
        endpoint="http://api/products",
        tags={"products", "list"},
    )
    
    # Search by name
    results = engine.search_capabilities(name="users")
    assert_.equal(len(results), 1)
    assert_.equal(results[0].capability_id, "cap_1")
    
    # Search by tags
    results = engine.search_capabilities(tags={"list"})
    assert_.equal(len(results), 2)
