/**
 * Binetic Security Worker - Authentication Logic
 */
import type { Env } from './core-utils';
import { ApiKeyEntity } from './entities';
import type { ApiKey } from './types';

/**
 * Verifies a provided API key string against the database.
 * Returns the ApiKey object if valid, null otherwise.
 */
export async function verifyKey(env: Env, keyString: string): Promise<ApiKey | null> {
  // 1. Check for Root Key (bypass database)
  if (env.ROOT_KEY && keyString === env.ROOT_KEY) {
    return {
      id: 'root',
      name: 'System Root',
      key: keyString,
      scope: 'Master',
      owner: 'system',
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: null,
      lastUsed: new Date().toISOString(),
      metadata: { description: 'Root access', tags: ['root'] },
      rateLimit: { rpm: 10000, rph: 100000 },
      stats: { totalRequests: 0, errorRate: 0, activeSessions: 0 }
    };
  }

  // 2. List all keys and find the match.
  // Note: This is O(N). For production with many keys, implement a reverse index (key -> id).
  const { items } = await ApiKeyEntity.list(env, null, 1000);
  
  const match = items.find(k => k.key === keyString && k.status === 'active');
  
  if (!match) return null;
  
  // 3. Check expiration
  if (match.expiresAt && new Date(match.expiresAt) < new Date()) {
    return null;
  }
  
  return match;
}

/**
 * Middleware helper to assert authentication.
 * Throws if invalid.
 */
export async function assertAuth(env: Env, request: Request): Promise<ApiKey> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing Bearer token');
  }

  const key = authHeader.split(' ')[1];
  const apiKey = await verifyKey(env, key);

  if (!apiKey) {
    throw new Error('Unauthorized: Invalid API key');
  }

  return apiKey;
}
