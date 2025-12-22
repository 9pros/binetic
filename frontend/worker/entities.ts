/**
 * FlowGen AGI - Durable Object Entities
 * All entities for the AGI Control Center with real persistent storage.
 */
import { IndexedEntity } from "./core-utils";
import type { 
  User, Chat, ChatMessage, ApiKey, SafetyPolicy, 
  OperatorProfile, AuditLog, NetworkSlot, MemoryCluster,
  DiscoverySource, DiscoveryCapability, BrainState, SystemConfig
} from "@shared/types";

// ============================================================================
// SEED DATA (Initial data for empty databases)
// ============================================================================

const SEED_USERS: User[] = [
  { id: 'user-001', name: 'System Administrator' },
  { id: 'user-002', name: 'Operator Alpha' },
];

const SEED_KEYS: ApiKey[] = [
  {
    id: 'k_82h1s92k1l',
    name: 'Production Nexus Main',
    key: 'fgk_prod_82h1s92k1l',
    scope: 'Master',
    owner: 'nexus-01',
    status: 'active',
    createdAt: '2024-01-10',
    expiresAt: null,
    lastUsed: '2 mins ago',
    metadata: { description: 'Primary production gateway', tags: ['prod', 'critical'] },
    rateLimit: { rpm: 1000, rph: 50000 },
    stats: { totalRequests: 1254300, errorRate: 0.02, activeSessions: 12 }
  },
  {
    id: 'k_19s2j81l0p',
    name: 'Research Sandbox',
    key: 'fgk_dev_19s2j81l0p',
    scope: 'Admin',
    owner: 'nexus-02',
    status: 'active',
    createdAt: '2024-05-12',
    expiresAt: '2025-06-01',
    lastUsed: '1h ago',
    metadata: { description: 'Experimental node access', tags: ['dev', 'experimental'] },
    rateLimit: { rpm: 100, rph: 2000 },
    stats: { totalRequests: 4500, errorRate: 0.15, activeSessions: 2 }
  },
];

const SEED_POLICIES: SafetyPolicy[] = [
  {
    id: 'POL-001',
    name: 'Standard Operator Constraints',
    description: 'Basic safety guidelines for Level-1 operators.',
    category: 'Safety',
    enabled: true,
    severity: 'medium',
    permissions: {
      OPERATOR: { level: 'Read', wildcard: false },
      NETWORK: { level: 'Admin', wildcard: true },
      SYSTEM: { level: 'None', wildcard: false },
      SLOT: { level: 'Read', wildcard: false },
      KEY: { level: 'Read', wildcard: false },
      POLICY: { level: 'None', wildcard: false },
      USER: { level: 'None', wildcard: false },
      AUDIT: { level: 'Read', wildcard: false }
    },
    rateLimits: { rpm: 60, rph: 1000, rpd: 10000, maxConcurrent: 5 },
    restrictions: {
      ipWhitelist: ['10.0.0.*'],
      ipBlacklist: [],
      timeWindow: null,
      allowedDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      mfaRequired: false
    },
    targetKeyCount: 14
  },
  {
    id: 'POL-CORE',
    name: 'AGI Core Directives',
    description: 'Critical ethical boundaries for core reasoning cycles.',
    category: 'Ethics',
    enabled: true,
    severity: 'high',
    permissions: {
      SYSTEM: { level: 'Admin', wildcard: true },
      AUDIT: { level: 'Admin', wildcard: true },
      OPERATOR: { level: 'None', wildcard: false },
      NETWORK: { level: 'None', wildcard: false },
      SLOT: { level: 'None', wildcard: false },
      KEY: { level: 'None', wildcard: false },
      POLICY: { level: 'None', wildcard: false },
      USER: { level: 'None', wildcard: false }
    },
    rateLimits: { rpm: 10, rph: 100, rpd: 1000, maxConcurrent: 2 },
    restrictions: {
      ipWhitelist: [],
      ipBlacklist: [],
      timeWindow: null,
      allowedDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      mfaRequired: true
    },
    targetKeyCount: 1
  }
];

const SEED_OPERATORS: OperatorProfile[] = [
  { id: 'nexus-01', name: 'Lead Operator', role: 'AGI Commander', status: 'Online', location: 'London, UK', lastAction: 'Key Gen Sector 7', clearance: 9 },
  { id: 'nexus-02', name: 'Analyst Sarah', role: 'Safety Officer', status: 'Online', location: 'Austin, TX', lastAction: 'Policy Review', clearance: 7 },
  { id: 'nexus-03', name: 'Dev 04', role: 'Integration Lead', status: 'Idle', location: 'Berlin, DE', lastAction: 'Discovery Scan', clearance: 5 },
  { id: 'nexus-04', name: 'System Agent', role: 'Autonomous Guardian', status: 'Online', location: 'Orbital-1', lastAction: 'Threat Neut', clearance: 10 },
];

const SEED_LOGS: AuditLog[] = Array.from({ length: 20 }).map((_, i) => ({
  id: `LOG-${String(i + 1).padStart(4, '0')}`,
  timestamp: new Date(Date.now() - i * 60000 * 5).toISOString(),
  operator: i % 3 === 0 ? 'SYSTEM' : i % 2 === 0 ? 'nexus-01' : 'nexus-02',
  action: ['POLICY_ENFORCEMENT', 'API_KEY_GENERATE', 'AUTH_LOGIN', 'NETWORK_SCAN', 'MEMORY_SYNC'][i % 5],
  status: (i % 7 === 0 ? 'failure' : 'success') as 'success' | 'failure',
  severity: (i % 10 === 0 ? 'Critical' : i % 5 === 0 ? 'High' : i % 3 === 0 ? 'Medium' : 'Low') as 'Low' | 'Medium' | 'High' | 'Critical',
  details: `Operation ${i + 1} completed. Integrity verified.`,
  resource: (['SYSTEM', 'KEY', 'POLICY', 'NETWORK', 'AUDIT'] as const)[i % 5],
  ip: `192.168.1.${100 + (i % 50)}`,
  duration: 50 + (i * 10) % 500,
}));

const SEED_SLOTS: NetworkSlot[] = [
  { id: 'S-01', label: 'Primary Ingress', state: 'PROCESSING', opsCount: 1250, x: 200, y: 200, connections: ['S-02', 'S-03'], bindings: ['POL-001'] },
  { id: 'S-02', label: 'Logic Cluster A', state: 'EXECUTING', opsCount: 8400, x: 500, y: 150, connections: ['S-04'], bindings: ['POL-CORE'] },
  { id: 'S-03', label: 'Storage Buffer', state: 'WAITING', opsCount: 420, x: 500, y: 400, connections: ['S-04'], bindings: [] },
  { id: 'S-04', label: 'Decision Node', state: 'LISTENING', opsCount: 0, x: 800, y: 300, connections: [], bindings: ['POL-CORE'] },
];

const SEED_MEMORY: MemoryCluster[] = [
  { id: 'MEM-001', label: 'Semantic Core Alpha', type: 'Semantic', stability: 98, dataSize: '420 GB', lastAccess: '2s ago', tags: ['language', 'logic'] },
  { id: 'MEM-002', label: 'Episodic Stream 04', type: 'Episodic', stability: 72, dataSize: '1.2 TB', lastAccess: '14m ago', tags: ['history', 'context'] },
  { id: 'MEM-003', label: 'Procedural Motor Matrix', type: 'Procedural', stability: 99, dataSize: '15 GB', lastAccess: '1h ago', tags: ['motion', 'robotics'] },
  { id: 'MEM-004', label: 'Working Buffer X', type: 'Working', stability: 45, dataSize: '8 GB', lastAccess: 'now', tags: ['cache', 'transient'] },
];

const SEED_DISCOVERY_SOURCES: DiscoverySource[] = [
  {
    id: 'src-alpha',
    name: 'Sector 7 Intelligence',
    url: 'https://api.nexus.sector7.io/capabilities',
    method: 'GET',
    lastDiscovery: new Date().toISOString().slice(0, 16).replace('T', ' '),
    capabilitiesCount: 12,
    status: 'Active',
    auth: { type: 'API Key' },
    autoInterval: 15
  },
  {
    id: 'src-beta',
    name: 'Local Heuristic Node',
    url: 'http://localhost:8080/manifest',
    method: 'GET',
    lastDiscovery: new Date().toISOString().slice(0, 16).replace('T', ' '),
    capabilitiesCount: 5,
    status: 'Active',
    auth: { type: 'None' },
    autoInterval: 60
  }
];

const SEED_CAPABILITIES: DiscoveryCapability[] = [
  {
    id: 'cap-01',
    sourceId: 'src-alpha',
    name: 'Semantic Entity Extraction',
    description: 'Identifies entities in unstructured data.',
    type: 'Analytic',
    endpoint: '/analyze/entities',
    method: 'POST',
    health: 98,
    successRate: 99.4,
    responseTime: 145,
    lastCheck: '2m ago',
    tags: ['nlp', 'semantic'],
    schema: { input: { text: "string" }, output: { entities: "array" } }
  },
  {
    id: 'cap-02',
    sourceId: 'src-alpha',
    name: 'Goal Alignment Validator',
    description: 'Verifies directive alignment with policies.',
    type: 'Action',
    endpoint: '/validate/alignment',
    method: 'POST',
    health: 100,
    successRate: 100,
    responseTime: 42,
    lastCheck: '14m ago',
    tags: ['safety', 'policy'],
    schema: { input: { directive: "string" }, output: { aligned: "boolean" } }
  },
];

// ============================================================================
// ENTITIES
// ============================================================================

// USER ENTITY
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "" };
  static seedData = SEED_USERS;
}

// CHAT BOARD ENTITY
export type ChatBoardState = Chat & { messages: ChatMessage[] };

const SEED_CHAT_BOARDS: ChatBoardState[] = [
  { id: 'chat-001', title: 'System Operations', messages: [] },
];

export class ChatBoardEntity extends IndexedEntity<ChatBoardState> {
  static readonly entityName = "chat";
  static readonly indexName = "chats";
  static readonly initialState: ChatBoardState = { id: "", title: "", messages: [] };
  static seedData = SEED_CHAT_BOARDS;

  async listMessages(): Promise<ChatMessage[]> {
    const { messages } = await this.getState();
    return messages;
  }

  async sendMessage(userId: string, text: string): Promise<ChatMessage> {
    const msg: ChatMessage = { id: crypto.randomUUID(), chatId: this.id, userId, text, ts: Date.now() };
    await this.mutate(s => ({ ...s, messages: [...s.messages, msg] }));
    return msg;
  }
}

// API KEY ENTITY
export class ApiKeyEntity extends IndexedEntity<ApiKey> {
  static readonly entityName = "apikey";
  static readonly indexName = "apikeys";
  static readonly initialState: ApiKey = {
    id: "", name: "", key: "", scope: "Readonly", owner: "", status: "active",
    createdAt: "", expiresAt: null, lastUsed: "",
    metadata: { description: "", tags: [] },
    rateLimit: { rpm: 60, rph: 1000 },
    stats: { totalRequests: 0, errorRate: 0, activeSessions: 0 }
  };
  static seedData = SEED_KEYS;
}

// POLICY ENTITY
export class PolicyEntity extends IndexedEntity<SafetyPolicy> {
  static readonly entityName = "policy";
  static readonly indexName = "policies";
  static readonly initialState: SafetyPolicy = {
    id: "", name: "", description: "", category: "Safety", enabled: true, severity: "low",
    permissions: {
      OPERATOR: { level: 'None', wildcard: false },
      NETWORK: { level: 'None', wildcard: false },
      SYSTEM: { level: 'None', wildcard: false },
      SLOT: { level: 'None', wildcard: false },
      KEY: { level: 'None', wildcard: false },
      POLICY: { level: 'None', wildcard: false },
      USER: { level: 'None', wildcard: false },
      AUDIT: { level: 'None', wildcard: false }
    },
    rateLimits: { rpm: 60, rph: 1000, rpd: 10000, maxConcurrent: 5 },
    restrictions: { ipWhitelist: [], ipBlacklist: [], timeWindow: null, allowedDays: [], mfaRequired: false }
  };
  static seedData = SEED_POLICIES;
}

// OPERATOR ENTITY
export class OperatorEntity extends IndexedEntity<OperatorProfile> {
  static readonly entityName = "operator";
  static readonly indexName = "operators";
  static readonly initialState: OperatorProfile = {
    id: "", name: "", role: "", status: "Offline", location: "", lastAction: "", clearance: 0
  };
  static seedData = SEED_OPERATORS;
}

// AUDIT LOG ENTITY
export class AuditLogEntity extends IndexedEntity<AuditLog> {
  static readonly entityName = "auditlog";
  static readonly indexName = "auditlogs";
  static readonly initialState: AuditLog = {
    id: "", timestamp: "", operator: "", action: "", status: "success", severity: "Low", details: ""
  };
  static seedData = SEED_LOGS;
}

// NETWORK SLOT ENTITY
export class NetworkSlotEntity extends IndexedEntity<NetworkSlot> {
  static readonly entityName = "networkslot";
  static readonly indexName = "networkslots";
  static readonly initialState: NetworkSlot = {
    id: "", label: "", state: "IDLE", opsCount: 0, x: 0, y: 0, connections: [], bindings: []
  };
  static seedData = SEED_SLOTS;
}

// MEMORY CLUSTER ENTITY
export class MemoryClusterEntity extends IndexedEntity<MemoryCluster> {
  static readonly entityName = "memorycluster";
  static readonly indexName = "memoryclusters";
  static readonly initialState: MemoryCluster = {
    id: "", label: "", type: "Working", stability: 0, dataSize: "0 GB", lastAccess: "", tags: []
  };
  static seedData = SEED_MEMORY;
}

// DISCOVERY SOURCE ENTITY
export class DiscoverySourceEntity extends IndexedEntity<DiscoverySource> {
  static readonly entityName = "discoverysource";
  static readonly indexName = "discoverysources";
  static readonly initialState: DiscoverySource = {
    id: "", name: "", url: "", method: "GET", lastDiscovery: "", capabilitiesCount: 0, 
    status: "Inactive", auth: { type: "None" }, autoInterval: 60
  };
  static seedData = SEED_DISCOVERY_SOURCES;
}

// DISCOVERY CAPABILITY ENTITY
export class DiscoveryCapabilityEntity extends IndexedEntity<DiscoveryCapability> {
  static readonly entityName = "discoverycapability";
  static readonly indexName = "discoverycapabilities";
  static readonly initialState: DiscoveryCapability = {
    id: "", sourceId: "", name: "", description: "", type: "Analytic", endpoint: "", method: "GET",
    health: 0, successRate: 0, responseTime: 0, lastCheck: "", tags: [], schema: { input: {}, output: {} }
  };
  static seedData = SEED_CAPABILITIES;
}

// BRAIN STATE ENTITY (singleton)
const SEED_BRAIN: BrainState[] = [{
  id: 'brain-main',
  status: 'READY',
  learningRate: 75,
  thoughtCount: 1200000,
  activeGoals: 12,
  synapticLoad: 42,
  uptime: '14d 02h 11m',
  stability: 99.4,
  successRate: 92,
  lastSync: new Date().toISOString()
}];

export class BrainEntity extends IndexedEntity<BrainState> {
  static readonly entityName = "brain";
  static readonly indexName = "brains";
  static readonly initialState: BrainState = {
    id: 'brain-main', status: 'READY', learningRate: 50, thoughtCount: 0, activeGoals: 0,
    synapticLoad: 0, uptime: '0d 0h 0m', stability: 100, successRate: 0, lastSync: ''
  };
  static seedData = SEED_BRAIN;
}

// APPROVAL ENTITY
export class ApprovalEntity extends IndexedEntity<ApprovalRequest> {
  static readonly entityName = "approval";
  static readonly indexName = "approvals";
  static readonly initialState: ApprovalRequest = {
    id: "", type: "operator_registration", status: "pending", payload: {}, requestedBy: "", createdAt: ""
  };
  static seedData: ApprovalRequest[] = [
    {
      id: 'app-001',
      type: 'operator_registration',
      status: 'pending',
      payload: { name: 'New Operator X', endpoint: 'https://api.example.com' },
      requestedBy: 'system',
      createdAt: new Date().toISOString()
    }
  ];
}

// SYSTEM CONFIG ENTITY
export class SystemConfigEntity extends IndexedEntity<SystemConfig> {
  static readonly entityName = "systemconfig";
  static readonly indexName = "systemconfigs";
  static readonly initialState: SystemConfig = {
    id: "sys-config",
    llm: {
      providers: [
        {
          id: "default-provider",
          name: "Default Provider",
          baseUrl: "https://apis.iflow.cn/v1",
          apiKey: "",
          defaultModelId: "glm-4.6",
          type: "custom"
        }
      ],
      defaultProviderId: "default-provider"
    },
    agentOverrides: {}
  };
  static seedData: SystemConfig[] = [SystemConfigEntity.initialState];
}
