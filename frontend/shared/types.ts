export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export interface User {
  id: string;
  name: string;
}
export interface Chat {
  id: string;
  title: string;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number;
}
export type ApiKeyScope = 'Master' | 'Admin' | 'User' | 'Service' | 'Readonly';
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  scope: ApiKeyScope;
  owner: string;
  status: 'active' | 'revoked' | 'suspended' | 'expired';
  createdAt: string;
  expiresAt: string | null;
  lastUsed: string;
  metadata: {
    description: string;
    tags: string[];
  };
  rateLimit: {
    rpm: number;
    rph: number;
  };
  stats: {
    totalRequests: number;
    errorRate: number;
    activeSessions: number;
  };
}
export type PermissionLevel = 'None' | 'Read' | 'Execute' | 'Write' | 'Admin';
export type ResourceType =
  | 'OPERATOR'
  | 'SLOT'
  | 'NETWORK'
  | 'KEY'
  | 'POLICY'
  | 'USER'
  | 'AUDIT'
  | 'SYSTEM';
export interface ResourcePermission {
  level: PermissionLevel;
  resourceId?: string;
  wildcard: boolean;
}
export type PolicyPermissions = Record<ResourceType, ResourcePermission>;
export interface PolicyRateLimits {
  rpm: number;
  rph: number;
  rpd: number;
  maxConcurrent: number;
}
export interface PolicyRestrictions {
  ipWhitelist: string[];
  ipBlacklist: string[];
  timeWindow: {
    start: string;
    end: string;
  } | null;
  allowedDays: string[];
  mfaRequired: boolean;
}
export interface SafetyPolicy {
  id: string;
  name: string;
  description: string;
  category: 'Safety' | 'Performance' | 'Ethics';
  enabled: boolean;
  severity: 'low' | 'medium' | 'high';
  permissions: PolicyPermissions;
  rateLimits: PolicyRateLimits;
  restrictions: PolicyRestrictions;
  targetKeyCount?: number;
}
export interface AuditLog {
  id: string;
  timestamp: string;
  operator: string;
  action: string;
  status: 'success' | 'failure' | 'warning';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  details: string;
  resource?: ResourceType;
  ip?: string;
  duration?: number;
  payload?: any;
  response?: any;
  metadata?: Record<string, any>;
}
export type SlotState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'EXECUTING' | 'WAITING' | 'ERROR' | 'STOPPED';
export interface NetworkSlot {
  id: string;
  label: string;
  state: SlotState;
  opsCount: number;
  x: number;
  y: number;
  connections: string[];
  bindings: string[];
}
export interface NetworkSignal {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'DATA' | 'COMMAND' | 'PULSE' | 'ERROR';
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
  payload: string;
  timestamp: number;
}
export type MemoryType = 'Semantic' | 'Episodic' | 'Procedural' | 'Working';
export interface MemoryCluster {
  id: string;
  label: string;
  type: MemoryType;
  stability: number;
  dataSize: string;
  lastAccess: string;
  tags: string[];
}
export type OperatorStatus = 'Online' | 'Idle' | 'Offline';
export interface OperatorProfile {
  id: string;
  name: string;
  role: string;
  status: OperatorStatus;
  location: string;
  lastAction: string;
  clearance: number;
}
export interface DiscoveryEvent {
  id: string;
  timestamp: number;
  title: string;
  confidence: number;
  sector: string;
  description: string;
  isConfirmed: boolean;
}
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type AuthType = 'None' | 'API Key' | 'Bearer Token' | 'Basic';
export interface DiscoverySource {
  id: string;
  name: string;
  url: string;
  method: HttpMethod;
  lastDiscovery: string;
  capabilitiesCount: number;
  status: 'Active' | 'Inactive';
  auth: {
    type: AuthType;
    credentials?: string;
  };
  autoInterval: number;
}
export interface DiscoveryCapability {
  id: string;
  sourceId: string;
  name: string;
  description: string;
  type: 'Analytic' | 'Action' | 'Stream' | 'Knowledge';
  endpoint: string;
  method: HttpMethod;
  health: number;
  successRate: number;
  responseTime: number;
  lastCheck: string;
  tags: string[];
  schema: {
    input: any;
    output: any;
  };
}
export type ThoughtType = 'Query' | 'Command' | 'Observation' | 'Reflection' | 'Planning' | 'Learning';
export interface Thought {
  id: string;
  type: ThoughtType;
  content: string;
  context: Record<string, string>;
  result?: string;
  duration: number;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
}
export type GoalStatus = 'Pending' | 'Active' | 'Blocked' | 'Completed';
export interface Goal {
  id: string;
  description: string;
  priority: number;
  progress: number;
  subgoals: string[];
  status: GoalStatus;
  createdAt: number;
}

export type BrainStatus = 'READY' | 'LEARNING' | 'SYNCING' | 'IDLE' | 'ERROR';

export interface BrainState {
  id: string;
  status: BrainStatus;
  uptime: string;
  stability: number;
  thoughtCount: number;
  activeGoals: number;
  synapticLoad: number;
  learningRate: number;
  successRate: number;
  lastSync: string;
}

export interface ApprovalRequest {
  id: string;
  type: 'operator_registration' | 'policy_change' | 'key_provision';
  status: 'pending' | 'approved' | 'rejected';
  payload: any;
  requestedBy: string;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}