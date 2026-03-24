
import { pgTable, uuid, varchar, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const familyMembers = pgTable("family_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: varchar("type", { enum: ["human", "bot"] }).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  platformIdentity: text("platform_identity").notNull(), 
  humanId: uuid("human_id"), 
  status: varchar("status", { enum: ["active", "inactive"] }).default("active"),
  registeredAt: timestamp("registered_at").defaultNow(),
});

export const authKeys = pgTable("auth_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id").references(() => familyMembers.id),
  publicKey: text("public_key").notNull(), 
  createdAt: timestamp("created_at").defaultNow(),
});

export const githubTokens = pgTable("github_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id").references(() => familyMembers.id),
  scope: varchar("scope", { length: 256 }).notNull(),
  tokenHash: text("token_hash").notNull(), 
  expiresAt: timestamp("expires_at").notNull(),
  revoked: boolean("revoked").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const registrationTokens = pgTable("registration_tokens", {
  token: varchar("token", { length: 256 }).primaryKey(),
  memberId: uuid("member_id").references(() => familyMembers.id),
  meta: text("meta").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
});
