import { Hono } from 'hono';
import { distributeToken } from './secrets/distributor';

const app = new Hono();

// 1. Initiate Registration: Generate OTT (One-Time Token)
app.post('/register', async (c) => {
  const { memberId, name, platformIdentity } = await c.req.json();
  // Logic: Store registration request in Redis/DB with TTL, return OTT
  return c.json({ status: 'initiated', token: 'reg_temp_token_123', expiresAt: new Date(Date.now() + 600000) });
});

// 2. Complete Activation: Verify Token and Bind Public Key
app.post('/activate', async (c) => {
  const { token, publicKey, signature } = await c.req.json();
  // Logic: Verify token, bind public key to member in familyMembers & authKeys tables
  // Verify signature if necessary for security
  return c.json({ status: 'activated', memberId: 'uuid-123' });
});

export default app;
