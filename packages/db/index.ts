import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schemas/schema.js';

const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/db';
const client = postgres(connectionString);
export const db = drizzle(client, { schema });

export * from './schemas/schema.js';
