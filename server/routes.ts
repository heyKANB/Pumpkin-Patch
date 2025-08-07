import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  plantSeedSchema, 
  harvestPlotSchema, 
  fertilizePlotSchema,
  buyItemSchema, 
  sellItemSchema,
  expandFieldSchema,
  type PlantSeedRequest,
  type HarvestPlotRequest,
  type BuyItemRequest,
  type SellItemRequest,
  type ExpandFieldRequest
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

      // Update plot to empty and reset fertilizer
      await storage.updatePlot(playerId, row, col, {
        state: "empty",
        plantedAt: null,
        fertilized: 0,
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

  // Fertilize plot
  app.post("/api/fertilize", async (req, res) => {
    try {
      const { playerId, row, col } = fertilizePlotSchema.parse(req.body);
      
      const plot = await storage.getPlot(playerId, row, col);
      if (!plot) {
        return res.status(404).json({ message: "Plot not found" });
      }

      if (plot.state === "empty" || plot.state === "mature") {
        return res.status(400).json({ message: "Can only fertilize seedlings or growing plants" });
      }

      if (plot.fertilized) {
        return res.status(400).json({ message: "This plot is already fertilized" });
      }

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      if (player.fertilizer < 1) {
        return res.status(400).json({ message: "Not enough fertilizer" });
      }

      // Apply fertilizer to the plot
      await storage.updatePlot(playerId, row, col, { 
        fertilized: 1
      });

      // Use one fertilizer from player inventory
      await storage.updatePlayer(playerId, {
        fertilizer: player.fertilizer - 1,
      });

      const updatedPlayer = await storage.getPlayer(playerId);
      res.json({ 
        player: updatedPlayer,
        message: "Fertilizer applied! Growth speed doubled! ⚡"
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
      let itemName = item;
      
      // Define pricing for different items
      if (item === "seeds") {
        cost = quantity * 10; // 10 coins per seed
      } else if (item === "fertilizer") {
        cost = quantity * 25; // 25 coins per fertilizer
        itemName = "fertilizer";
      } else if (item === "tools") {
        cost = quantity * 50; // 50 coins per tool
        itemName = "tools";
      }

      if (player.coins < cost) {
        return res.status(400).json({ message: "Not enough coins" });
      }

      const updates: any = {
        coins: player.coins - cost,
      };

      // Update inventory based on item type
      if (item === "seeds") {
        updates.seeds = player.seeds + quantity;
      } else if (item === "fertilizer") {
        updates.fertilizer = player.fertilizer + quantity;
      } else if (item === "tools") {
        updates.tools = player.tools + quantity;
      }

      await storage.updatePlayer(playerId, updates);

      const updatedPlayer = await storage.getPlayer(playerId);
      res.json({ 
        player: updatedPlayer,
        message: `Bought ${quantity} ${itemName} for ${cost} coins!`
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
      let hasEnough = false;
      
      if (item === "pumpkins") {
        price = quantity * 25; // 25 coins per pumpkin
        hasEnough = player.pumpkins >= quantity;
      } else if (item === "seeds") {
        price = quantity * 8; // 8 coins per seed (sell for less than buy price)
        hasEnough = player.seeds >= quantity;
      }

      if (!hasEnough) {
        return res.status(400).json({ message: `Not enough ${item}` });
      }

      const updates: any = {
        coins: player.coins + price,
      };

      if (item === "pumpkins") {
        updates.pumpkins = player.pumpkins - quantity;
      } else if (item === "seeds") {
        updates.seeds = player.seeds - quantity;
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

  // Expand field
  app.post("/api/expand", async (req, res) => {
    try {
      const { playerId } = expandFieldSchema.parse(req.body);
      
      const result = await storage.expandPlayerField(playerId);
      
      if (!result.success) {
        return res.status(400).json({ message: result.message, cost: result.cost });
      }

      const updatedPlayer = await storage.getPlayer(playerId);
      const updatedPlots = await storage.getPlayerPlots(playerId);

      res.json({ 
        player: updatedPlayer, 
        plots: updatedPlots,
        message: result.message
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
