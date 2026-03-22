
import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const familyMembers = pgTable("family_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: varchar("type", { enum: ["human", "bot"] }).notNull(),
  name: varchar("name", 256).notNull(),
  description: text("description"),
  platformIdentity: text("platform_identity").notNull(), // Stores metadata as JSON string (sender_id, chat_id)
  humanId: uuid("human_id"), // Nullable for humans
  status: varchar("status", { enum: ["active", "inactive"] }).default("active"),
  registeredAt: timestamp("registered_at").defaultNow(),
});

export const authKeys = pgTable("auth_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id").references(() => familyMembers.id),
  publicKey: text("public_key").notNull(), // Ed25519 public key
  createdAt: timestamp("created_at").defaultNow(),
});
