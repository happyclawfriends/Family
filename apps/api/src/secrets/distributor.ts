import { db, githubTokens, authKeys, familyMembers } from '@hcf/db';
import { eq } from 'drizzle-orm';
import crypto from 'node:crypto';

/**
 * Secret Distributor Service - HCF GitHub App Integration
 */

export const issueGitHubToken = async (memberId: string, signatureBase64: string, challenge: string) => {
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

  // The public key from WebCrypto is exported as SPKI (SubjectPublicKeyInfo) base64
  const publicKeyObject = crypto.createPublicKey({
    key: Buffer.from(keyRecord.publicKey, 'base64'),
    format: 'der',
    type: 'spki'
  });

  const isVerified = crypto.verify(
    null, // Ed25519 doesn't need a specific hash algorithm parameter here
    Buffer.from(challenge),
    publicKeyObject,
    Buffer.from(signatureBase64, 'base64')
  );

  if (!isVerified) {
    throw new Error('Security alert: Invalid identity signature');
  }

  // 3. Request Token from GitHub App
  const appId = process.env.GH_APP_ID;
  let privateKey = process.env.GH_APP_PRIVATE_KEY;
  const installationId = process.env.GH_APP_INSTALLATION_ID;

  if (!appId || !privateKey || !installationId) {
    throw new Error('System configuration error: GitHub App credentials missing');
  }

  // Format private key correctly if passed as single line string from env
  privateKey = privateKey.replace(/\\n/g, '\n');

  // Generate JWT for GitHub App Auth (RS256)
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60,
    exp: now + 10 * 60,
    iss: appId,
  };

  const header = { alg: 'RS256', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  
  const jwtSignature = crypto.sign('sha256', Buffer.from(signatureInput), privateKey).toString('base64url');
  const appJwt = `${signatureInput}.${jwtSignature}`;

  // Fetch installation access token
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
    const errorData = await response.text();
    throw new Error(`GitHub API Error: ${response.status} - ${errorData}`);
  }

  const tokenData = await response.json();
  const token = tokenData.token;
  const expires_at = tokenData.expires_at;

  // 4. Audit: Log the token issuance
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await db.insert(githubTokens).values({
    memberId,
    scope: 'bot-installation',
    tokenHash,
    expiresAt: new Date(expires_at),
  });

  console.log(`[Distributor] Issued GitHub App Token to bot: ${member.name} (${memberId})`);
  
  return { token, expiresAt: expires_at };
};

export const revokeToken = async (tokenHash: string) => {
  await db.update(githubTokens)
    .set({ revoked: true })
    .where(eq(githubTokens.tokenHash, tokenHash));
    
  console.log(`[Distributor] Revoked token with hash: ${tokenHash}`);
};
