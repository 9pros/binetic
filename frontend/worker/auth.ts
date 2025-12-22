/**
 * Binetic AGI - Authentication Module
 * 
 * SECURITY: Master keys are validated server-side.
 * Supports both legacy fgk_ and new bnk_ key formats.
 */

import type { Context, Next } from 'hono';
import type { Env } from './core-utils';

// ============================================================================
// TYPES
// ============================================================================

export interface KeyConfig {
  id: string;
  scope: 'Master' | 'Admin' | 'User' | 'Service' | 'Readonly';
  owner: string;
  role: string;
  clearance: number;
  permissions: string[];
}

export interface AuthContext {
  key: string;
  config: KeyConfig;
  authenticated: boolean;
}

// ============================================================================
// KEY CONFIGURATION
// ============================================================================

/**
 * Active master keys - the ONLY valid keys for system access.
 * Supports both fgk_ (legacy) and bnk_ (binetic) formats.
 */
const VALID_KEYS: Record<string, KeyConfig> = {
  // Legacy Master Key (fgk format)
  'fgk_nexus_x7k9m2p4q8r1': {
    id: 'key-001',
    scope: 'Master',
    owner: 'System Administrator',
    role: 'AGI Commander',
    clearance: 10,
    permissions: ['*'],
  },
  // NEW Binetic Master Key (bnk format)
  'bnk_master_x7k9m2p4q8r1': {
    id: 'key-002',
    scope: 'Master',
    owner: 'Binetic Core',
    role: 'Living Intelligence',
    clearance: 10,
    permissions: ['*'],
  },
  // Service key for automated systems
  'fgk_svc_auto_7h3j9k2m': {
    id: 'key-003',
    scope: 'Service',
    owner: 'Autonomous Guardian',
    role: 'System Agent',
    clearance: 8,
    permissions: ['read:*', 'execute:operators', 'execute:network'],
  },
  // Binetic Service key
  'bnk_service_auto_7h3j9k2m': {
    id: 'key-004',
    scope: 'Service',
    owner: 'Binetic Agent',
    role: 'Decentralized Worker',
    clearance: 8,
    permissions: ['read:*', 'execute:operators', 'execute:network', 'llm:*'],
  },
};

/**
 * REVOKED KEYS - explicitly blocked (for audit logging)
 */
const REVOKED_KEYS = new Set([
  'fgk_master_nexus_alpha9',  // Invalidated 2025-12-20
  'fgk_guest',                // Never valid
]);

// Store auth context per-request (using WeakMap to avoid memory leaks)
const authStore = new WeakMap<Request, AuthContext>();

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Auth middleware - validates Bearer token against known keys
 */
export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  // Extract token
  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.slice(7).trim() 
    : null;

  // No token = unauthorized
  if (!token) {
    return c.json({ 
      success: false, 
      error: 'Authorization required',
      code: 'AUTH_MISSING'
    }, 401);
  }

  // Check if key is revoked
  if (REVOKED_KEYS.has(token)) {
    console.warn(`[AUTH] Revoked key attempted: ${token.slice(0, 12)}...`);
    return c.json({ 
      success: false, 
      error: 'Access key has been revoked',
      code: 'KEY_REVOKED'
    }, 401);
  }

  // Validate key format (accept both fgk_ and bnk_)
  if (!token.startsWith('fgk_') && !token.startsWith('bnk_')) {
    return c.json({ 
      success: false, 
      error: 'Invalid key format',
      code: 'KEY_INVALID_FORMAT'
    }, 401);
  }

  // Lookup key
  const keyConfig = VALID_KEYS[token];
  if (!keyConfig) {
    console.warn(`[AUTH] Unknown key attempted: ${token.slice(0, 12)}...`);
    return c.json({ 
      success: false, 
      error: 'Invalid access key',
      code: 'KEY_NOT_FOUND'
    }, 401);
  }

  // Store auth context for this request
  authStore.set(c.req.raw, {
    key: token,
    config: keyConfig,
    authenticated: true,
  });

  console.log(`[AUTH] Authenticated: ${keyConfig.owner} (${keyConfig.scope})`);
  
  await next();
}

/**
 * Get auth context from request
 */
export function getAuth(c: Context): AuthContext | null {
  return authStore.get(c.req.raw) ?? null;
}

/**
 * Check if user has specific permission
 */
export function hasPermission(auth: AuthContext, permission: string): boolean {
  if (auth.config.permissions.includes('*')) return true;
  return auth.config.permissions.includes(permission);
}

// ============================================================================
// AUTH ROUTES
// ============================================================================

/**
 * Login endpoint - validates key and returns user info
 */
export async function handleLogin(c: Context<{ Bindings: Env }>) {
  const body = await c.req.json<{ apiKey?: string }>();
  const apiKey = body.apiKey?.trim();

  if (!apiKey) {
    return c.json({ success: false, error: 'API key required' }, 400);
  }

  // Check revoked
  if (REVOKED_KEYS.has(apiKey)) {
    return c.json({ 
      success: false, 
      error: 'This access key has been revoked',
      code: 'KEY_REVOKED'
    }, 401);
  }

  // Validate format (accept both fgk_ and bnk_)
  if (!apiKey.startsWith('fgk_') && !apiKey.startsWith('bnk_')) {
    return c.json({ 
      success: false, 
      error: 'Invalid key format. Keys must start with fgk_ or bnk_',
      code: 'KEY_INVALID_FORMAT'
    }, 401);
  }

  // Lookup key
  const keyConfig = VALID_KEYS[apiKey];
  if (!keyConfig) {
    return c.json({ 
      success: false, 
      error: 'Access denied. Key not recognized.',
      code: 'KEY_NOT_FOUND'
    }, 401);
  }

  console.log(`[AUTH] Login success: ${keyConfig.owner} (${keyConfig.scope})`);

  // Success - return user info
  return c.json({
    success: true,
    data: {
      user: {
        id: keyConfig.id,
        name: keyConfig.owner,
        role: keyConfig.role,
      },
      scope: keyConfig.scope,
      clearance: keyConfig.clearance,
      permissions: keyConfig.permissions,
    }
  });
}

/**
 * Verify endpoint - checks if current token is valid
 */
export async function handleVerify(c: Context<{ Bindings: Env }>) {
  const auth = getAuth(c);
  if (!auth) {
    return c.json({ success: false, error: 'Not authenticated' }, 401);
  }

  return c.json({
    success: true,
    data: {
      valid: true,
      user: {
        id: auth.config.id,
        name: auth.config.owner,
        role: auth.config.role,
      },
      scope: auth.config.scope,
      clearance: auth.config.clearance,
    }
  });
}

/**
 * Logout endpoint - for audit logging
 */
export async function handleLogout(c: Context<{ Bindings: Env }>) {
  const auth = getAuth(c);
  if (auth) {
    console.log(`[AUTH] Logout: ${auth.config.owner}`);
  }
  return c.json({ success: true, data: { message: 'Logged out' } });
}
