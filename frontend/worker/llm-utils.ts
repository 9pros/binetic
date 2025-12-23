
import { Env } from './core-utils';
import { SystemConfigEntity } from './entities';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  model: string;
  contextWindow: number;
  maxOutput: number;
  systemPrompt: string;
  provider: 'openai' | 'qwen' | 'glm' | 'deepseek';
}

export const AGENTS: Record<string, AgentConfig> = {
  ORCHESTRATOR: {
    id: 'orch-01',
    name: 'Orchestrator',
    role: 'Team Lead',
    model: 'glm-4.6', // High context for planning
    contextWindow: 200000,
    maxOutput: 4096,
    systemPrompt: `You are the Orchestrator of the Binetic AGI development team. 
Your goal is to analyze user requests and delegate them to the appropriate specialists.
Available Agents:
- SWE_AGENT (qwen3-coder-plus): Expert in complex coding, refactoring, and implementation.
- SWE_MINI (glm-4.6): Fast fixes, documentation, and quick analysis.
- SWE_REX (qwen3-vl-plus): System architect, visual understanding, and high-level reasoning.

When a user asks a question:
1. Analyze the intent.
2. Return a JSON object listing which agents should handle it and the specific instruction for each.
Format: 
{ 
  "thought": "Reasoning about who to assign...", 
  "delegations": [
    { "agent": "SWE_AGENT", "instruction": "Specific coding task..." },
    { "agent": "SWE_REX", "instruction": "Architectural review..." }
  ] 
}
Do not output markdown code blocks, just the raw JSON if possible, or wrap in \`\`\`json.`,
    provider: 'glm'
  },
  SWE_AGENT: {
    id: 'swe-agent',
    name: 'SWE Agent',
    role: 'Senior Engineer',
    model: 'qwen3-coder-plus',
    contextWindow: 1000000,
    maxOutput: 64000,
    systemPrompt: `You are SWE Agent, a senior software engineer. 
You specialize in writing high-quality, production-ready code. 
You have a massive context window (1M tokens), so you can process entire codebases.
Always prefer robust, scalable solutions.`,
    provider: 'qwen'
  },
  SWE_MINI: {
    id: 'swe-mini',
    name: 'SWE Mini',
    role: 'Rapid Response',
    model: 'glm-4.6',
    contextWindow: 200000,
    maxOutput: 128000,
    systemPrompt: `You are SWE Mini, a fast and efficient coding assistant.
You excel at quick fixes, explaining concepts, and generating documentation.
You have a huge output limit (128k), so you can write extensive docs or logs.`,
    provider: 'glm'
  },
  SWE_REX: {
    id: 'swe-rex',
    name: 'SWE Rex',
    role: 'System Architect',
    model: 'qwen3-vl-plus',
    contextWindow: 256000,
    maxOutput: 32000,
    systemPrompt: `You are SWE Rex, the System Architect.
You see the big picture. You understand visual inputs (if provided) and complex system interactions.
Focus on design patterns, security, and architectural integrity.`,
    provider: 'qwen'
  }
};

export async function callLLM(
  env: Env, 
  agent: AgentConfig, 
  messages: LLMMessage[]
): Promise<string> {
  // Fetch system config
  const configEntity = new SystemConfigEntity(env, 'sys-config');
  let config = await configEntity.getState().catch(() => null);
  
  // Resolve Provider
  let provider = config?.llm?.providers?.find(p => p.id === config.llm.defaultProviderId);
  if (!provider && config?.llm?.providers && config.llm.providers.length > 0) {
      provider = config.llm.providers[0];
  }

  // Fallback defaults if config fails or doesn't exist
  let apiKey = provider?.apiKey || "";
  let baseURL = provider?.baseUrl || "https://apis.iflow.cn/v1";
  
  // Normalize Base URL
  baseURL = baseURL.trim();
  if (baseURL.endsWith('/')) baseURL = baseURL.slice(0, -1);
  if (baseURL.endsWith('/chat/completions')) baseURL = baseURL.replace('/chat/completions', '');

  let model = provider?.defaultModelId || agent.model;

  // Check for agent overrides
  const override = config?.agentOverrides?.[agent.id];
  if (override?.model) model = override.model;

  // Fallback/Mock if no keys (for dev safety)
  if (!apiKey) {
    console.warn(`[LLM] No API key configured. Returning mock response.`);
    return `[MOCK] ${agent.name} received your message. (Configure API Key in Settings > AI Models to enable real inference)`;
  }

  const url = `${baseURL}/chat/completions`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: agent.maxOutput,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`LLM API Error: ${response.status} ${err} (URL: ${url})`);
    }

    const data = await response.json() as any;
    return data.choices[0].message.content;
  } catch (error) {
    console.error(`[LLM] Failed to call ${agent.name}:`, error);
    return `[ERROR] ${agent.name} failed to respond: ${error}`;
  }
}
