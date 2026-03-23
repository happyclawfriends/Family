import { db, githubTokens, authKeys, familyMembers } from '@hcf/db';
import { eq } from 'drizzle-orm';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

/**
 * Secret Distributor Service - HCF GitHub App Integration
 */

export const issueGitHubToken = async (memberId: string, signature: string, challenge: string) => {
  // 1. Verify Identity: Check if the member is a BOT and is AUTHORIZED
  const [member] = await db
    .select()
    .from(familyMembers)
    .where(eq(familyMembers.id, memberId));

  if (!member || member.type !== 'bot' || member.status !== 'active') {
    throw new Error('Unauthorized: Only active bots can request tokens');
  }

  // 2. Verify Signature: Use stored public key to verify the bot's request
  const [keyRecord] = await db
    .select()
    .from(authKeys)
    .where(eq(authKeys.memberId, memberId));

  if (!keyRecord) {
    throw new Error('Identity fault: No public key found for this bot');
  }

  const isVerified = crypto.verify(
    "Ed25519",
    Buffer.from(challenge),
    Buffer.from(keyRecord.publicKey, 'base64'),
    Buffer.from(signature, 'base64')
  );

  if (!isVerified) {
    throw new Error('Security alert: Invalid identity signature');
  }

  // 3. Request Token from GitHub App
  const appId = process.env.GH_APP_ID;
  const privateKey = process.env.GH_APP_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const installationId = process.env.GH_APP_INSTALLATION_ID;

  if (!appId || !privateKey || !installationId) {
    throw new Error('System configuration error: GitHub App credentials missing');
  }

  // Generate JWT for GitHub App Auth
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60,
    exp: now + 10 * 60,
    iss: appId,
  };

  const appJwt = jwt.sign(payload, privateKey, { algorithm: 'RS256' });

  // Fetch installation token
  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${appJwt}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`GitHub API Error: ${JSON.stringify(errorData)}`);
  }

  const { token, expires_at } = await response.json() as { token: string, expires_at: string };

  // 4. Audit: Log the token issuance
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await db.insert(githubTokens).values({
    memberId,
    scope: 'bot-runtime',
    tokenHash,
    expiresAt: new Date(expires_at),
  });

  console.log(`[Distributor] Issued GitHub Token to bot: ${member.name}`);
  
  return { token, expiresAt: expires_at };
};
