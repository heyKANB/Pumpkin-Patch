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
  startBakingSchema,
  collectPieSchema,
  expandKitchenSchema,
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
        cost = quantity * 10; // 10 coins per fertilizer
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
      } else if (item === "pies") {
        price = quantity * 40; // 40 coins per pie (premium price)
        hasEnough = player.pies >= quantity;
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
      } else if (item === "pies") {
        updates.pies = player.pies - quantity;
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

  // Get player's ovens
  app.get("/api/player/:id/ovens", async (req, res) => {
    try {
      await storage.updatePieBaking(); // Update baking status before returning ovens
      const ovens = await storage.getPlayerOvens(req.params.id);
      res.json(ovens);
    } catch (error) {
      res.status(500).json({ message: "Failed to get ovens" });
    }
  });

  // Start baking a pie
  app.post("/api/bake", async (req, res) => {
    try {
      const validatedData = startBakingSchema.parse(req.body);
      const { playerId, slotNumber } = validatedData;

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      if (player.pumpkins < 1) {
        return res.status(400).json({ message: "Not enough pumpkins to bake a pie" });
      }

      const oven = await storage.getOven(playerId, slotNumber);
      if (!oven) {
        return res.status(404).json({ message: "Oven slot not found" });
      }

      if (oven.state !== "empty") {
        return res.status(400).json({ message: "Oven slot is not empty" });
      }

      // Start baking
      const updatedPlayer = await storage.updatePlayer(playerId, {
        pumpkins: player.pumpkins - 1,
      });

      const updatedOven = await storage.updateOven(playerId, slotNumber, {
        state: "baking",
        startedAt: new Date(),
      });

      await storage.updatePieBaking();

      res.json({ 
        player: updatedPlayer, 
        oven: updatedOven,
        message: "Started baking pumpkin pie!" 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to start baking" });
    }
  });

  // Collect finished pie
  app.post("/api/collect-pie", async (req, res) => {
    try {
      const validatedData = collectPieSchema.parse(req.body);
      const { playerId, slotNumber } = validatedData;

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      const oven = await storage.getOven(playerId, slotNumber);
      if (!oven) {
        return res.status(404).json({ message: "Oven slot not found" });
      }

      if (oven.state !== "ready") {
        return res.status(400).json({ message: "Pie is not ready to collect" });
      }

      // Collect pie
      const updatedPlayer = await storage.updatePlayer(playerId, {
        pies: player.pies + 1,
      });

      const updatedOven = await storage.updateOven(playerId, slotNumber, {
        state: "empty",
        startedAt: null,
      });

      res.json({ 
        player: updatedPlayer, 
        oven: updatedOven,
        message: "Collected pumpkin pie!" 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to collect pie" });
    }
  });

  // Expand kitchen
  app.post("/api/expand-kitchen", async (req, res) => {
    try {
      const validatedData = expandKitchenSchema.parse(req.body);
      const { playerId } = validatedData;

      const result = await storage.expandPlayerKitchen(playerId);
      
      if (!result.success) {
        return res.status(400).json({ message: result.message, cost: result.cost });
      }

      const updatedPlayer = await storage.getPlayer(playerId);
      res.json({ 
        player: updatedPlayer, 
        message: result.message,
        cost: result.cost 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to expand kitchen" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
