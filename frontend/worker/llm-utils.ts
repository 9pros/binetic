
import { Env } from './core-utils';

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
  // In a real deployment, these would be separate env vars. 
  // For now, we assume a unified OpenAI-compatible gateway or specific keys.
  let apiKey = env.QWEN_API_KEY;
  let baseURL = "https://dashscope.aliyuncs.com/compatible-mode/v1";

  if (agent.provider === 'glm') {
    apiKey = env.GLM_API_KEY;
    baseURL = "https://open.bigmodel.cn/api/paas/v4";
  } else if (agent.provider === 'deepseek') {
    apiKey = env.DEEPSEEK_API_KEY;
    baseURL = "https://api.deepseek.com/v1";
  }

  // Fallback/Mock if no keys (for dev safety)
  if (!apiKey) {
    console.warn(`[LLM] No API key for ${agent.provider}. Returning mock response.`);
    return `[MOCK] ${agent.name} received your message. (Configure ${agent.provider.toUpperCase()}_API_KEY to enable real inference)`;
  }

  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: agent.model,
        messages: messages,
        max_tokens: agent.maxOutput,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`LLM API Error: ${response.status} ${err}`);
    }

    const data = await response.json() as any;
    return data.choices[0].message.content;
  } catch (error) {
    console.error(`[LLM] Failed to call ${agent.name}:`, error);
    return `[ERROR] ${agent.name} failed to respond: ${error}`;
  }
}
