/**
 * Binetic AGI - Authentication Module
 * 
 * SECURITY: Delegates authentication to the private Security Worker.
 * No secrets are stored in this repository.
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

  if (c.env.SECURITY_WORKER_URL) {
    try {
      const res = await fetch(`${c.env.SECURITY_WORKER_URL}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: token })
      });
      
      if (res.ok) {
        const json = await res.json() as any;
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
      } else {
        console.error(`[AUTH] Security Worker returned ${res.status}`);
      }
    } catch (e) {
      console.error('[AUTH] Security Worker connection failed:', e);
      return c.json({ success: false, error: 'Security service unavailable' }, 503);
    }
  } else {
    console.error('[AUTH] SECURITY_WORKER_URL not configured');
    return c.json({ success: false, error: 'Security configuration missing' }, 500);
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

  if (!c.env.SECURITY_WORKER_URL) {
      return c.json({ success: false, error: 'Security configuration missing' }, 500);
  }

  try {
    const res = await fetch(`${c.env.SECURITY_WORKER_URL}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: apiKey })
    });

    if (!res.ok) {
        return c.json({ success: false, error: 'Invalid credentials' }, 401);
    }

    const json = await res.json() as any;
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

  } catch (e) {
      console.error('[AUTH] Login failed:', e);
      return c.json({ success: false, error: 'Login service unavailable' }, 503);
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
  
  const res = await fetch(`${env.SECURITY_WORKER_URL}${normalizedPath}`, {
    method,
    headers: { 
      'Content-Type': 'application/json',
      // Forward the auth token if we had one? 
      // For now, we assume the frontend worker has a "service key" or similar to talk to security worker.
      // But wait, security worker protects its API with the same auth middleware.
      // So we need to pass a valid key.
      // The frontend worker should probably have a ROOT_KEY or a Service Key configured.
    },
    body: body ? JSON.stringify(body) : undefined
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Security Worker error: ${res.status} ${text}`);
  }
  
  return res.json();
}
