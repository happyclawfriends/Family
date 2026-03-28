import crypto from "node:crypto";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const familyMembers = sqliteTable("family_members", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  type: text("type", { enum: ["human", "bot"] }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  platformIdentity: text("platform_identity").notNull(),
  humanId: text("human_id"),
  status: text("status", { enum: ["active", "inactive"] }).default("active"),
  registeredAt: integer("registered_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

export const authKeys = sqliteTable("auth_keys", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  memberId: text("member_id").references(() => familyMembers.id),
  publicKey: text("public_key").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

export const githubTokens = sqliteTable("github_tokens", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  memberId: text("member_id").references(() => familyMembers.id),
  scope: text("scope").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  revoked: integer("revoked", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

export const registrationTokens = sqliteTable("registration_tokens", {
  token: text("token").primaryKey(),
  memberId: text("member_id").references(() => familyMembers.id),
  meta: text("meta").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  used: integer("used", { mode: "boolean" }).default(false),
});
