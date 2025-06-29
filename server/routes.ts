import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertContractAddressSchema, insertCareTokenSchema, insertCareReceiptSchema } from "@shared/schema";
import { z } from "zod";

const deployContractsSchema = z.object({
  networkId: z.number(),
  careTokenAddress: z.string(),
  careReceiptAddress: z.string(),
});

const submitCareSchema = z.object({
  tokenId: z.number(),
  senderAddress: z.string(),
  message: z.string().min(1).max(140),
  transactionHash: z.string(),
  networkId: z.number(),
});

const acknowledgeCareSchema = z.object({
  tokenId: z.number(),
  receiverAddress: z.string(),
  originalSenderAddress: z.string(),
  acknowledgmentMessage: z.string().min(1).max(140),
  transactionHash: z.string(),
  networkId: z.number(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByWalletAddress(userData.walletAddress);
      if (existingUser) {
        return res.json(existingUser);
      }

      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid user data" });
    }
  });

  app.get("/api/users/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const user = await storage.getUserByWalletAddress(walletAddress);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Contract routes
  app.get("/api/contracts/:networkId", async (req, res) => {
    try {
      const networkId = parseInt(req.params.networkId);
      const contracts = await storage.getContractAddresses(networkId);
      
      if (!contracts) {
        return res.status(404).json({ error: "Contracts not deployed for this network" });
      }

      res.json(contracts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get contract addresses" });
    }
  });

  app.post("/api/contracts/deploy", async (req, res) => {
    try {
      const contractData = deployContractsSchema.parse(req.body);
      
      // Check if contracts already exist for this network
      const existingContracts = await storage.getContractAddresses(contractData.networkId);
      if (existingContracts) {
        return res.status(400).json({ error: "Contracts already deployed for this network" });
      }

      const contracts = await storage.setContractAddresses(contractData);
      res.json(contracts);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid contract data" });
    }
  });

  // Care token routes
  app.post("/api/care-tokens", async (req, res) => {
    try {
      const tokenData = submitCareSchema.parse(req.body);
      const careToken = await storage.createCareToken(tokenData);
      res.json(careToken);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid care token data" });
    }
  });

  app.get("/api/care-tokens/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const tokens = await storage.getCareTokensByAddress(address);
      res.json(tokens);
    } catch (error) {
      res.status(500).json({ error: "Failed to get care tokens" });
    }
  });

  // Care receipt routes
  app.post("/api/care-receipts", async (req, res) => {
    try {
      const receiptData = acknowledgeCareSchema.parse(req.body);
      const careReceipt = await storage.createCareReceipt(receiptData);
      res.json(careReceipt);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid care receipt data" });
    }
  });

  app.get("/api/care-receipts/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const receipts = await storage.getCareReceiptsByAddress(address);
      res.json(receipts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get care receipts" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
