import { Hono } from 'hono';
import { db, registrationTokens, authKeys, familyMembers } from '@hcf/db';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { issueGitHubToken } from './secrets/distributor.js';
import { serve } from '@hono/node-server';

const app = new Hono();

// 1. Initiate Registration: Generate OTT (One-Time Token)
app.post('/register', async (c) => {
  const { memberId, name, platformIdentity } = await c.req.json();
  
  // Strict Group Check: Only allow registration if platformIdentity matches our group
  try {
    const identity = typeof platformIdentity === 'string' ? JSON.parse(platformIdentity) : platformIdentity;
    if (identity.chat_id !== 'yuanbao:group:925227619') {
      return c.json({ error: 'Forbidden: Member must be in the HCF family group' }, 403);
    }
  } catch (e) {
    return c.json({ error: 'Invalid platform identity format' }, 400);
  }

  const token = `reg_${uuidv4()}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db.insert(registrationTokens).values({
    token,
    memberId,
    meta: JSON.stringify({ name, platformIdentity }),
    expiresAt,
  });

  return c.json({ status: 'initiated', token, expiresAt });
});

// 2. Complete Activation: Verify Token and Bind Public Key
app.post('/activate', async (c) => {
  const { token, publicKey } = await c.req.json();

  const [regRecord] = await db
    .select()
    .from(registrationTokens)
    .where(
      and(
        eq(registrationTokens.token, token),
        eq(registrationTokens.used, false)
      )
    );

  if (!regRecord || regRecord.expiresAt < new Date()) {
    return c.json({ error: 'Invalid or expired token' }, 400);
  }

  // Mark token as used and store public key
  await db.transaction(async (tx) => {
    await tx.update(registrationTokens).set({ used: true }).where(eq(registrationTokens.token, token));
    await tx.insert(authKeys).values({
      memberId: regRecord.memberId,
      publicKey,
    });
  });

  return c.json({ status: 'activated', memberId: regRecord.memberId });
});

// 3. Issue GitHub Token for Verified Bots
app.post('/issue-token', async (c) => {
  try {
    const { memberId, signature, challenge } = await c.req.json();
    
    // The challenge is a short-lived random string to prevent replay attacks
    const result = await issueGitHubToken(memberId, signature, challenge);
    return c.json({ status: 'success', ...result });
  } catch (e: any) {
    console.error(`[API Error] Token issuance failed: ${e.message}`);
    return c.json({ error: e.message }, 401);
  }
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 8002;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});

export default app;
