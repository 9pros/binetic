# How to Create World-Class Agents with Binetic

This guide outlines the step-by-step process to build competitive, specialized agents using the Binetic architecture.

## Core Philosophy
Binetic agents are not just "prompts" wrapped in a loop. They are **emergent networks** of specialized slots (micro-agents) that share a common brain and memory. To beat the competition, you must leverage:
1.  **Horizontal Discovery**: Use MCP to map the internet/tools dynamically.
2.  **Specialized Topology**: Design a network of slots that mirrors the cognitive steps of the task.
3.  **Reactive Memory**: Use Memtools to learn patterns and promote successful chains into skills.

---

## Step 1: Define the Agent's Domain & Topology

Don't build a generic "do everything" agent. Define a specific domain (e.g., "Market Research", "Full-Stack Coding").

### Example: "Deep Research Agent"
Instead of one LLM call, we design a topology:
*   **Planner Slot**: Decomposes the user query into sub-questions.
*   **Search Slot**: Executes MCP search tools (Brave, Google).
*   **Reader Slot**: Visits pages and extracts content.
*   **Synthesizer Slot**: Aggregates findings into a report.
*   **Critic Slot**: Reviews the report against the original query.

## Step 2: Setup Discovery (The "Eyes")

Your agent needs tools. Use the MCP integration to give it "eyes" and "hands".

1.  **Install MCP Servers**:
    ```bash
    npm install -g @modelcontextprotocol/server-brave-search
    npm install -g @modelcontextprotocol/server-filesystem
    ```

2.  **Register Sources**:
    Create a startup script (e.g., `scripts/init_research_agent.py`) to register these sources.

    ```python
    from core.discovery import get_discovery_engine, DiscoverySource, DiscoveryMethod
    
    engine = get_discovery_engine()
    
    # Brave Search (The "Eyes")
    engine.register_source(DiscoverySource(
        source_id="brave-search",
        name="Brave Search",
        base_url="npx -y @modelcontextprotocol/server-brave-search",
        discovery_method=DiscoveryMethod.MCP,
        auth_credentials={"BRAVE_API_KEY": "..."}
    ))
    
    # Filesystem (The "Hands")
    engine.register_source(DiscoverySource(
        source_id="local-fs",
        name="Local Filesystem",
        base_url="npx -y @modelcontextprotocol/server-filesystem /workspace",
        discovery_method=DiscoveryMethod.MCP
    ))
    ```

## Step 3: Construct the Network (The "Brain")

In the same script, build the reactive network.

```python
from core.network import get_network, ReactiveSlot, ReactiveBinding, SignalType
from core.operators import OperatorType

network = get_network()

# 1. Planner Slot
planner = ReactiveSlot(slot_id="planner", slot_type="reasoning")
planner.operator_ids = ["op_llm_infer"] # Assuming you have a generic LLM operator
network.register_slot(planner)

# 2. Search Slot (Connected to MCP tools)
searcher = ReactiveSlot(slot_id="searcher", slot_type="tool_use")
# These IDs come from the discovery phase (e.g., mcp-brave-search-brave_web_search)
searcher.operator_ids = ["mcp-brave-search-brave_web_search"] 
network.register_slot(searcher)

# 3. Synthesizer Slot
writer = ReactiveSlot(slot_id="writer", slot_type="reasoning")
writer.operator_ids = ["op_llm_infer"]
network.register_slot(writer)

# Connect them
planner.connections.add("searcher")
searcher.connections.add("writer")
writer.connections.add("planner") # Feedback loop
```

## Step 4: Define Reactive Bindings (The "Reflexes")

Make the agent autonomous by defining **Reactive Bindings**. These are "if-this-then-that" rules embedded in the slots.

```python
# When Planner receives a user query, it generates a plan and signals the Searcher
planner.bindings.append(ReactiveBinding(
    trigger=SignalType.QUERY,
    action="decompose_and_delegate",
    target_slot="searcher"
))

# When Searcher gets results, it forwards them to Writer
searcher.bindings.append(ReactiveBinding(
    trigger=SignalType.RESPONSE,
    action="forward_results",
    target_slot="writer"
))
```

*Note: You will need to implement the logic for `decompose_and_delegate` inside the `ReactiveSlot.process_signal` method or as a registered handler.*

## Step 5: Enforce Safety Policies (The "Guardrails")

To keep it "safe" while being "world-class", use the Policy Engine.

1.  **Edit `security/policies.py`**:
    Create a policy that restricts the `searcher` slot to *only* read-only internet access, preventing it from posting data or accessing local secrets.

    ```python
    # In security/policies.py
    research_policy = Policy(
        policy_id="pol_research_agent",
        name="Research Agent Constraints",
        permissions=[
            Permission(ResourceType.OPERATOR, "mcp-brave-search-brave_web_search", PermissionLevel.EXECUTE),
            Permission(ResourceType.OPERATOR, "op_llm_infer", PermissionLevel.EXECUTE),
            # Explicitly DENY dangerous tools
            Permission(ResourceType.OPERATOR, "mcp-filesystem-write_file", PermissionLevel.NONE),
        ],
        restrictions=Restriction(
            ip_whitelist=["*"], # Allow internet
            rate_limit=RateLimit(requests_per_minute=60)
        )
    )
    ```

## Step 6: Run and Evolve

1.  **Start the System**: Run your initialization script.
2.  **Inject a Goal**:
    ```python
    from core.brain import get_brain
    brain = await get_brain()
    await brain.add_goal("Research the latest advancements in solid-state batteries.")
    ```
3.  **Monitor**: Watch the `NetworkGraph` in the UI. You will see signals flowing from Planner -> Searcher -> Writer.
4.  **Promote Skills**: If the agent finds a particularly effective search query pattern, use `memtools` to save it as a `Pattern`.

    ```python
    from core.memtools import get_memtools, Pattern
    mem = get_memtools()
    await mem.learn_pattern(Pattern(
        name="effective_battery_search",
        sequence=["search:solid state", "filter:arxiv", "summarize:abstract"]
    ))
    ```

## Summary Checklist

- [ ] **Domain Defined**: Specific task identified.
- [ ] **Tools Discovered**: MCP servers registered.
- [ ] **Network Built**: Slots created and connected.
- [ ] **Reflexes Set**: Reactive bindings defined.
- [ ] **Safety On**: Policies applied to slots.
