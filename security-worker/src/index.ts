import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './core-utils';
import { verifyKey, assertAuth } from './auth';
import { ApiKeyEntity, PolicyEntity, AuditLogEntity, UserEntity, ApprovalEntity } from './entities';

// Export the Durable Object class so Cloudflare can find it
export { SecurityDurableObject } from './core-utils';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

// Error handling
app.onError((err, c) => {
  console.error(err);
  return c.json({ success: false, error: err.message }, 500);
});

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

app.get('/', (c) => c.text('Binetic Security Worker Active'));

/**
 * Verify an API Key.
 * Used by the main application to check credentials.
 */
app.post('/verify', async (c) => {
  const body = await c.req.json<{ key: string }>();
  if (!body.key) return c.json({ success: false, error: 'Missing key' }, 400);

  const apiKey = await verifyKey(c.env, body.key);
  
  if (!apiKey) {
    return c.json({ success: false, error: 'Invalid key' }, 401);
  }

  // Update stats (fire and forget)
  c.executionCtx.waitUntil((async () => {
    if (apiKey.id !== 'root') {
      const entity = new ApiKeyEntity(c.env, apiKey.id);
      await entity.mutate(s => ({
        ...s,
        lastUsed: new Date().toISOString(),
        stats: {
          ...s.stats,
          totalRequests: s.stats.totalRequests + 1
        }
      }));
    }
  })());

  return c.json({ success: true, data: apiKey });
});

// ============================================================================
// PROTECTED ROUTES (Require Master/Admin Key)
// ============================================================================

// Middleware to enforce auth
app.use('/api/*', async (c, next) => {
  try {
    const apiKey = await assertAuth(c.env, c.req.raw);
    // Store user in context if needed
    await next();
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 401);
  }
});

// --- API KEYS ---

app.get('/api/keys', async (c) => {
  const { items } = await ApiKeyEntity.list(c.env);
  return c.json({ success: true, data: items });
});

app.post('/api/keys', async (c) => {
  const body = await c.req.json();
  // TODO: Validate body
  const id = body.id || crypto.randomUUID();
  const entity = new ApiKeyEntity(c.env, id);
  await entity.save({ ...ApiKeyEntity.initialState, ...body, id });
  return c.json({ success: true, data: await entity.getState() });
});

app.delete('/api/keys/:id', async (c) => {
  const id = c.req.param('id');
  const entity = new ApiKeyEntity(c.env, id);
  await entity.delete();
  return c.json({ success: true });
});

// --- POLICIES ---

app.get('/api/policies', async (c) => {
  const { items } = await PolicyEntity.list(c.env);
  return c.json({ success: true, data: items });
});

app.post('/api/policies', async (c) => {
  const body = await c.req.json();
  const id = body.id || crypto.randomUUID();
  const entity = new PolicyEntity(c.env, id);
  await entity.save({ ...PolicyEntity.initialState, ...body, id });
  return c.json({ success: true, data: await entity.getState() });
});

// --- AUDIT LOGS ---

app.get('/api/audit', async (c) => {
  const { items } = await AuditLogEntity.list(c.env, null, 100); // Limit to 100
  return c.json({ success: true, data: items });
});

app.post('/api/audit', async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID();
  const entity = new AuditLogEntity(c.env, id);
  await entity.save({ ...AuditLogEntity.initialState, ...body, id });
  return c.json({ success: true, data: await entity.getState() });
});

// --- SEED ---
// Helper to seed data if empty
app.post('/api/seed', async (c) => {
  await ApiKeyEntity.ensureSeed(c.env);
  await PolicyEntity.ensureSeed(c.env);
  await UserEntity.ensureSeed(c.env);
  await AuditLogEntity.ensureSeed(c.env);
  await ApprovalEntity.ensureSeed(c.env);
  return c.json({ success: true, message: 'Seeding complete' });
});

export default app;
