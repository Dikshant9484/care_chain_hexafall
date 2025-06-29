import { 
  users, 
  contractAddresses, 
  careTokens, 
  careReceipts,
  type User, 
  type InsertUser,
  type ContractAddress,
  type InsertContractAddress,
  type CareToken,
  type InsertCareToken,
  type CareReceipt,
  type InsertCareReceipt
} from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Contract Addresses
  getContractAddresses(networkId: number): Promise<ContractAddress | undefined>;
  setContractAddresses(contracts: InsertContractAddress): Promise<ContractAddress>;

  // Care Tokens
  createCareToken(token: InsertCareToken): Promise<CareToken>;
  getCareTokensByAddress(senderAddress: string): Promise<CareToken[]>;

  // Care Receipts
  createCareReceipt(receipt: InsertCareReceipt): Promise<CareReceipt>;
  getCareReceiptsByAddress(receiverAddress: string): Promise<CareReceipt[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.walletAddress, walletAddress.toLowerCase()));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      ...user,
      walletAddress: user.walletAddress.toLowerCase()
    }).returning();
    return result[0];
  }

  async getContractAddresses(networkId: number): Promise<ContractAddress | undefined> {
    const result = await db.select().from(contractAddresses).where(eq(contractAddresses.networkId, networkId));
    return result[0];
  }

  async setContractAddresses(contracts: InsertContractAddress): Promise<ContractAddress> {
    const result = await db.insert(contractAddresses).values(contracts).returning();
    return result[0];
  }

  async createCareToken(token: InsertCareToken): Promise<CareToken> {
    const result = await db.insert(careTokens).values({
      ...token,
      senderAddress: token.senderAddress.toLowerCase()
    }).returning();
    return result[0];
  }

  async getCareTokensByAddress(senderAddress: string): Promise<CareToken[]> {
    return await db.select().from(careTokens)
      .where(eq(careTokens.senderAddress, senderAddress.toLowerCase()))
      .orderBy(desc(careTokens.createdAt));
  }

  async createCareReceipt(receipt: InsertCareReceipt): Promise<CareReceipt> {
    const result = await db.insert(careReceipts).values({
      ...receipt,
      receiverAddress: receipt.receiverAddress.toLowerCase(),
      originalSenderAddress: receipt.originalSenderAddress.toLowerCase()
    }).returning();
    return result[0];
  }

  async getCareReceiptsByAddress(receiverAddress: string): Promise<CareReceipt[]> {
    return await db.select().from(careReceipts)
      .where(eq(careReceipts.receiverAddress, receiverAddress.toLowerCase()))
      .orderBy(desc(careReceipts.createdAt));
  }
}

export const storage = new DatabaseStorage();
