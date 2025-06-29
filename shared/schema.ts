import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contractAddresses = pgTable("contract_addresses", {
  id: serial("id").primaryKey(),
  networkId: integer("network_id").notNull(),
  careTokenAddress: text("care_token_address"),
  careReceiptAddress: text("care_receipt_address"),
  deployedAt: timestamp("deployed_at").defaultNow().notNull(),
});

export const careTokens = pgTable("care_tokens", {
  id: serial("id").primaryKey(),
  tokenId: integer("token_id").notNull(),
  senderAddress: text("sender_address").notNull(),
  message: text("message").notNull(),
  transactionHash: text("transaction_hash").notNull(),
  networkId: integer("network_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const careReceipts = pgTable("care_receipts", {
  id: serial("id").primaryKey(),
  tokenId: integer("token_id").notNull(),
  receiverAddress: text("receiver_address").notNull(),
  originalSenderAddress: text("original_sender_address").notNull(),
  acknowledgmentMessage: text("acknowledgment_message").notNull(),
  transactionHash: text("transaction_hash").notNull(),
  networkId: integer("network_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertContractAddressSchema = createInsertSchema(contractAddresses).omit({
  id: true,
  deployedAt: true,
});

export const insertCareTokenSchema = createInsertSchema(careTokens).omit({
  id: true,
  createdAt: true,
});

export const insertCareReceiptSchema = createInsertSchema(careReceipts).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type ContractAddress = typeof contractAddresses.$inferSelect;
export type InsertContractAddress = z.infer<typeof insertContractAddressSchema>;
export type CareToken = typeof careTokens.$inferSelect;
export type InsertCareToken = z.infer<typeof insertCareTokenSchema>;
export type CareReceipt = typeof careReceipts.$inferSelect;
export type InsertCareReceipt = z.infer<typeof insertCareReceiptSchema>;
