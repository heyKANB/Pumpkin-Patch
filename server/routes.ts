import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  plantSeedSchema, 
  harvestPlotSchema, 
  buyItemSchema, 
  sellItemSchema,
  type PlantSeedRequest,
  type HarvestPlotRequest,
  type BuyItemRequest,
  type SellItemRequest
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get player data
  app.get("/api/player/:id", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      res.json(player);
    } catch (error) {
      res.status(500).json({ message: "Failed to get player" });
    }
  });

  // Get player's field plots
  app.get("/api/player/:id/plots", async (req, res) => {
    try {
      await storage.updatePumpkinGrowth(); // Update growth before returning plots
      const plots = await storage.getPlayerPlots(req.params.id);
      res.json(plots);
    } catch (error) {
      res.status(500).json({ message: "Failed to get plots" });
    }
  });

  // Plant a seed
  app.post("/api/plant", async (req, res) => {
    try {
      const { playerId, row, col } = plantSeedSchema.parse(req.body);
      
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      if (player.seeds <= 0) {
        return res.status(400).json({ message: "Not enough seeds" });
      }

      const plot = await storage.getPlot(playerId, row, col);
      if (!plot || plot.state !== "empty") {
        return res.status(400).json({ message: "Plot is not available for planting" });
      }

      // Update plot to planted
      await storage.updatePlot(playerId, row, col, {
        state: "seedling",
        plantedAt: new Date(),
      });

      // Update player seeds
      await storage.updatePlayer(playerId, {
        seeds: player.seeds - 1,
      });

      const updatedPlayer = await storage.getPlayer(playerId);
      const updatedPlots = await storage.getPlayerPlots(playerId);

      res.json({ 
        player: updatedPlayer, 
        plots: updatedPlots,
        message: "Seed planted successfully!"
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Harvest a plot
  app.post("/api/harvest", async (req, res) => {
    try {
      const { playerId, row, col } = harvestPlotSchema.parse(req.body);
      
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      const plot = await storage.getPlot(playerId, row, col);
      if (!plot || plot.state !== "mature") {
        return res.status(400).json({ message: "Plot is not ready for harvest" });
      }

      // Update plot to empty
      await storage.updatePlot(playerId, row, col, {
        state: "empty",
        plantedAt: null,
      });

      // Update player pumpkins
      await storage.updatePlayer(playerId, {
        pumpkins: player.pumpkins + 1,
      });

      const updatedPlayer = await storage.getPlayer(playerId);
      const updatedPlots = await storage.getPlayerPlots(playerId);

      res.json({ 
        player: updatedPlayer, 
        plots: updatedPlots,
        message: "Pumpkin harvested!"
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Buy items
  app.post("/api/buy", async (req, res) => {
    try {
      const { playerId, item, quantity } = buyItemSchema.parse(req.body);
      
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      let cost = 0;
      if (item === "seeds") {
        cost = quantity * 10; // 10 coins per seed
      }

      if (player.coins < cost) {
        return res.status(400).json({ message: "Not enough coins" });
      }

      const updates: any = {
        coins: player.coins - cost,
      };

      if (item === "seeds") {
        updates.seeds = player.seeds + quantity;
      }

      await storage.updatePlayer(playerId, updates);

      const updatedPlayer = await storage.getPlayer(playerId);
      res.json({ 
        player: updatedPlayer,
        message: `Bought ${quantity} ${item} for ${cost} coins!`
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Sell items
  app.post("/api/sell", async (req, res) => {
    try {
      const { playerId, item, quantity } = sellItemSchema.parse(req.body);
      
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      let price = 0;
      if (item === "pumpkins") {
        price = quantity * 25; // 25 coins per pumpkin
        
        if (player.pumpkins < quantity) {
          return res.status(400).json({ message: "Not enough pumpkins" });
        }
      }

      const updates: any = {
        coins: player.coins + price,
      };

      if (item === "pumpkins") {
        updates.pumpkins = player.pumpkins - quantity;
      }

      await storage.updatePlayer(playerId, updates);

      const updatedPlayer = await storage.getPlayer(playerId);
      res.json({ 
        player: updatedPlayer,
        message: `Sold ${quantity} ${item} for ${price} coins!`
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
