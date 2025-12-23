/**
 * Binetic AGI - Authentication Module
 * 
 * SECURITY: Delegates authentication to the private Security Worker.
 * No secrets are stored in this repository.
 */

import type { Context, Next } from 'hono';
import type { Env } from './core-utils';
import { PolicyEntity } from './entities';

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

// Store auth context per-request (using WeakMap to avoid memory leaks)
const authStore = new WeakMap<Request, AuthContext>();

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Auth middleware - validates Bearer token against Security Worker
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

  // Validate key format (accept both fgk_ and bnk_)
  if (!token.startsWith('fgk_') && !token.startsWith('bnk_')) {
    return c.json({ 
      success: false, 
      error: 'Invalid key format',
      code: 'KEY_INVALID_FORMAT'
    }, 401);
  }

  // Verify with Security Worker
  let keyConfig: KeyConfig | null = null;

  try {
    const json = await callSecurityWorker(c.env, '/verify', 'POST', { key: token });
    
    if (json.success && json.data) {
      const k = json.data;
      keyConfig = {
        id: k.id,
        scope: k.scope,
        owner: k.owner,
        role: k.role || 'User',
        clearance: k.clearance || 1,
        permissions: k.permissions || []
      };
    } else {
        console.warn(`[AUTH] Security Worker rejected key: ${json.error}`);
    }
  } catch (e) {
    console.error('[AUTH] Security Worker connection failed:', e);
    return c.json({ success: false, error: 'Security service unavailable' }, 503);
  }

  if (!keyConfig) {
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
  
  // Enforce IP Policies (Skip for Master/Admin to prevent lockout)
  if (keyConfig.scope !== 'Master' && keyConfig.scope !== 'Admin') {
    const ip = c.req.header('CF-Connecting-IP') || '0.0.0.0';
    try {
      const { items: policies } = await PolicyEntity.list(c.env);
      
      for (const policy of policies) {
        if (!policy.enabled) continue;
        
        // Check Blacklist
        if (policy.restrictions.ipBlacklist?.length > 0) {
          for (const blocked of policy.restrictions.ipBlacklist) {
            if (matchIp(ip, blocked)) {
               console.warn(`[AUTH] IP ${ip} blocked by policy ${policy.id} (blacklist: ${blocked})`);
               return c.json({ success: false, error: 'Access denied by policy (IP Blocked)' }, 403);
            }
          }
        }
        
        // Check Whitelist
        if (policy.restrictions.ipWhitelist?.length > 0) {
          let allowed = false;
          for (const white of policy.restrictions.ipWhitelist) {
            if (matchIp(ip, white)) {
              allowed = true;
              break;
            }
          }
          if (!allowed) {
             console.warn(`[AUTH] IP ${ip} blocked by policy ${policy.id} (not in whitelist)`);
             return c.json({ success: false, error: 'Access denied by policy (IP not whitelisted)' }, 403);
          }
        }
      }
    } catch (e) {
      console.error('[AUTH] Policy check failed:', e);
      // Fail closed
      return c.json({ success: false, error: 'Policy enforcement error' }, 500);
    }
  }

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

  if (!c.env.SECURITY_WORKER && !c.env.SECURITY_WORKER_URL) {
      return c.json({ success: false, error: 'Security configuration missing' }, 500);
  }

  try {
    const json = await callSecurityWorker(c.env, '/verify', 'POST', { key: apiKey });

    if (!json.success || !json.data) {
        return c.json({ success: false, error: json.error || 'Invalid credentials' }, 401);
    }

    const k = json.data;
    const keyConfig: KeyConfig = {
        id: k.id,
        scope: k.scope,
        owner: k.owner,
        role: k.role || 'User',
        clearance: k.clearance || 1,
        permissions: k.permissions || []
    };

    console.log(`[AUTH] Login success: ${keyConfig.owner} (${keyConfig.scope})`);

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

  } catch (e: any) {
      console.error('[AUTH] Login failed:', e);
      return c.json({ success: false, error: e.message || 'Login service unavailable' }, 503);
  }
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

/**
 * Helper to call the Security Worker API
 */
export async function callSecurityWorker(env: Env, path: string, method: string = 'GET', body?: any) {
  if (!env.SECURITY_WORKER_URL) throw new Error('Security Worker URL not configured');
  
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : '/' + path;
  
  // Use Service Binding if available, otherwise fallback to URL (for local dev if not using bindings)
  let res: Response;
  
  if (env.SECURITY_WORKER) {
      res = await env.SECURITY_WORKER.fetch(`http://internal${normalizedPath}`, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.SERVICE_KEY}`
        },
        body: body ? JSON.stringify(body) : undefined
      });
  } else if (env.SECURITY_WORKER_URL) {
      res = await fetch(`${env.SECURITY_WORKER_URL}${normalizedPath}`, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.SERVICE_KEY}`
        },
        body: body ? JSON.stringify(body) : undefined
      });
  } else {
      throw new Error('Security Worker not configured (missing binding or URL)');
  }
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Security Worker error: ${res.status} ${text}`);
  }
  
  return res.json();
}

/**
 * Helper to match IP against wildcard patterns
 * Supports * for any substring
 */
function matchIp(ip: string, pattern: string): boolean {
  if (pattern === '*') return true;
  // Escape dots, replace * with .*
  const regexStr = '^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$';
  return new RegExp(regexStr).test(ip);
}
