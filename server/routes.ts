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
  unlockKitchenSchema,
  rewardCoinsSchema,
  completeChallengeSchema,
  updateChallengeProgressSchema,
  unlockLevelSchema,
  collectDailyCoinsSchema,
  fulfillOrderSchema,
  type PlantSeedRequest,
  type HarvestPlotRequest,
  type BuyItemRequest,
  type SellItemRequest,
  type ExpandFieldRequest,
  type RewardCoinsRequest
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get player data
  app.get("/api/player/:id", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      // Check if player has plots initialized, if not initialize them
      const plots = await storage.getPlayerPlots(req.params.id);
      if (plots.length === 0) {
        console.log(`Initializing field for existing player: ${req.params.id}`);
        await storage.initializePlayerField(req.params.id);
        await storage.initializePlayerKitchen(req.params.id);
      }
      
      // Include daily coin collection status
      console.log('🪙 Routes: Getting daily coins status for player:', req.params.id);
      const dailyCoins = await storage.canCollectDailyCoins(req.params.id);
      console.log('🪙 Routes: Daily coins status result:', dailyCoins);
      
      const responseData = { 
        ...player, 
        canCollectDailyCoins: dailyCoins.canCollect,
        hoursUntilNextDaily: dailyCoins.hoursUntilNext 
      };
      
      console.log('🪙 Routes: Player response with daily coins:', {
        id: responseData.id,
        coins: responseData.coins,
        canCollectDailyCoins: responseData.canCollectDailyCoins,
        hoursUntilNextDaily: responseData.hoursUntilNextDaily,
        lastDailyCollection: responseData.lastDailyCollection
      });
      
      res.json(responseData);
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
      const { playerId, row, col, cropType = "pumpkin" } = plantSeedSchema.parse(req.body);
      
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      // Check if player has the right type of seeds
      const hasSeeds = cropType === "apple" ? 
        (player.appleSeeds > 0) : 
        (player.seeds > 0);
      
      if (!hasSeeds) {
        return res.status(400).json({ 
          message: `Not enough ${cropType} seeds` 
        });
      }

      const plot = await storage.getPlot(playerId, row, col);
      if (!plot) {
        return res.status(400).json({ message: "Plot not found" });
      }
      if (plot.state !== "empty") {
        return res.status(400).json({ 
          message: `Plot already has a ${plot.state} ${plot.cropType}. Cannot plant here.` 
        });
      }

      // Update plot to planted
      await storage.updatePlot(playerId, row, col, {
        state: "seedling",
        cropType: cropType,
        plantedAt: new Date(),
      });

      // Deduct the appropriate seeds
      const seedUpdate = cropType === "apple" ? 
        { appleSeeds: player.appleSeeds - 1 } : 
        { seeds: player.seeds - 1 };
      
      await storage.updatePlayer(playerId, seedUpdate);

      const updatedPlayer = await storage.getPlayer(playerId);
      const updatedPlots = await storage.getPlayerPlots(playerId);

      // Update plant challenge progress
      await storage.updateChallengeProgress(playerId, "daily-plant", 1);

      // Gain experience for planting (5 XP per plant)
      const expResult = await storage.addExperience(playerId, 5);

      const message = expResult.leveledUp ? 
        `${cropType.charAt(0).toUpperCase() + cropType.slice(1)} seed planted! Leveled up to ${expResult.newLevel}!` :
        `${cropType.charAt(0).toUpperCase() + cropType.slice(1)} seed planted successfully!`;

      res.json({ 
        player: updatedPlayer, 
        plots: updatedPlots,
        message,
        leveledUp: expResult.leveledUp,
        newLevel: expResult.newLevel
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

      // Update player with harvested crop
      const cropUpdate = plot.cropType === "apple" ? 
        { apples: player.apples + 1 } : 
        { pumpkins: player.pumpkins + 1 };
      
      await storage.updatePlayer(playerId, cropUpdate);

      // Update harvest challenge progress
      await storage.updateChallengeProgress(playerId, "daily-harvest", 1);

      // Gain experience for harvesting (10 XP per harvest)
      const expResult = await storage.addExperience(playerId, 10);
      const updatedPlayer = await storage.getPlayer(playerId);
      const updatedPlots = await storage.getPlayerPlots(playerId);

      const cropName = plot.cropType === "apple" ? "Apple" : "Pumpkin";
      const message = expResult.leveledUp ? 
        `${cropName} harvested! Leveled up to ${expResult.newLevel}!` :
        `${cropName} harvested!`;

      res.json({ 
        player: updatedPlayer, 
        plots: updatedPlots,
        message,
        leveledUp: expResult.leveledUp,
        newLevel: expResult.newLevel
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

  // Level unlocking route
  app.post("/api/unlock-level", async (req, res) => {
    try {
      const unlockRequest = unlockLevelSchema.parse(req.body);
      const result = await storage.unlockNextLevel(unlockRequest.playerId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
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

      // Check level restrictions
      if (item === "apple-seeds" && player.level < 2) {
        return res.status(400).json({ message: "Apple seeds unlock at level 2!" });
      }

      let cost = 0;
      let itemName = item;
      
      // Define pricing for different items
      if (item === "seeds") {
        cost = quantity * 10; // 10 coins per pumpkin seed
      } else if (item === "apple-seeds") {
        cost = quantity * 5; // 5 coins per apple seed
        itemName = "apple-seeds";
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
      } else if (item === "apple-seeds") {
        updates.appleSeeds = player.appleSeeds + quantity;
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
        price = quantity * 22; // 22 coins per pumpkin (discounted from order fulfillment)
        hasEnough = player.pumpkins >= quantity;
      } else if (item === "apples") {
        price = quantity * 12; // 12 coins per apple (discounted from order fulfillment)
        hasEnough = player.apples >= quantity;
      } else if (item === "seeds") {
        price = quantity * 8; // 8 coins per seed (sell for less than buy price)
        hasEnough = player.seeds >= quantity;
      } else if (item === "apple-seeds") {
        price = quantity * 4; // 4 coins per apple seed (sell for less than buy price)
        hasEnough = player.appleSeeds >= quantity;
      } else if (item === "pies") {
        price = quantity * 40; // 40 coins per pie (premium price)
        hasEnough = player.pies >= quantity;
      } else if (item === "apple-pies") {
        price = quantity * 25; // 25 coins per apple pie
        hasEnough = player.applePies >= quantity;
      }

      if (!hasEnough) {
        return res.status(400).json({ message: `Not enough ${item}` });
      }

      const updates: any = {
        coins: player.coins + price,
      };

      if (item === "pumpkins") {
        updates.pumpkins = player.pumpkins - quantity;
      } else if (item === "apples") {
        updates.apples = player.apples - quantity;
      } else if (item === "seeds") {
        updates.seeds = player.seeds - quantity;
      } else if (item === "apple-seeds") {
        updates.appleSeeds = player.appleSeeds - quantity;
      } else if (item === "pies") {
        updates.pies = player.pies - quantity;
      } else if (item === "apple-pies") {
        updates.applePies = player.applePies - quantity;
      }

      await storage.updatePlayer(playerId, updates);

      // Update earn coins challenge progress
      await storage.updateChallengeProgress(playerId, "daily-earn", price);

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

      // Update expand challenge progress
      await storage.updateChallengeProgress(playerId, "daily-expand", 1);

      // Gain experience for expanding field (25 XP per expansion)
      const expResult = await storage.addExperience(playerId, 25);
      const finalPlayer = await storage.getPlayer(playerId);

      const message = expResult.leveledUp ? 
        `${result.message} Leveled up to ${expResult.newLevel}!` :
        result.message;

      res.json({ 
        player: finalPlayer, 
        plots: updatedPlots,
        message,
        leveledUp: expResult.leveledUp,
        newLevel: expResult.newLevel
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
      const { playerId, slotNumber, pieType } = validatedData;

      const { player, oven } = await storage.startBaking(playerId, slotNumber, pieType);
      
      await storage.updatePieBaking();

      const pieTypeName = pieType === "apple" ? "apple pie" : "pumpkin pie";
      res.json({ 
        player, 
        oven,
        message: `Started baking ${pieTypeName}!` 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to start baking" });
    }
  });

  // Collect finished pie
  app.post("/api/collect-pie", async (req, res) => {
    try {
      const validatedData = collectPieSchema.parse(req.body);
      const { playerId, slotNumber } = validatedData;

      const oven = await storage.getOven(playerId, slotNumber);
      const pieTypeName = oven?.pieType === "apple" ? "apple pie" : "pumpkin pie";

      const { player, oven: updatedOven } = await storage.collectPie(playerId, slotNumber);

      // Update bake challenge progress
      await storage.updateChallengeProgress(playerId, "daily-bake", 1);

      // Gain experience for baking (15 XP per pie)
      const expResult = await storage.addExperience(playerId, 15);
      const finalPlayer = await storage.getPlayer(playerId);

      const message = expResult.leveledUp ? 
        `${pieTypeName.charAt(0).toUpperCase() + pieTypeName.slice(1)} collected! Leveled up to ${expResult.newLevel}!` :
        `${pieTypeName.charAt(0).toUpperCase() + pieTypeName.slice(1)} collected!`;

      res.json({ 
        player: finalPlayer, 
        oven: updatedOven,
        message,
        leveledUp: expResult.leveledUp,
        newLevel: expResult.newLevel
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to collect pie" });
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
      
      // Update expand challenge progress
      await storage.updateChallengeProgress(playerId, "daily-expand", 1);

      // Gain experience for expanding kitchen (20 XP per expansion)
      const expResult = await storage.addExperience(playerId, 20);
      const finalPlayer = await storage.getPlayer(playerId);

      const message = expResult.leveledUp ? 
        `${result.message} Leveled up to ${expResult.newLevel}!` :
        result.message;
      
      res.json({ 
        player: finalPlayer, 
        message,
        cost: result.cost,
        leveledUp: expResult.leveledUp,
        newLevel: expResult.newLevel
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to expand kitchen" });
    }
  });

  // Unlock kitchen
  app.post("/api/unlock-kitchen", async (req, res) => {
    try {
      const { playerId } = unlockKitchenSchema.parse(req.body);
      
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      if (player.kitchenUnlocked === 1) {
        return res.status(400).json({ message: "Kitchen is already unlocked" });
      }

      const unlockCost = 250;
      if (player.coins < unlockCost) {
        return res.status(400).json({ message: "Not enough coins to unlock kitchen" });
      }

      const updatedPlayer = await storage.updatePlayer(playerId, {
        coins: player.coins - unlockCost,
        kitchenUnlocked: 1,
      });

      res.json({ 
        player: updatedPlayer,
        message: "Kitchen unlocked! You can now bake pies.",
        cost: unlockCost
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to unlock kitchen" });
    }
  });

  // Reward coins from ad
  app.post("/api/reward-coins", async (req, res) => {
    try {
      const { playerId, amount } = rewardCoinsSchema.parse(req.body);
      
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      const updatedPlayer = await storage.updatePlayer(playerId, {
        coins: player.coins + amount,
      });

      res.json({ 
        player: updatedPlayer,
        message: `Rewarded ${amount} coins!`
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Challenge endpoints
  // Get player challenges
  app.get("/api/player/:id/challenges", async (req, res) => {
    try {
      const challenges = await storage.getPlayerChallenges(req.params.id);
      res.json(challenges);
    } catch (error) {
      res.status(500).json({ message: "Failed to get challenges" });
    }
  });

  // Update challenge progress
  app.post("/api/challenge/progress", async (req, res) => {
    try {
      const { playerId, challengeId, progress } = updateChallengeProgressSchema.parse(req.body);
      
      const updatedChallenge = await storage.updateChallengeProgress(playerId, challengeId, progress);
      if (!updatedChallenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }

      const player = await storage.getPlayer(playerId);
      res.json({ 
        challenge: updatedChallenge,
        player: player,
        message: updatedChallenge.status === "completed" ? "Challenge completed!" : "Progress updated!"
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Unlock next level using tools
  app.post("/api/unlock-level", async (req, res) => {
    try {
      const { playerId } = unlockLevelSchema.parse(req.body);
      
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      // Check if player is level 10 or higher
      if (player.level < 10) {
        return res.json({ 
          success: false, 
          message: "You must be at least level 10 to use tools for leveling up!" 
        });
      }

      // Check if player has tools
      if (player.tools < 1) {
        return res.json({ 
          success: false, 
          message: "You need at least 1 tool to unlock the next level! Earn tools through challenges." 
        });
      }

      // Spend 1 tool and level up
      await storage.updatePlayer(playerId, { 
        tools: player.tools - 1,
        level: player.level + 1 
      });

      const updatedPlayer = await storage.getPlayer(playerId);
      res.json({ 
        success: true,
        message: `Level unlocked! Welcome to level ${player.level + 1}!`,
        player: updatedPlayer
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Collect daily coins
  app.post("/api/collect-daily-coins", async (req, res) => {
    try {
      console.log('🪙 Routes: Daily coins collection request received:', req.body);
      const validatedData = collectDailyCoinsSchema.parse(req.body);
      const { playerId } = validatedData;

      console.log('🪙 Routes: Calling storage.collectDailyCoins for player:', playerId);
      const result = await storage.collectDailyCoins(playerId);
      console.log('🪙 Routes: Collection result:', result);
      
      if (!result.success) {
        console.log('🪙 Routes: Collection failed:', result.message);
        return res.status(400).json({ message: result.message });
      }

      const updatedPlayer = await storage.getPlayer(playerId);
      console.log('🪙 Routes: Updated player after collection:', { 
        id: updatedPlayer?.id, 
        coins: updatedPlayer?.coins,
        lastDailyCollection: updatedPlayer?.lastDailyCollection
      });
      
      res.json({ 
        player: updatedPlayer,
        message: result.message,
        coinsReceived: result.coinsReceived
      });
    } catch (error) {
      console.error('🪙 Routes: Error in daily coins collection:', error);
      res.status(500).json({ message: "Failed to collect daily coins" });
    }
  });

  // Fix player level based on current experience
  app.post("/api/player/:id/fix-level", async (req, res) => {
    try {
      const playerId = req.params.id;
      const player = await storage.getPlayer(playerId);
      
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      // Calculate what the player's level should be
      function getXPRequiredForLevel(level: number): number {
        if (level <= 1) return 0;
        let totalXP = 0;
        for (let i = 2; i <= level; i++) {
          const baseXP = 100;
          const multiplier = Math.pow(1.2, i - 2);
          totalXP += Math.floor(baseXP * multiplier);
        }
        return totalXP;
      }

      function calculateLevelFromExperience(totalExperience: number, maxLevel: number = 10): number {
        let level = 1;
        for (let testLevel = 2; testLevel <= maxLevel; testLevel++) {
          const requiredXP = getXPRequiredForLevel(testLevel);
          if (totalExperience >= requiredXP) {
            level = testLevel;
          } else {
            break;
          }
        }
        return level;
      }
      
      const correctLevel = calculateLevelFromExperience(player.experience);
      
      if (correctLevel !== player.level) {
        const updatedPlayer = await storage.updatePlayer(playerId, { level: correctLevel });
        res.json({ 
          success: true, 
          oldLevel: player.level, 
          newLevel: correctLevel,
          experience: player.experience,
          message: `Level corrected from ${player.level} to ${correctLevel} based on ${player.experience} XP`,
          player: updatedPlayer
        });
      } else {
        res.json({ 
          success: true, 
          message: "Player level is already correct",
          level: player.level,
          experience: player.experience
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fix player level" });
    }
  });

  // Customer Order routes
  
  // Get player's orders
  app.get("/api/player/:id/orders", async (req, res) => {
    try {
      console.log('🛒 Routes: Fetching orders for player:', req.params.id);
      
      // Ensure player exists
      const player = await storage.getPlayer(req.params.id);
      if (!player) {
        console.log('🛒 Routes: Player not found for orders request');
        return res.status(404).json({ message: "Player not found" });
      }

      await storage.expireOldOrders(); // Clean up expired orders first
      const orders = await storage.getPlayerOrders(req.params.id);
      
      console.log('🛒 Routes: Retrieved orders, count:', orders.length);
      res.json(orders);
    } catch (error) {
      console.error('🛒 Routes: Failed to get orders:', error);
      res.status(500).json({ 
        message: "Failed to get orders",
        error: error.message,
        details: "Check database connection and customer_orders table"
      });
    }
  });

  // Generate new customer orders for a player
  app.post("/api/player/:id/orders/generate", async (req, res) => {
    try {
      console.log('🛒 Routes: Generating customer orders for player:', req.params.id);
      
      // Ensure player exists before generating orders
      const player = await storage.getPlayer(req.params.id);
      if (!player) {
        console.log('🛒 Routes: Player not found, cannot generate orders');
        return res.status(404).json({ message: "Player not found" });
      }

      console.log('🛒 Routes: Player found, generating orders...');
      await storage.generateCustomerOrders(req.params.id);
      
      const orders = await storage.getPlayerOrders(req.params.id);
      console.log('🛒 Routes: Orders generated successfully, count:', orders.length);
      
      res.json({ orders, message: "New orders generated!" });
    } catch (error) {
      console.error('🛒 Routes: Failed to generate orders:', error);
      res.status(500).json({ 
        message: "Failed to generate orders", 
        error: error.message,
        details: "Check if customer_orders table exists and player has valid data"
      });
    }
  });

  // Fulfill a customer order
  app.post("/api/fulfill-order", async (req, res) => {
    try {
      const { playerId, orderId } = fulfillOrderSchema.parse(req.body);
      
      const result = await storage.fulfillOrder(playerId, orderId);
      
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      const updatedPlayer = await storage.getPlayer(playerId);
      
      res.json({ 
        player: updatedPlayer,
        message: result.message,
        rewards: result.rewards
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fulfill order" });
    }
  });

  // Fix player initialization for TestFlight/Production (one-time repair)
  app.post("/api/player/:id/fix-initialization", async (req, res) => {
    try {
      const playerId = req.params.id;
      console.log('🔧 Routes: Fixing player initialization for:', playerId);
      
      const player = await storage.getPlayer(playerId);
      if (!player) {
        console.log('🔧 Routes: Player not found');
        return res.status(404).json({ message: "Player not found" });
      }

      // Check if player needs initialization fix (for TestFlight users with insufficient starting resources)
      // New players should have at least 25 coins, 3 seeds, and 3 apple seeds
      const hasLowCoins = player.coins < 10; // Very low coins indicate initialization issue
      const hasMissingSeeds = (player.seeds + player.pumpkins) < 2; // Few total pumpkin resources
      const hasMissingAppleSeeds = (player.appleSeeds + player.apples) < 2; // Few total apple resources
      
      const needsInitializationFix = hasLowCoins && (hasMissingSeeds || hasMissingAppleSeeds);
      
      if (!needsInitializationFix) {
        return res.json({ 
          success: false, 
          message: "Player already has sufficient starting resources",
          playerData: {
            coins: player.coins,
            seeds: player.seeds,
            pumpkins: player.pumpkins,
            appleSeeds: player.appleSeeds,
            apples: player.apples,
            level: player.level
          }
        });
      }

      // Apply initialization fix - give proper starting resources
      const updates: any = {};
      
      // Ensure minimum 25 coins
      if (player.coins < 25) {
        updates.coins = Math.max(25, player.coins + 20);
      }
      
      // Ensure minimum 3 pumpkin seeds (if they have few total pumpkin resources)
      if ((player.seeds + player.pumpkins) < 3) {
        updates.seeds = Math.max(3, player.seeds);
      }
      
      // Ensure minimum 3 apple seeds (if they have few total apple resources)
      if ((player.appleSeeds + player.apples) < 3) {
        updates.appleSeeds = Math.max(3, player.appleSeeds);
      }

      const updatedPlayer = await storage.updatePlayer(playerId, updates);
      
      console.log('🔧 Routes: Player initialization fixed:', {
        old: { coins: player.coins, seeds: player.seeds, appleSeeds: player.appleSeeds },
        new: { coins: updatedPlayer?.coins, seeds: updatedPlayer?.seeds, appleSeeds: updatedPlayer?.appleSeeds }
      });

      res.json({
        success: true,
        message: "Player initialization fixed",
        changes: updates,
        player: updatedPlayer
      });
    } catch (error) {
      console.error('🔧 Routes: Error fixing player initialization:', error);
      res.status(500).json({ message: "Failed to fix player initialization" });
    }
  });

  // Emergency reset endpoint - forces restoration regardless of current values
  app.post("/api/player/:id/emergency-reset", async (req, res) => {
    try {
      const playerId = req.params.id;
      console.log('🚨 Routes: Emergency reset for player:', playerId);
      
      const player = await storage.getPlayer(playerId);
      if (!player) {
        console.log('🚨 Routes: Player not found');
        return res.status(404).json({ message: "Player not found" });
      }

      // Force reset to proper starting values
      const updates = {
        coins: Math.max(25, player.coins),
        seeds: Math.max(3, player.seeds),
        appleSeeds: Math.max(3, player.appleSeeds)
      };

      const updatedPlayer = await storage.updatePlayer(playerId, updates);
      
      // Calculate what was actually changed
      const changes = {
        coins: updates.coins - player.coins,
        seeds: updates.seeds - player.seeds,
        appleSeeds: updates.appleSeeds - player.appleSeeds
      };
      
      console.log('🚨 Routes: Emergency reset applied:', changes);

      res.json({
        success: true,
        message: "Emergency reset completed - starting resources restored",
        changes,
        newPlayerData: {
          coins: updatedPlayer.coins,
          seeds: updatedPlayer.seeds,
          appleSeeds: updatedPlayer.appleSeeds,
          level: updatedPlayer.level
        }
      });
    } catch (error) {
      console.error('🚨 Routes: Error during emergency reset:', error);
      res.status(500).json({ message: "Failed to perform emergency reset" });
    }
  });

  // Complete game reset endpoint - resets player to new player starting configuration
  app.post("/api/player/:id/complete-reset", async (req, res) => {
    try {
      const playerId = req.params.id;
      console.log('🔄 Routes: Complete game reset for player:', playerId);
      
      const player = await storage.getPlayer(playerId);
      if (!player) {
        console.log('🔄 Routes: Player not found');
        return res.status(404).json({ message: "Player not found" });
      }

      // Reset player to new player starting configuration
      const resetData = {
        coins: 25,
        seeds: 3,
        pumpkins: 0,
        appleSeeds: 3,
        apples: 0,
        pumpkinPies: 0,
        applePies: 0,
        fertilizer: 0,
        level: 1,
        experience: 0,
        fieldSize: 3,
        kitchenSlots: 1,
        lastDailyCollection: null
      };

      const updatedPlayer = await storage.updatePlayer(playerId, resetData);
      
      // Clear all plots and ovens
      await storage.clearAllPlayerPlots(playerId);
      await storage.clearAllPlayerOvens(playerId);
      
      console.log('🔄 Routes: Complete game reset successful for player:', playerId);

      res.json({
        success: true,
        message: "Game reset complete - welcome back to your new pumpkin patch!",
        player: updatedPlayer
      });
    } catch (error) {
      console.error('🔄 Routes: Error during complete game reset:', error);
      res.status(500).json({ message: "Failed to reset game progress" });
    }
  });

  // Debug endpoint for daily coins (TestFlight debugging)
  app.get("/api/debug/daily-coins/:playerId", async (req, res) => {
    try {
      const playerId = req.params.playerId;
      console.log('🛠️ Debug: Daily coins debug requested for player:', playerId);
      
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      const dailyCoins = await storage.canCollectDailyCoins(playerId);
      const now = new Date();
      
      const debugInfo = {
        playerId,
        currentTime: now.toISOString(),
        lastDailyCollection: player.lastDailyCollection?.toISOString() || null,
        canCollect: dailyCoins.canCollect,
        hoursUntilNext: dailyCoins.hoursUntilNext,
        playerCoins: player.coins,
        timeSinceLastCollection: player.lastDailyCollection ? 
          Math.round((now.getTime() - player.lastDailyCollection.getTime()) / (1000 * 60 * 60) * 100) / 100 : null
      };
      
      console.log('🛠️ Debug: Daily coins debug info:', debugInfo);
      res.json(debugInfo);
    } catch (error) {
      console.error('🛠️ Debug: Error getting daily coins debug info:', error);
      res.status(500).json({ message: "Debug failed", error: error?.toString() });
    }
  });

  // Reset daily coins timer (for testing purposes)
  app.post("/api/debug/reset-daily-coins/:playerId", async (req, res) => {
    try {
      const playerId = req.params.playerId;
      console.log('🛠️ Debug: Resetting daily coins timer for player:', playerId);
      
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      // Reset the lastDailyCollection to null to allow immediate collection
      const updatedPlayer = await storage.updatePlayer(playerId, {
        lastDailyCollection: null
      });

      console.log('🛠️ Debug: Daily coins timer reset successfully');
      res.json({ 
        success: true, 
        message: "Daily coins timer reset - you can now collect coins",
        player: updatedPlayer
      });
    } catch (error) {
      console.error('🛠️ Debug: Error resetting daily coins timer:', error);
      res.status(500).json({ message: "Failed to reset timer", error: error?.toString() });
    }
  });

  // One-time coin bonus for all players (admin endpoint)
  app.post("/api/admin/bonus-coins", async (req, res) => {
    try {
      const { bonusAmount = 25, adminKey } = req.body;
      
      // Simple admin protection (in production, use proper authentication)
      if (adminKey !== "pumpkin-patch-2025") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      console.log(`🎁 Admin: Giving ${bonusAmount} bonus coins to all players`);
      
      // Get all current players
      const allPlayers = await storage.getAllPlayers();
      console.log(`🎁 Admin: Found ${allPlayers.length} players to reward`);
      
      const results = [];
      
      // Give bonus coins to each player
      for (const player of allPlayers) {
        const oldCoins = player.coins;
        const newCoins = oldCoins + bonusAmount;
        
        await storage.updatePlayer(player.id, { coins: newCoins });
        
        results.push({
          playerId: player.id,
          oldCoins,
          newCoins,
          bonusGiven: bonusAmount
        });
        
        console.log(`🎁 Admin: Player ${player.id} - ${oldCoins} → ${newCoins} coins (+${bonusAmount})`);
      }

      console.log(`🎁 Admin: Successfully gave bonus coins to ${results.length} players`);
      
      res.json({ 
        success: true,
        message: `Successfully gave ${bonusAmount} bonus coins to ${results.length} players`,
        playersRewarded: results.length,
        bonusAmount,
        results
      });
    } catch (error) {
      console.error('🎁 Admin: Error giving bonus coins:', error);
      res.status(500).json({ message: "Failed to give bonus coins", error: error?.toString() });
    }
  });

  // Environment debug endpoint for TestFlight debugging
  app.get("/api/debug/environment", async (req, res) => {
    try {
      const player = await storage.getPlayer("default");
      const currentTime = new Date().toISOString();
      
      res.json({
        timestamp: currentTime,
        nodeEnv: process.env.NODE_ENV || "undefined",
        databaseConnected: !!process.env.DATABASE_URL,
        storageType: storage.constructor.name,
        version: "2.0.15",
        buildNumber: "20",
        player: player ? {
          id: player.id,
          coins: player.coins,
          level: player.level,
          fieldSize: player.fieldSize,
          lastDailyCollection: player.lastDailyCollection
        } : null,
        features: {
          dailyCoinsEnabled: true,
          bonusCoinsDistributed: true,
          databasePersistence: true
        }
      });
    } catch (error) {
      console.error('❌ Environment debug error:', error);
      res.status(500).json({ 
        error: error.message,
        timestamp: new Date().toISOString(),
        version: "2.0.11"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
