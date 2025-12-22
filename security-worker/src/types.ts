export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export interface User {
  id: string;
  name: string;
}
export type ApiKeyScope = 'Master' | 'Admin' | 'User' | 'Service' | 'Readonly';
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  scope: ApiKeyScope;
  owner: string;
  role?: string;
  clearance?: number;
  permissions?: string[];
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
}
