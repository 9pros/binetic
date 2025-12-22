/**
 * Binetic Security Worker - Durable Object Entities
 * Security-critical entities for the AGI Control Center.
 */
import { IndexedEntity } from "./core-utils";
import type { 
  User, ApiKey, SafetyPolicy, AuditLog, ApprovalRequest
} from "./types";

// ============================================================================
// SEED DATA
// ============================================================================

const SEED_USERS: User[] = [
  { id: 'user-001', name: 'System Administrator' },
  { id: 'user-002', name: 'Operator Alpha' },
];

const SEED_KEYS: ApiKey[] = [
  {
    id: 'k_82h1s92k1l',
    name: 'Production Nexus Main',
    key: 'bnk_prod_82h1s92k1l',
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
    key: 'bnk_dev_19s2j81l0p',
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
  {
    id: 'k_svc_frontend',
    name: 'Frontend Worker Service',
    key: 'bnk_svc_frontend_worker',
    scope: 'Service',
    owner: 'Frontend Worker',
    status: 'active',
    createdAt: '2024-01-01',
    expiresAt: null,
    lastUsed: 'now',
    metadata: { description: 'Internal service communication', tags: ['system', 'internal'] },
    rateLimit: { rpm: 10000, rph: 100000 },
    stats: { totalRequests: 0, errorRate: 0, activeSessions: 0 }
  }
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

const SEED_APPROVALS: ApprovalRequest[] = [
  {
    id: 'app-001',
    type: 'operator_registration',
    status: 'pending',
    payload: { name: 'New Operator X', endpoint: 'https://api.example.com' },
    requestedBy: 'system',
    createdAt: new Date().toISOString()
  }
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

// AUDIT LOG ENTITY
export class AuditLogEntity extends IndexedEntity<AuditLog> {
  static readonly entityName = "auditlog";
  static readonly indexName = "auditlogs";
  static readonly initialState: AuditLog = {
    id: "", timestamp: "", operator: "", action: "", status: "success", severity: "Low", details: ""
  };
  static seedData = SEED_LOGS;
}

// APPROVAL ENTITY
export class ApprovalEntity extends IndexedEntity<ApprovalRequest> {
  static readonly entityName = "approval";
  static readonly indexName = "approvals";
  static readonly initialState: ApprovalRequest = {
    id: "", type: "operator_registration", status: "pending", payload: {}, requestedBy: "", createdAt: ""
  };
  static seedData = SEED_APPROVALS;
}
