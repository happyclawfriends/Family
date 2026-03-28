import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schemas/schema.js';

const dbPath = path.resolve(process.env.HCF_DB_PATH ?? process.env.SQLITE_DB_PATH ?? './hcf.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const client = new Database(dbPath);
client.pragma('journal_mode = WAL');
client.exec(`
  CREATE TABLE IF NOT EXISTS family_members (
    id TEXT PRIMARY KEY NOT NULL,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    platform_identity TEXT NOT NULL,
    human_id TEXT,
    status TEXT DEFAULT 'active',
    registered_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS auth_keys (
    id TEXT PRIMARY KEY NOT NULL,
    member_id TEXT,
    public_key TEXT NOT NULL,
    created_at INTEGER,
    FOREIGN KEY (member_id) REFERENCES family_members(id)
  );

  CREATE TABLE IF NOT EXISTS github_tokens (
    id TEXT PRIMARY KEY NOT NULL,
    member_id TEXT,
    scope TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    revoked INTEGER DEFAULT 0,
    created_at INTEGER,
    FOREIGN KEY (member_id) REFERENCES family_members(id)
  );

  CREATE TABLE IF NOT EXISTS registration_tokens (
    token TEXT PRIMARY KEY NOT NULL,
    member_id TEXT,
    meta TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    used INTEGER DEFAULT 0,
    FOREIGN KEY (member_id) REFERENCES family_members(id)
  );
`);

export const db = drizzle(client, { schema });

export * from './schemas/schema.js';
