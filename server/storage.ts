import { type Player, type InsertPlayer, type Plot, type InsertPlot, type PlotState, type Oven, type InsertOven, type OvenState, type SeasonalChallenge, type InsertChallenge, type ChallengeStatus, type CustomerOrder, type InsertOrder, type OrderStatus } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { players, plots, ovens, seasonalChallenges, customerOrders } from "@shared/schema";
import { eq, and, ne, isNotNull, lt, gte } from "drizzle-orm";

export interface IStorage {
  // Player operations
  getPlayer(id: string): Promise<Player | undefined>;
  getAllPlayers(): Promise<Player[]>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: string, updates: Partial<Player>): Promise<Player | undefined>;
  
  // Plot operations
  getPlayerPlots(playerId: string): Promise<Plot[]>;
  getPlot(playerId: string, row: number, col: number): Promise<Plot | undefined>;
  createPlot(plot: InsertPlot): Promise<Plot>;
  updatePlot(playerId: string, row: number, col: number, updates: Partial<Plot>): Promise<Plot | undefined>;
  
  // Oven operations
  getPlayerOvens(playerId: string): Promise<Oven[]>;
  getOven(playerId: string, slotNumber: number): Promise<Oven | undefined>;
  createOven(oven: InsertOven): Promise<Oven>;
  updateOven(playerId: string, slotNumber: number, updates: Partial<Oven>): Promise<Oven | undefined>;
  
  // Challenge operations
  getPlayerChallenges(playerId: string): Promise<SeasonalChallenge[]>;
  getChallenge(playerId: string, challengeId: string): Promise<SeasonalChallenge | undefined>;
  createChallenge(challenge: InsertChallenge): Promise<SeasonalChallenge>;
  updateChallenge(playerId: string, challengeId: string, updates: Partial<SeasonalChallenge>): Promise<SeasonalChallenge | undefined>;
  updateChallengeProgress(playerId: string, challengeId: string, progress: number): Promise<SeasonalChallenge | undefined>;
  generateDailyChallenges(playerId: string): Promise<void>;
  
  // Customer Order operations
  getPlayerOrders(playerId: string): Promise<CustomerOrder[]>;
  getOrder(playerId: string, orderId: string): Promise<CustomerOrder | undefined>;
  createOrder(order: InsertOrder): Promise<CustomerOrder>;
  updateOrder(playerId: string, orderId: string, updates: Partial<CustomerOrder>): Promise<CustomerOrder | undefined>;
  fulfillOrder(playerId: string, orderId: string): Promise<{ success: boolean; message: string; rewards?: any }>;
  generateCustomerOrders(playerId: string): Promise<void>;
  expireOldOrders(): Promise<void>;
  
  // Game operations
  initializePlayerField(playerId: string): Promise<void>;
  initializePlayerKitchen(playerId: string): Promise<void>;
  updatePumpkinGrowth(): Promise<void>;
  updatePieBaking(): Promise<void>;
  expandPlayerField(playerId: string): Promise<{ success: boolean; message: string; cost?: number }>;
  expandPlayerKitchen(playerId: string): Promise<{ success: boolean; message: string; cost?: number }>;
  
  // Level system
  gainExperience(playerId: string, xp: number): Promise<{ player: Player; leveledUp: boolean; newLevel?: number }>;
  checkLevelUnlocks(player: Player): { appleSeeds: boolean; kitchen: boolean };
  
  // Daily coins system
  collectDailyCoins(playerId: string): Promise<{ success: boolean; message: string; coinsReceived?: number }>;
  canCollectDailyCoins(playerId: string): Promise<{ canCollect: boolean; hoursUntilNext?: number }>;
  
  // Level unlocking
  unlockNextLevel(playerId: string): Promise<{ success: boolean; newLevel: number; toolsRequired: number; message: string }>;
  
  // Game reset operations
  clearAllPlayerPlots(playerId: string): Promise<void>;
  clearAllPlayerOvens(playerId: string): Promise<void>;
  
  // Admin operations
  getAllPlayers(): Promise<Player[]>;
}

export class MemStorage implements IStorage {
  private players: Map<string, Player>;
  private plots: Map<string, Plot>;
  private ovens: Map<string, Oven>;
  private challenges: Map<string, SeasonalChallenge>;
  private orders: Map<string, CustomerOrder>;

  constructor() {
    this.players = new Map();
    this.plots = new Map();
    this.ovens = new Map();
    this.challenges = new Map();
    this.orders = new Map();
    
    // Create default player for demo
    this.createDefaultPlayer();
  }

  private async createDefaultPlayer() {
    const defaultPlayer: Player = {
      id: "default",
      level: 1,
      experience: 0,
      coins: 25,
      seeds: 3,
      pumpkins: 0,
      appleSeeds: 3, // Start with 3 apple seeds per project requirements
      apples: 0,
      pies: 0,
      applePies: 0,
      fertilizer: 0,
      tools: 0,
      day: 1,
      fieldSize: 3,
      kitchenSlots: 1,
      kitchenUnlocked: 0, // Start locked, unlock at level 2
      lastDailyCollection: new Date(0), // Set to epoch so player can collect immediately
      lastUpdated: new Date(),
    };
    this.players.set("default", defaultPlayer);
    await this.initializePlayerField("default");
    await this.initializePlayerKitchen("default");
    await this.generateDailyChallenges("default");
  }

  private getPlotKey(playerId: string, row: number, col: number): string {
    return `${playerId}-${row}-${col}`;
  }

  async getAllPlayers(): Promise<Player[]> {
    return Array.from(this.players.values());
  }

  async getPlayer(id: string): Promise<Player | undefined> {
    let player = this.players.get(id);
    
    // Create default player if it doesn't exist
    if (!player && id === "default") {
      player = await this.createPlayer({
        level: 1,
        experience: 0,
        coins: 25,
        seeds: 3,
        pumpkins: 0,
        appleSeeds: 3,
        apples: 0,
        pies: 0,
        applePies: 0,
        fertilizer: 0,
        tools: 0,
        day: 1,
        fieldSize: 3,
        kitchenSlots: 1,
        kitchenUnlocked: 0,
      });
    }
    
    // Migration for existing players without kitchenUnlocked
    if (player && (player as any).kitchenUnlocked === undefined) {
      (player as any).kitchenUnlocked = 1; // Existing players get kitchen unlocked by default
      this.players.set(id, player);
    }
    
    return player;
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = randomUUID();
    const player: Player = { 
      id,
      level: insertPlayer.level ?? 1,
      experience: insertPlayer.experience ?? 0,
      coins: insertPlayer.coins ?? 25,
      seeds: insertPlayer.seeds ?? 3,
      pumpkins: insertPlayer.pumpkins ?? 0,
      appleSeeds: insertPlayer.appleSeeds ?? 3,
      apples: insertPlayer.apples ?? 0,
      pies: insertPlayer.pies ?? 0,
      applePies: insertPlayer.applePies ?? 0,
      fertilizer: insertPlayer.fertilizer ?? 0,
      tools: insertPlayer.tools ?? 0,
      day: insertPlayer.day ?? 1,
      fieldSize: insertPlayer.fieldSize ?? 3,
      kitchenSlots: insertPlayer.kitchenSlots ?? 1,
      kitchenUnlocked: insertPlayer.kitchenUnlocked ?? 0,
      lastDailyCollection: new Date(0), // Set to epoch so player can collect immediately
      lastUpdated: new Date(),
    };
    this.players.set(id, player);
    await this.initializePlayerField(id);
    await this.initializePlayerKitchen(id);
    await this.generateDailyChallenges(id);
    return player;
  }

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player | undefined> {
    const player = this.players.get(id);
    if (!player) return undefined;
    
    const updatedPlayer = { 
      ...player, 
      ...updates, 
      lastUpdated: new Date() 
    };
    this.players.set(id, updatedPlayer);
    return updatedPlayer;
  }

  // Level and experience management
  // Calculate XP required for a specific level (incremental scaling)
  private getXPRequiredForLevel(level: number): number {
    if (level <= 1) return 0;
    
    // Base XP for level 2: 100
    // Each level requires 20% more XP than the previous
    // Level 2: 100, Level 3: 120, Level 4: 144, Level 5: 173, etc.
    let totalXP = 0;
    for (let i = 2; i <= level; i++) {
      const baseXP = 100;
      const multiplier = Math.pow(1.2, i - 2);
      totalXP += Math.floor(baseXP * multiplier);
    }
    return totalXP;
  }

  // Calculate current level based on total experience
  private calculateLevelFromExperience(totalExperience: number, maxLevel: number = 10): number {
    let level = 1;
    
    for (let testLevel = 2; testLevel <= maxLevel; testLevel++) {
      const requiredXP = this.getXPRequiredForLevel(testLevel);
      if (totalExperience >= requiredXP) {
        level = testLevel;
      } else {
        break;
      }
    }
    
    return level;
  }

  async addExperience(playerId: string, amount: number): Promise<{ newLevel: number; leveledUp: boolean; experience: number }> {
    const player = await this.getPlayer(playerId);
    if (!player) throw new Error("Player not found");

    const newExperience = player.experience + amount;
    
    // After level 10, players can only advance with tools (manual unlock)
    let newLevel = player.level;
    if (player.level < 10) {
      newLevel = this.calculateLevelFromExperience(newExperience, 10);
    }
    
    const leveledUp = newLevel > player.level;

    await this.updatePlayer(playerId, { 
      experience: newExperience, 
      level: newLevel 
    });

    return { newLevel, leveledUp, experience: newExperience };
  }



  async getPlayerPlots(playerId: string): Promise<Plot[]> {
    return Array.from(this.plots.values()).filter(plot => plot.playerId === playerId);
  }

  async getPlot(playerId: string, row: number, col: number): Promise<Plot | undefined> {
    const key = this.getPlotKey(playerId, row, col);
    return this.plots.get(key);
  }

  async createPlot(insertPlot: InsertPlot): Promise<Plot> {
    const id = randomUUID();
    const plot: Plot = { 
      id,
      playerId: insertPlot.playerId,
      row: insertPlot.row,
      col: insertPlot.col,
      state: (insertPlot.state as PlotState) ?? "empty",
      cropType: (insertPlot.cropType as "pumpkin" | "apple") ?? "pumpkin",
      plantedAt: insertPlot.plantedAt ?? null,
      lastWatered: insertPlot.lastWatered ?? null,
      fertilized: insertPlot.fertilized ?? 0,
    };
    const key = this.getPlotKey(plot.playerId, plot.row, plot.col);
    this.plots.set(key, plot);
    return plot;
  }

  async updatePlot(playerId: string, row: number, col: number, updates: Partial<Plot>): Promise<Plot | undefined> {
    const key = this.getPlotKey(playerId, row, col);
    const plot = this.plots.get(key);
    if (!plot) return undefined;
    
    const updatedPlot = { ...plot, ...updates };
    this.plots.set(key, updatedPlot);
    return updatedPlot;
  }

  async initializePlayerField(playerId: string): Promise<void> {
    const player = this.players.get(playerId);
    const fieldSize = player?.fieldSize || 3;
    
    // Create field based on player's current field size
    for (let row = 0; row < fieldSize; row++) {
      for (let col = 0; col < fieldSize; col++) {
        const existingPlot = await this.getPlot(playerId, row, col);
        if (!existingPlot) {
          await this.createPlot({
            playerId,
            row,
            col,
            state: "empty",
            cropType: "pumpkin",
            plantedAt: null,
            lastWatered: null,
            fertilized: 0,
          });
        }
      }
    }

    // Add some initial demo plots for the default player (only if field is 3x3)
    if (playerId === "default" && fieldSize === 3) {
      await this.updatePlot(playerId, 0, 1, { 
        state: "seedling", 
        plantedAt: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
      });
      await this.updatePlot(playerId, 1, 0, { 
        state: "growing", 
        plantedAt: new Date(Date.now() - 40 * 60 * 1000) // 40 minutes ago
      });
      await this.updatePlot(playerId, 2, 2, { 
        state: "mature", 
        plantedAt: new Date(Date.now() - 70 * 60 * 1000) // 70 minutes ago
      });
    }
  }

  async expandPlayerField(playerId: string): Promise<{ success: boolean; message: string; cost?: number }> {
    const player = this.players.get(playerId);
    if (!player) {
      return { success: false, message: "Player not found" };
    }

    if (player.fieldSize >= 10) {
      return { success: false, message: "Field is already at maximum size (10x10)" };
    }

    // Calculate expansion cost: 50 coins for 4x4, 100 for 5x5, 200 for 6x6, etc.
    const newSize = player.fieldSize + 1;
    const cost = Math.pow(2, newSize - 4) * 50; // Exponentially increasing cost

    if (player.coins < cost) {
      return { success: false, message: `Not enough coins. Expansion to ${newSize}x${newSize} costs ${cost} coins`, cost };
    }

    // Update player
    await this.updatePlayer(playerId, {
      coins: player.coins - cost,
      fieldSize: newSize,
    });

    // Add new plots for the expanded area
    for (let row = 0; row < newSize; row++) {
      for (let col = 0; col < newSize; col++) {
        const existingPlot = await this.getPlot(playerId, row, col);
        if (!existingPlot) {
          await this.createPlot({
            playerId,
            row,
            col,
            state: "empty",
            cropType: "pumpkin",
            plantedAt: null,
            lastWatered: null,
            fertilized: 0,
          });
        }
      }
    }

    return { 
      success: true, 
      message: `Field expanded to ${newSize}x${newSize} for ${cost} coins!`,
      cost 
    };
  }

  // Oven operations
  private getOvenKey(playerId: string, slotNumber: number): string {
    return `${playerId}-${slotNumber}`;
  }

  async getPlayerOvens(playerId: string): Promise<Oven[]> {
    return Array.from(this.ovens.values()).filter(oven => oven.playerId === playerId);
  }

  async getOven(playerId: string, slotNumber: number): Promise<Oven | undefined> {
    const key = this.getOvenKey(playerId, slotNumber);
    return this.ovens.get(key);
  }

  async createOven(insertOven: InsertOven): Promise<Oven> {
    const id = randomUUID();
    const oven: Oven = {
      id,
      playerId: insertOven.playerId,
      slotNumber: insertOven.slotNumber,
      state: (insertOven.state as OvenState) ?? "empty",
      pieType: insertOven.pieType ?? null,
      startedAt: insertOven.startedAt ?? null,
      lastUpdated: new Date(),
    };
    const key = this.getOvenKey(oven.playerId, oven.slotNumber);
    this.ovens.set(key, oven);
    return oven;
  }

  async updateOven(playerId: string, slotNumber: number, updates: Partial<Oven>): Promise<Oven | undefined> {
    const key = this.getOvenKey(playerId, slotNumber);
    const oven = this.ovens.get(key);
    if (!oven) return undefined;
    
    const updatedOven = { 
      ...oven, 
      ...updates, 
      lastUpdated: new Date() 
    };
    this.ovens.set(key, updatedOven);
    return updatedOven;
  }

  async initializePlayerKitchen(playerId: string): Promise<void> {
    const player = this.players.get(playerId);
    const kitchenSlots = player?.kitchenSlots || 1;
    
    // Create oven slots based on player's current kitchen size
    for (let slot = 0; slot < kitchenSlots; slot++) {
      const existingOven = await this.getOven(playerId, slot);
      if (!existingOven) {
        await this.createOven({
          playerId,
          slotNumber: slot,
          state: "empty",
          pieType: null as "pumpkin" | "apple" | null,
          startedAt: null,
        });
      }
    }
  }

  async expandPlayerKitchen(playerId: string): Promise<{ success: boolean; message: string; cost?: number }> {
    const player = this.players.get(playerId);
    if (!player) {
      return { success: false, message: "Player not found" };
    }

    if (player.kitchenSlots >= 5) {
      return { success: false, message: "Kitchen is already at maximum size (5 slots)" };
    }

    // Calculate expansion cost: 100 coins for 2nd slot, 200 for 3rd, 400 for 4th, 800 for 5th
    const newSlots = player.kitchenSlots + 1;
    const cost = Math.pow(2, newSlots - 2) * 100;

    if (player.coins < cost) {
      return { success: false, message: `Not enough coins. Kitchen expansion to ${newSlots} slots costs ${cost} coins`, cost };
    }

    // Update player
    await this.updatePlayer(playerId, {
      coins: player.coins - cost,
      kitchenSlots: newSlots,
    });

    // Add new oven slot
    await this.createOven({
      playerId,
      slotNumber: newSlots - 1,
      state: "empty",
      pieType: null as "pumpkin" | "apple" | null,
      startedAt: null,
    });

    return { 
      success: true, 
      message: `Kitchen expanded to ${newSlots} slots for ${cost} coins!`,
      cost 
    };
  }

  async updatePumpkinGrowth(): Promise<void> {
    const now = new Date();
    
    for (const plot of Array.from(this.plots.values())) {
      if (plot.state === "empty" || plot.state === "mature" || !plot.plantedAt) {
        continue;
      }

      // Ensure plantedAt is a Date object
      const plantedDate = plot.plantedAt instanceof Date ? plot.plantedAt : new Date(plot.plantedAt);
      const minutesSincePlanted = Math.floor((now.getTime() - plantedDate.getTime()) / (1000 * 60));
      
      // Apply fertilizer speed boost (reduces time needed by 50%)
      const effectiveMinutes = plot.fertilized ? minutesSincePlanted * 2 : minutesSincePlanted;
      
      // Different growth times based on crop type
      const growthTime = plot.cropType === "apple" ? 15 : 60; // Apples: 15min, Pumpkins: 60min
      const midGrowthTime = Math.floor(growthTime / 2);
      
      let newState: PlotState = plot.state;
      if (effectiveMinutes >= growthTime) {
        newState = "mature";
      } else if (effectiveMinutes >= midGrowthTime) {
        newState = "growing";
      } else if (effectiveMinutes >= 0) {
        newState = "seedling";
      }

      // Debug logging for stuck plots
      if (minutesSincePlanted > 60 && plot.state === "seedling") {
        console.log(`Plot debug: ${plot.playerId} (${plot.row},${plot.col}) - planted ${minutesSincePlanted}min ago, effective: ${effectiveMinutes}min, crop: ${plot.cropType}, state: ${plot.state} -> ${newState}`);
      }

      if (newState !== plot.state) {
        console.log(`Updating plot ${plot.playerId} (${plot.row},${plot.col}) from ${plot.state} to ${newState} after ${minutesSincePlanted} minutes`);
        await this.updatePlot(plot.playerId, plot.row, plot.col, { state: newState });
      }
    }
  }

  async startBaking(playerId: string, slotNumber: number, pieType: "pumpkin" | "apple" = "pumpkin"): Promise<{ player: Player; oven: Oven }> {
    const player = await this.getPlayer(playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    if (pieType === "apple" && player.apples === 0) {
      throw new Error("No apples available");
    } else if (pieType === "pumpkin" && player.pumpkins === 0) {
      throw new Error("No pumpkins available");
    }

    const oven = await this.getOven(playerId, slotNumber);
    if (!oven || oven.state !== "empty") {
      throw new Error("Oven is not empty");
    }

    // Update player - remove ingredient
    const updates: Partial<Player> = {};
    if (pieType === "apple") {
      updates.apples = player.apples - 1;
    } else {
      updates.pumpkins = player.pumpkins - 1;
    }
    const updatedPlayer = await this.updatePlayer(playerId, updates);

    // Update oven
    const updatedOven = await this.updateOven(playerId, slotNumber, {
      state: "baking",
      pieType: pieType,
      startedAt: new Date(),
    });

    return { player: updatedPlayer!, oven: updatedOven! };
  }

  async collectPie(playerId: string, slotNumber: number): Promise<{ player: Player; oven: Oven }> {
    const player = await this.getPlayer(playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    const oven = await this.getOven(playerId, slotNumber);
    if (!oven || oven.state !== "ready") {
      throw new Error("Oven is not ready");
    }

    // Update player - add pie
    const updates: Partial<Player> = {};
    if (oven.pieType === "apple") {
      updates.applePies = player.applePies + 1;
    } else {
      updates.pies = player.pies + 1;
    }
    const updatedPlayer = await this.updatePlayer(playerId, updates);

    // Update oven - reset to empty
    const updatedOven = await this.updateOven(playerId, slotNumber, {
      state: "empty",
      pieType: null as "pumpkin" | "apple" | null,
      startedAt: null,
    });

    return { player: updatedPlayer!, oven: updatedOven! };
  }

  async updatePieBaking(): Promise<void> {
    const now = new Date();
    
    for (const oven of Array.from(this.ovens.values())) {
      if (oven.state !== "baking" || !oven.startedAt) {
        continue;
      }

      const minutesSinceStarted = Math.floor((now.getTime() - oven.startedAt.getTime()) / (1000 * 60));
      
      // Determine baking time based on pie type: apple pies 15min, pumpkin pies 30min
      const bakingTime = oven.pieType === "apple" ? 15 : 30;
      
      if (minutesSinceStarted >= bakingTime) {
        await this.updateOven(oven.playerId, oven.slotNumber, { 
          state: "ready" 
        });
      }
    }
  }

  // Challenge operations
  private getChallengeKey(playerId: string, challengeId: string): string {
    return `${playerId}-${challengeId}`;
  }

  async getPlayerChallenges(playerId: string): Promise<SeasonalChallenge[]> {
    return Array.from(this.challenges.values()).filter(challenge => challenge.playerId === playerId);
  }

  async getChallenge(playerId: string, challengeId: string): Promise<SeasonalChallenge | undefined> {
    const key = this.getChallengeKey(playerId, challengeId);
    return this.challenges.get(key);
  }

  async createChallenge(insertChallenge: InsertChallenge): Promise<SeasonalChallenge> {
    const id = randomUUID();
    const challenge: SeasonalChallenge = {
      id,
      type: insertChallenge.type as "harvest" | "plant" | "bake" | "earn" | "expand",
      status: insertChallenge.status as "active" | "completed" | "failed" | "locked",
      playerId: insertChallenge.playerId,
      challengeId: insertChallenge.challengeId,
      title: insertChallenge.title,
      description: insertChallenge.description,
      targetValue: insertChallenge.targetValue,
      currentProgress: insertChallenge.currentProgress ?? 0,
      rewards: insertChallenge.rewards as {coins?: number, seeds?: number, pumpkins?: number, apples?: number, fertilizer?: number, tools?: number},
      difficulty: insertChallenge.difficulty ?? 1,
      season: insertChallenge.season ?? "autumn",
      expiresAt: insertChallenge.expiresAt ?? null,
      completedAt: insertChallenge.completedAt ?? null,
      createdAt: new Date(),
    };
    
    const key = this.getChallengeKey(challenge.playerId, challenge.challengeId);
    this.challenges.set(key, challenge);
    return challenge;
  }

  async updateChallenge(playerId: string, challengeId: string, updates: Partial<SeasonalChallenge>): Promise<SeasonalChallenge | undefined> {
    const key = this.getChallengeKey(playerId, challengeId);
    const existing = this.challenges.get(key);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    this.challenges.set(key, updated);
    return updated;
  }

  async updateChallengeProgress(playerId: string, challengeId: string, progress: number): Promise<SeasonalChallenge | undefined> {
    const challenge = await this.getChallenge(playerId, challengeId);
    if (!challenge || challenge.status !== "active") return challenge;

    const newProgress = challenge.currentProgress + progress;
    let updates: Partial<SeasonalChallenge> = { currentProgress: newProgress };

    // Check if challenge is completed
    if (newProgress >= challenge.targetValue) {
      updates.status = "completed";
      updates.completedAt = new Date();
      
      // Award rewards
      const player = await this.getPlayer(playerId);
      if (player && challenge.rewards) {
        const playerUpdates: Partial<Player> = {};
        if (challenge.rewards.coins) playerUpdates.coins = player.coins + challenge.rewards.coins;
        if (challenge.rewards.seeds) playerUpdates.seeds = player.seeds + challenge.rewards.seeds;
        if (challenge.rewards.pumpkins) playerUpdates.pumpkins = player.pumpkins + challenge.rewards.pumpkins;
        if (challenge.rewards.apples) playerUpdates.apples = player.apples + challenge.rewards.apples;
        if (challenge.rewards.fertilizer) playerUpdates.fertilizer = player.fertilizer + challenge.rewards.fertilizer;
        if (challenge.rewards.tools) playerUpdates.tools = player.tools + challenge.rewards.tools;
        
        await this.updatePlayer(playerId, playerUpdates);
      }
    }

    return await this.updateChallenge(playerId, challengeId, updates);
  }

  async generateDailyChallenges(playerId: string): Promise<void> {
    const player = await this.getPlayer(playerId);
    if (!player) return;

    // Clear existing active challenges to avoid duplicates
    const existingChallenges = await this.getPlayerChallenges(playerId);
    for (const challenge of existingChallenges) {
      if (challenge.status === "active") {
        const key = this.getChallengeKey(playerId, challenge.challengeId);
        this.challenges.delete(key);
      }
    }

    // Generate new daily challenges based on player progress
    const difficultyLevel = Math.min(5, Math.floor(player.day / 3) + 1);
    const challengeTemplates = this.getChallengeTemplates(difficultyLevel);

    for (const template of challengeTemplates) {
      await this.createChallenge({
        playerId,
        challengeId: template.id,
        title: template.title,
        description: template.description,
        type: template.type,
        targetValue: template.targetValue,
        currentProgress: 0,
        rewards: template.rewards,
        status: "active",
        difficulty: difficultyLevel,
        season: "autumn",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        completedAt: null,
      });
    }
  }

  private getChallengeTemplates(difficulty: number) {
    const baseTemplates: Array<{
      id: string;
      title: string;
      description: string;
      type: "harvest" | "plant" | "bake" | "earn" | "expand";
      targetValue: number;
      rewards: { coins?: number; seeds?: number; pumpkins?: number; apples?: number; fertilizer?: number; tools?: number };
    }> = [
      {
        id: "daily-harvest",
        title: "🎃 Autumn Harvest",
        description: `Harvest ${difficulty * 2} crops today`,
        type: "harvest",
        targetValue: difficulty * 2,
        rewards: { coins: difficulty * 20, seeds: difficulty * 2 }
      },
      {
        id: "daily-plant",
        title: "🌱 Planting Spree",
        description: `Plant ${difficulty * 3} seeds today`,
        type: "plant",
        targetValue: difficulty * 3,
        rewards: { coins: difficulty * 15, fertilizer: difficulty }
      },
      {
        id: "daily-earn",
        title: "💰 Coin Collector",
        description: `Earn ${difficulty * 50} coins today`,
        type: "earn",
        targetValue: difficulty * 50,
        rewards: { seeds: difficulty * 5, tools: 1 }
      }
    ];

    if (difficulty >= 2) {
      baseTemplates.push({
        id: "daily-bake",
        title: "🥧 Pie Master",
        description: `Bake ${difficulty} pies today`,
        type: "bake",
        targetValue: difficulty,
        rewards: { coins: difficulty * 30, pumpkins: difficulty * 2 }
      });
    }

    if (difficulty >= 3) {
      baseTemplates.push({
        id: "daily-expand",
        title: "🏗️ Farm Expansion",
        description: "Expand your farm or kitchen",
        type: "expand",
        targetValue: 1,
        rewards: { coins: difficulty * 100, fertilizer: difficulty * 3 }
      });
    }

    // Return 3 random challenges for variety
    return baseTemplates
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(3, baseTemplates.length));
  }

  // Level system implementation
  async gainExperience(playerId: string, xp: number): Promise<{ player: Player; leveledUp: boolean; newLevel?: number }> {
    const player = await this.getPlayer(playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    const newExperience = player.experience + xp;
    const currentLevel = player.level;
    
    // Calculate level from experience (100 XP per level)
    const newLevel = Math.floor(newExperience / 100) + 1;
    const leveledUp = newLevel > currentLevel;

    // Update player with new experience and level
    const updates: Partial<Player> = {
      experience: newExperience,
      level: newLevel,
    };

    // Unlock features based on new level
    if (leveledUp && newLevel >= 2) {
      // Unlock apple seeds and kitchen at level 2
      updates.kitchenUnlocked = 1;
      if (player.appleSeeds === 0) {
        updates.appleSeeds = 3; // Give starting apple seeds
      }
    }

    const updatedPlayer = await this.updatePlayer(playerId, updates);
    
    return {
      player: updatedPlayer!,
      leveledUp,
      newLevel: leveledUp ? newLevel : undefined
    };
  }

  checkLevelUnlocks(player: Player): { appleSeeds: boolean; kitchen: boolean } {
    return {
      appleSeeds: player.level >= 2,
      kitchen: player.level >= 2
    };
  }

  // Daily coins system
  async collectDailyCoins(playerId: string): Promise<{ success: boolean; message: string; coinsReceived?: number }> {
    console.log('🪙 DatabaseStorage: collectDailyCoins called for player:', playerId);
    
    const player = await this.getPlayer(playerId);
    if (!player) {
      return { success: false, message: "Player not found" };
    }

    // Check if 24 hours have passed since last collection
    const now = new Date();
    const lastCollection = player.lastDailyCollection;
    
    if (lastCollection) {
      const timeSinceLastCollection = now.getTime() - lastCollection.getTime();
      const hoursElapsed = timeSinceLastCollection / (1000 * 60 * 60);
      
      if (hoursElapsed < 24) {
        const hoursRemaining = Math.ceil(24 - hoursElapsed);
        return { 
          success: false, 
          message: `Daily coins already collected. Try again in ${hoursRemaining} hours.` 
        };
      }
    }

    // Give 5 free coins
    const updatedPlayer = await this.updatePlayer(playerId, {
      coins: player.coins + 5,
      lastDailyCollection: now,
    });

    if (!updatedPlayer) {
      return { success: false, message: "Failed to update player" };
    }

    return {
      success: true,
      message: "Collected 5 daily coins!",
      coinsReceived: 5
    };
  }

  async canCollectDailyCoins(playerId: string): Promise<{ canCollect: boolean; hoursUntilNext?: number }> {
    const player = await this.getPlayer(playerId);
    if (!player) return { canCollect: false };

    const lastCollection = player.lastDailyCollection;
    if (!lastCollection) return { canCollect: true };

    const now = new Date();
    const timeSinceLastCollection = now.getTime() - lastCollection.getTime();
    const hoursElapsed = timeSinceLastCollection / (1000 * 60 * 60);

    if (hoursElapsed >= 24) {
      return { canCollect: true };
    } else {
      return { 
        canCollect: false, 
        hoursUntilNext: Math.ceil(24 - hoursElapsed) 
      };
    }
  }

  async unlockNextLevel(playerId: string): Promise<{ success: boolean; newLevel: number; toolsRequired: number; message: string }> {
    const player = await this.getPlayer(playerId);
    if (!player) {
      return { success: false, newLevel: 0, toolsRequired: 0, message: "Player not found" };
    }

    if (player.level < 10) {
      return { 
        success: false, 
        newLevel: player.level, 
        toolsRequired: 0, 
        message: "Cannot manually unlock levels below 10. Level up through XP first." 
      };
    }

    const nextLevel = player.level + 1;
    const toolsRequired = this.getToolsRequiredForLevel(nextLevel);
    
    if (player.tools < toolsRequired) {
      return { 
        success: false, 
        newLevel: player.level, 
        toolsRequired, 
        message: `Need ${toolsRequired} tools to unlock level ${nextLevel}` 
      };
    }

    const updatedPlayer = await this.updatePlayer(playerId, {
      level: nextLevel,
      tools: player.tools - toolsRequired,
    });

    if (!updatedPlayer) {
      return { 
        success: false, 
        newLevel: player.level, 
        toolsRequired, 
        message: "Failed to unlock level" 
      };
    }

    return {
      success: true,
      newLevel: nextLevel,
      toolsRequired,
      message: `Unlocked level ${nextLevel}! Used ${toolsRequired} tools.`
    };
  }

  private getToolsRequiredForLevel(level: number): number {
    if (level <= 10) return 0;
    // Exponential cost: 5, 10, 20, 40, 80...
    return Math.pow(2, level - 11) * 5;
  }

  // Game reset operations
  async clearAllPlayerPlots(playerId: string): Promise<void> {
    const plotsToRemove = Array.from(this.plots.entries())
      .filter(([key, plot]) => plot.playerId === playerId);
    
    plotsToRemove.forEach(([key]) => {
      this.plots.delete(key);
    });
  }

  async clearAllPlayerOvens(playerId: string): Promise<void> {
    const ovensToRemove = Array.from(this.ovens.entries())
      .filter(([key, oven]) => oven.playerId === playerId);
    
    ovensToRemove.forEach(([key]) => {
      this.ovens.delete(key);
    });
  }



  // Customer Order operations
  private getOrderKey(playerId: string, orderId: string): string {
    return `${playerId}-${orderId}`;
  }

  async getPlayerOrders(playerId: string): Promise<CustomerOrder[]> {
    return Array.from(this.orders.values()).filter(order => order.playerId === playerId);
  }

  async getOrder(playerId: string, orderId: string): Promise<CustomerOrder | undefined> {
    const key = this.getOrderKey(playerId, orderId);
    return this.orders.get(key);
  }

  async createOrder(insertOrder: InsertOrder): Promise<CustomerOrder> {
    const id = randomUUID();
    const order: CustomerOrder = {
      id,
      playerId: insertOrder.playerId,
      customerName: insertOrder.customerName,
      customerAvatar: insertOrder.customerAvatar,
      title: insertOrder.title,
      description: insertOrder.description,
      requiredItems: insertOrder.requiredItems,
      rewards: insertOrder.rewards,
      status: insertOrder.status ?? "pending",
      priority: insertOrder.priority ?? 1,
      timeLimit: insertOrder.timeLimit,
      createdAt: new Date(),
      completedAt: insertOrder.completedAt ?? null,
      expiresAt: insertOrder.expiresAt,
    };
    
    const key = this.getOrderKey(order.playerId, order.id);
    this.orders.set(key, order);
    return order;
  }

  async updateOrder(playerId: string, orderId: string, updates: Partial<CustomerOrder>): Promise<CustomerOrder | undefined> {
    const key = this.getOrderKey(playerId, orderId);
    const existing = this.orders.get(key);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    this.orders.set(key, updated);
    return updated;
  }

  async fulfillOrder(playerId: string, orderId: string): Promise<{ success: boolean; message: string; rewards?: any }> {
    const order = await this.getOrder(playerId, orderId);
    if (!order) {
      return { success: false, message: "Order not found" };
    }

    if (order.status !== "pending") {
      return { success: false, message: "Order is no longer available" };
    }

    const player = await this.getPlayer(playerId);
    if (!player) {
      return { success: false, message: "Player not found" };
    }

    // Check if player has required items
    const required = order.requiredItems;
    if (required.pumpkins && player.pumpkins < required.pumpkins) {
      return { success: false, message: `Need ${required.pumpkins} pumpkins` };
    }
    if (required.apples && player.apples < required.apples) {
      return { success: false, message: `Need ${required.apples} apples` };
    }
    if (required.pies && player.pies < required.pies) {
      return { success: false, message: `Need ${required.pies} pumpkin pies` };
    }
    if (required.applePies && player.applePies < required.applePies) {
      return { success: false, message: `Need ${required.applePies} apple pies` };
    }

    // Deduct required items from player
    const playerUpdates: Partial<Player> = {};
    if (required.pumpkins) playerUpdates.pumpkins = player.pumpkins - required.pumpkins;
    if (required.apples) playerUpdates.apples = player.apples - required.apples;
    if (required.pies) playerUpdates.pies = player.pies - required.pies;
    if (required.applePies) playerUpdates.applePies = player.applePies - required.applePies;

    // Award rewards
    playerUpdates.coins = player.coins + order.rewards.coins;
    playerUpdates.experience = player.experience + order.rewards.experience;
    
    if (order.rewards.bonus) {
      const bonus = order.rewards.bonus;
      if (bonus.seeds) playerUpdates.seeds = (player.seeds || 0) + bonus.seeds;
      if (bonus.fertilizer) playerUpdates.fertilizer = (player.fertilizer || 0) + bonus.fertilizer;
      if (bonus.tools) playerUpdates.tools = (player.tools || 0) + bonus.tools;
    }

    await this.updatePlayer(playerId, playerUpdates);

    // Mark order as completed
    await this.updateOrder(playerId, orderId, {
      status: "completed",
      completedAt: new Date(),
    });

    return {
      success: true,
      message: `Order completed! Earned ${order.rewards.coins} coins and ${order.rewards.experience} XP`,
      rewards: order.rewards,
    };
  }

  async generateCustomerOrders(playerId: string): Promise<void> {
    const player = await this.getPlayer(playerId);
    if (!player) return;

    // Check existing active orders - don't generate more if player already has 3+
    const existingOrders = await this.getPlayerOrders(playerId);
    const activeOrders = existingOrders.filter(order => order.status === "pending");
    if (activeOrders.length >= 3) return;

    // Generate 1-2 new orders based on player level
    const numOrders = Math.min(2, 3 - activeOrders.length);
    
    for (let i = 0; i < numOrders; i++) {
      const orderTemplate = this.generateOrderTemplate(player.level);
      const expiresAt = new Date(Date.now() + orderTemplate.timeLimit * 60 * 1000);
      
      await this.createOrder({
        playerId,
        customerName: orderTemplate.customerName,
        customerAvatar: orderTemplate.customerAvatar,
        title: orderTemplate.title,
        description: orderTemplate.description,
        requiredItems: orderTemplate.requiredItems,
        rewards: orderTemplate.rewards,
        status: "pending",
        priority: orderTemplate.priority,
        timeLimit: orderTemplate.timeLimit,
        expiresAt,
        completedAt: null,
      });
    }
  }

  private generateOrderTemplate(playerLevel: number) {
    const customers = [
      { name: "Farmer Joe", avatar: "👨‍🌾" },
      { name: "Baker Sarah", avatar: "👩‍🍳" },
      { name: "Mrs. Thompson", avatar: "👵" },
      { name: "Chef Marco", avatar: "👨‍🍳" },
      { name: "Little Emily", avatar: "👧" },
      { name: "Mayor Wilson", avatar: "👔" },
    ];

    const customer = customers[Math.floor(Math.random() * customers.length)];
    const difficulty = Math.min(3, Math.max(1, playerLevel - 1));
    const timeLimit = 60 + (difficulty * 30); // 60-150 minutes

    // Generate order based on difficulty and available items
    const orderTypes = [
      {
        title: "Fresh Pumpkins Needed",
        description: `I need some fresh pumpkins for my autumn decorations!`,
        requiredItems: { pumpkins: difficulty * 2 },
        rewards: { coins: difficulty * 50, experience: difficulty * 15 },
        priority: 1,
      },
      {
        title: "Apple Harvest Request",
        description: `Could you spare some crisp apples? They're for my famous apple cider!`,
        requiredItems: { apples: difficulty * 3 },
        rewards: { coins: difficulty * 35, experience: difficulty * 12 },
        priority: 1,
      },
    ];

    // Add pie orders for higher level players
    if (playerLevel >= 2) {
      orderTypes.push({
        title: "Pumpkin Pie Special",
        description: `My customers are craving homemade pumpkin pies. Can you help?`,
        requiredItems: { pies: difficulty },
        rewards: { coins: difficulty * 80, experience: difficulty * 25, bonus: { fertilizer: 2 } },
        priority: 2,
      });
      
      orderTypes.push({
        title: "Apple Pie Delight",
        description: `I need some delicious apple pies for the town festival!`,
        requiredItems: { applePies: difficulty },
        rewards: { coins: difficulty * 70, experience: difficulty * 22, bonus: { seeds: 3 } },
        priority: 2,
      });
    }

    const orderType = orderTypes[Math.floor(Math.random() * orderTypes.length)];

    return {
      customerName: customer.name,
      customerAvatar: customer.avatar,
      title: orderType.title,
      description: orderType.description,
      requiredItems: orderType.requiredItems,
      rewards: orderType.rewards,
      priority: orderType.priority,
      timeLimit,
    };
  }

  async expireOldOrders(): Promise<void> {
    const now = new Date();
    const allOrders = Array.from(this.orders.values());
    
    for (const order of allOrders) {
      if (order.status === "pending" && order.expiresAt < now) {
        await this.updateOrder(order.playerId, order.id, {
          status: "expired",
        });
      }
    }
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  async getPlayer(id: string): Promise<Player | undefined> {
    try {
      console.log(`🔍 DatabaseStorage: Looking for player with ID: ${id}`);
      const [player] = await db.select().from(players).where(eq(players.id, id));
      if (!player) {
        console.log(`🆕 Creating new player with ID: ${id} - Starting resources: 25 coins, 3 pumpkin seeds, 3 apple seeds`);
        // Create new player if not found with the provided ID
        const [newPlayer] = await db
          .insert(players)
          .values({
            id, // Use the provided ID instead of generating a new one
            level: 1,
            experience: 0,
            coins: 25,
            seeds: 3,
            pumpkins: 0,
            appleSeeds: 3, // Start with 3 apple seeds per project requirements
            apples: 0,
            pies: 0,
            applePies: 0,
            fertilizer: 0,
            tools: 0,
            day: 1,
            fieldSize: 3,
            kitchenSlots: 1,
            kitchenUnlocked: 0,
          })
          .returning();
        
        await this.initializePlayerField(newPlayer.id);
        await this.initializePlayerKitchen(newPlayer.id);
        await this.generateDailyChallenges(newPlayer.id);
        await this.generateCustomerOrders(newPlayer.id);
        
        console.log(`✅ Successfully created new player:`, {
          id: newPlayer.id,
          coins: newPlayer.coins,
          seeds: newPlayer.seeds,
          appleSeeds: newPlayer.appleSeeds,
          level: newPlayer.level
        });
        
        return newPlayer;
      }
      
      console.log(`🔍 Found existing player:`, {
        id: player.id,
        coins: player.coins,
        seeds: player.seeds,
        appleSeeds: player.appleSeeds,
        level: player.level
      });
      return player;
    } catch (error) {
      console.error(`❌ Error in getPlayer(${id}):`, error);
      console.error('Database connection status:', error.message);
      return undefined;
    }
  }

  async getAllPlayers(): Promise<Player[]> {
    try {
      console.log('🔍 DatabaseStorage: Getting all players for admin operation');
      const allPlayers = await db.select().from(players);
      console.log(`🔍 DatabaseStorage: Found ${allPlayers.length} total players`);
      return allPlayers;
    } catch (error) {
      console.error('❌ Error in getAllPlayers:', error);
      return [];
    }
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const [player] = await db
      .insert(players)
      .values({
        level: insertPlayer.level ?? 1,
        experience: insertPlayer.experience ?? 0,
        coins: insertPlayer.coins ?? 25,
        seeds: insertPlayer.seeds ?? 3,
        pumpkins: insertPlayer.pumpkins ?? 0,
        appleSeeds: insertPlayer.appleSeeds ?? 3,
        apples: insertPlayer.apples ?? 0,
        pies: insertPlayer.pies ?? 0,
        applePies: insertPlayer.applePies ?? 0,
        fertilizer: insertPlayer.fertilizer ?? 0,
        tools: insertPlayer.tools ?? 0,
        day: insertPlayer.day ?? 1,
        fieldSize: insertPlayer.fieldSize ?? 3,
        kitchenSlots: insertPlayer.kitchenSlots ?? 1,
        kitchenUnlocked: insertPlayer.kitchenUnlocked ?? 0,
      })
      .returning();
    
    await this.initializePlayerField(player.id);
    await this.initializePlayerKitchen(player.id);
    await this.generateDailyChallenges(player.id);
    
    return player;
  }

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player | undefined> {
    const [player] = await db
      .update(players)
      .set({ ...updates, lastUpdated: new Date() })
      .where(eq(players.id, id))
      .returning();
    return player;
  }

  // Implement other storage methods with database calls
  // For now, delegate to MemStorage for complex operations
  private memStorage = new MemStorage();

  async getPlayerPlots(playerId: string): Promise<Plot[]> {
    return await db.select().from(plots).where(eq(plots.playerId, playerId));
  }

  async getPlot(playerId: string, row: number, col: number): Promise<Plot | undefined> {
    const [plot] = await db.select().from(plots).where(
      and(eq(plots.playerId, playerId), eq(plots.row, row), eq(plots.col, col))
    );
    return plot;
  }

  async createPlot(plot: InsertPlot): Promise<Plot> {
    const [newPlot] = await db.insert(plots).values(plot).returning();
    return newPlot;
  }

  async updatePlot(playerId: string, row: number, col: number, updates: Partial<Plot>): Promise<Plot | undefined> {
    const [plot] = await db
      .update(plots)
      .set(updates)
      .where(and(eq(plots.playerId, playerId), eq(plots.row, row), eq(plots.col, col)))
      .returning();
    return plot;
  }

  async getPlayerOvens(playerId: string): Promise<Oven[]> {
    return await db.select().from(ovens).where(eq(ovens.playerId, playerId));
  }

  async getOven(playerId: string, slotNumber: number): Promise<Oven | undefined> {
    const [oven] = await db.select().from(ovens).where(
      and(eq(ovens.playerId, playerId), eq(ovens.slotNumber, slotNumber))
    );
    return oven;
  }

  async createOven(oven: InsertOven): Promise<Oven> {
    const [newOven] = await db.insert(ovens).values(oven).returning();
    return newOven;
  }

  async updateOven(playerId: string, slotNumber: number, updates: Partial<Oven>): Promise<Oven | undefined> {
    const [oven] = await db
      .update(ovens)
      .set(updates)
      .where(and(eq(ovens.playerId, playerId), eq(ovens.slotNumber, slotNumber)))
      .returning();
    return oven;
  }

  async getPlayerChallenges(playerId: string): Promise<SeasonalChallenge[]> {
    return this.memStorage.getPlayerChallenges(playerId);
  }

  async getChallenge(playerId: string, challengeId: string): Promise<SeasonalChallenge | undefined> {
    return this.memStorage.getChallenge(playerId, challengeId);
  }

  async createChallenge(challenge: InsertChallenge): Promise<SeasonalChallenge> {
    return this.memStorage.createChallenge(challenge);
  }

  async updateChallenge(playerId: string, challengeId: string, updates: Partial<SeasonalChallenge>): Promise<SeasonalChallenge | undefined> {
    return this.memStorage.updateChallenge(playerId, challengeId, updates);
  }

  async updateChallengeProgress(playerId: string, challengeId: string, progress: number): Promise<SeasonalChallenge | undefined> {
    return this.memStorage.updateChallengeProgress(playerId, challengeId, progress);
  }

  async generateDailyChallenges(playerId: string): Promise<void> {
    return this.memStorage.generateDailyChallenges(playerId);
  }

  async initializePlayerField(playerId: string): Promise<void> {
    const player = await this.getPlayer(playerId);
    if (!player) return;

    const fieldSize = player.fieldSize;
    
    // Check if plots already exist
    const existingPlots = await db.select().from(plots).where(eq(plots.playerId, playerId));
    if (existingPlots.length > 0) return;

    // Create initial field plots
    for (let row = 0; row < fieldSize; row++) {
      for (let col = 0; col < fieldSize; col++) {
        await this.createPlot({
          playerId,
          row,
          col,
          state: "empty",
          cropType: "pumpkin",
          plantedAt: null,
          lastWatered: null,
          fertilized: 0,
        });
      }
    }
  }

  async initializePlayerKitchen(playerId: string): Promise<void> {
    const player = await this.getPlayer(playerId);
    if (!player) return;

    // Check if ovens already exist
    const existingOvens = await db.select().from(ovens).where(eq(ovens.playerId, playerId));
    if (existingOvens.length > 0) return;

    // Create initial kitchen ovens
    for (let slot = 1; slot <= player.kitchenSlots; slot++) {
      await this.createOven({
        playerId,
        slotNumber: slot,
        state: "empty",
        pieType: "pumpkin",
        startedAt: null,
      });
    }
  }

  async updatePumpkinGrowth(): Promise<void> {
    const now = new Date();
    
    // Get all plots that need growth checking
    const plotsToUpdate = await db.select().from(plots).where(
      and(
        ne(plots.state, "empty"),
        ne(plots.state, "mature"),
        isNotNull(plots.plantedAt)
      )
    );
    
    for (const plot of plotsToUpdate) {
      if (!plot.plantedAt) continue;
      
      const plantedDate = new Date(plot.plantedAt);
      const minutesSincePlanted = Math.floor((now.getTime() - plantedDate.getTime()) / (1000 * 60));
      
      // Apply fertilizer speed boost (reduces time needed by 50%)
      const effectiveMinutes = plot.fertilized ? minutesSincePlanted * 2 : minutesSincePlanted;
      
      // Different growth times based on crop type
      const growthTime = plot.cropType === "apple" ? 15 : 60; // Apples: 15min, Pumpkins: 60min
      const midGrowthTime = Math.floor(growthTime / 2);
      
      let newState: PlotState = plot.state;
      if (effectiveMinutes >= growthTime) {
        newState = "mature";
      } else if (effectiveMinutes >= midGrowthTime) {
        newState = "growing";
      } else if (effectiveMinutes >= 0) {
        newState = "seedling";
      }

      if (newState !== plot.state) {
        await db.update(plots)
          .set({ state: newState })
          .where(and(
            eq(plots.playerId, plot.playerId),
            eq(plots.row, plot.row),
            eq(plots.col, plot.col)
          ));
      }
    }
  }

  async updatePieBaking(): Promise<void> {
    return this.memStorage.updatePieBaking();
  }

  async expandPlayerField(playerId: string): Promise<{ success: boolean; message: string; cost?: number }> {
    const player = await this.getPlayer(playerId);
    if (!player) {
      return { success: false, message: "Player not found" };
    }

    if (player.fieldSize >= 10) {
      return { success: false, message: "Field is already at maximum size (10x10)" };
    }

    // Calculate expansion cost: 50 coins for 4x4, 100 for 5x5, 200 for 6x6, etc.
    const newSize = player.fieldSize + 1;
    const cost = Math.pow(2, newSize - 4) * 50; // Exponentially increasing cost

    if (player.coins < cost) {
      return { success: false, message: `Not enough coins. Expansion to ${newSize}x${newSize} costs ${cost} coins`, cost };
    }

    // Update player in database
    await this.updatePlayer(playerId, {
      coins: player.coins - cost,
      fieldSize: newSize,
    });

    // Add new plots for the expanded area in database
    for (let row = 0; row < newSize; row++) {
      for (let col = 0; col < newSize; col++) {
        const existingPlot = await this.getPlot(playerId, row, col);
        if (!existingPlot) {
          await this.createPlot({
            playerId,
            row,
            col,
            state: "empty",
            cropType: "pumpkin",
            plantedAt: null,
            lastWatered: null,
            fertilized: 0,
          });
        }
      }
    }

    return { 
      success: true, 
      message: `Field expanded to ${newSize}x${newSize} for ${cost} coins!`,
      cost 
    };
  }

  async expandPlayerKitchen(playerId: string): Promise<{ success: boolean; message: string; cost?: number }> {
    return this.memStorage.expandPlayerKitchen(playerId);
  }

  async gainExperience(playerId: string, xp: number): Promise<{ player: Player; leveledUp: boolean; newLevel?: number }> {
    const player = await this.getPlayer(playerId);
    if (!player) throw new Error("Player not found");

    const newExperience = player.experience + xp;
    
    // After level 10, players can only advance with tools (manual unlock)
    let newLevel = player.level;
    if (player.level < 10) {
      newLevel = this.calculateLevelFromExperience(newExperience, 10);
    }
    
    const leveledUp = newLevel > player.level;

    const updatedPlayer = await this.updatePlayer(playerId, { 
      experience: newExperience, 
      level: newLevel 
    });

    return { 
      player: updatedPlayer!, 
      leveledUp, 
      newLevel: leveledUp ? newLevel : undefined 
    };
  }

  // Calculate current level based on total experience
  private calculateLevelFromExperience(totalExperience: number, maxLevel: number = 10): number {
    let level = 1;
    
    for (let testLevel = 2; testLevel <= maxLevel; testLevel++) {
      const requiredXP = this.getXPRequiredForLevel(testLevel);
      if (totalExperience >= requiredXP) {
        level = testLevel;
      } else {
        break;
      }
    }
    
    return level;
  }

  // Calculate XP required for a specific level (incremental scaling)
  private getXPRequiredForLevel(level: number): number {
    if (level <= 1) return 0;
    
    // Base XP for level 2: 100
    // Each level requires 20% more XP than the previous
    // Level 2: 100, Level 3: 120, Level 4: 144, Level 5: 173, etc.
    let totalXP = 0;
    for (let i = 2; i <= level; i++) {
      const baseXP = 100;
      const multiplier = Math.pow(1.2, i - 2);
      totalXP += Math.floor(baseXP * multiplier);
    }
    return totalXP;
  }

  checkLevelUnlocks(player: Player): { appleSeeds: boolean; kitchen: boolean } {
    return {
      appleSeeds: player.level >= 2,
      kitchen: player.level >= 2,
    };
  }

  // Add missing addExperience method that routes calls properly
  async addExperience(playerId: string, amount: number): Promise<{ newLevel: number; leveledUp: boolean; experience: number }> {
    const result = await this.gainExperience(playerId, amount);
    return {
      newLevel: result.player.level,
      leveledUp: result.leveledUp,
      experience: result.player.experience
    };
  }

  // Add missing methods for routes
  async unlockNextLevel(playerId: string): Promise<{ success: boolean; newLevel: number; toolsRequired: number; message: string }> {
    return this.memStorage.unlockNextLevel(playerId);
  }

  async collectDailyCoins(playerId: string): Promise<{ success: boolean; message: string; coinsReceived?: number }> {
    const player = await this.getPlayer(playerId);
    if (!player) {
      return { success: false, message: "Player not found" };
    }

    // Check if 24 hours have passed since last collection
    const now = new Date();
    const lastCollection = player.lastDailyCollection;
    
    if (lastCollection) {
      const timeSinceLastCollection = now.getTime() - lastCollection.getTime();
      const hoursElapsed = timeSinceLastCollection / (1000 * 60 * 60);
      
      if (hoursElapsed < 24) {
        const hoursRemaining = Math.ceil(24 - hoursElapsed);
        return { 
          success: false, 
          message: `Daily coins already collected. Try again in ${hoursRemaining} hours.` 
        };
      }
    }

    // Give 5 free coins
    const updatedPlayer = await this.updatePlayer(playerId, {
      coins: player.coins + 5,
      lastDailyCollection: now,
    });

    if (!updatedPlayer) {
      return { success: false, message: "Failed to update player" };
    }

    return {
      success: true,
      message: "Collected 5 daily coins!",
      coinsReceived: 5
    };
  }

  async startBaking(playerId: string, slotNumber: number, pieType: "pumpkin" | "apple"): Promise<{ success: boolean; message: string }> {
    return this.memStorage.startBaking(playerId, slotNumber, pieType);
  }

  async collectPie(playerId: string, slotNumber: number): Promise<{ success: boolean; message: string; pieType?: "pumpkin" | "apple" }> {
    return this.memStorage.collectPie(playerId, slotNumber);
  }

  // Check if daily coins can be collected (for UI display)
  async canCollectDailyCoins(playerId: string): Promise<{ canCollect: boolean; hoursUntilNext?: number }> {
    const player = await this.getPlayer(playerId);
    if (!player) return { canCollect: false };

    const lastCollection = player.lastDailyCollection;
    if (!lastCollection) return { canCollect: true };

    const now = new Date();
    const timeSinceLastCollection = now.getTime() - lastCollection.getTime();
    const hoursElapsed = timeSinceLastCollection / (1000 * 60 * 60);

    if (hoursElapsed >= 24) {
      return { canCollect: true };
    } else {
      return { 
        canCollect: false, 
        hoursUntilNext: Math.ceil(24 - hoursElapsed) 
      };
    }
  }

  // Customer Order operations
  async getPlayerOrders(playerId: string): Promise<CustomerOrder[]> {
    try {
      const orders = await db.select().from(customerOrders).where(eq(customerOrders.playerId, playerId));
      return orders;
    } catch (error) {
      console.error('Database error in getPlayerOrders:', error);
      return [];
    }
  }

  async getOrder(playerId: string, orderId: string): Promise<CustomerOrder | undefined> {
    try {
      const [order] = await db.select().from(customerOrders)
        .where(and(eq(customerOrders.playerId, playerId), eq(customerOrders.id, orderId)));
      return order || undefined;
    } catch (error) {
      console.error('Database error in getOrder:', error);
      return undefined;
    }
  }

  async createOrder(order: InsertOrder): Promise<CustomerOrder> {
    try {
      const [newOrder] = await db.insert(customerOrders).values(order).returning();
      return newOrder;
    } catch (error) {
      console.error('Database error in createOrder:', error);
      throw error;
    }
  }

  async updateOrder(playerId: string, orderId: string, updates: Partial<CustomerOrder>): Promise<CustomerOrder | undefined> {
    try {
      const [updatedOrder] = await db.update(customerOrders)
        .set(updates)
        .where(and(eq(customerOrders.playerId, playerId), eq(customerOrders.id, orderId)))
        .returning();
      return updatedOrder || undefined;
    } catch (error) {
      console.error('Database error in updateOrder:', error);
      return undefined;
    }
  }

  async fulfillOrder(playerId: string, orderId: string): Promise<{ success: boolean; message: string; rewards?: any }> {
    const order = await this.getOrder(playerId, orderId);
    if (!order) {
      return { success: false, message: "Order not found" };
    }

    if (order.status !== "pending") {
      return { success: false, message: "Order is no longer available" };
    }

    const player = await this.getPlayer(playerId);
    if (!player) {
      return { success: false, message: "Player not found" };
    }

    // Check if player has required items
    const required = order.requiredItems;
    if (required.pumpkins && player.pumpkins < required.pumpkins) {
      return { success: false, message: `Need ${required.pumpkins} pumpkins` };
    }
    if (required.apples && player.apples < required.apples) {
      return { success: false, message: `Need ${required.apples} apples` };
    }
    if (required.pies && player.pies < required.pies) {
      return { success: false, message: `Need ${required.pies} pumpkin pies` };
    }
    if (required.applePies && player.applePies < required.applePies) {
      return { success: false, message: `Need ${required.applePies} apple pies` };
    }

    // Deduct required items from player
    const playerUpdates: Partial<Player> = {};
    if (required.pumpkins) playerUpdates.pumpkins = player.pumpkins - required.pumpkins;
    if (required.apples) playerUpdates.apples = player.apples - required.apples;
    if (required.pies) playerUpdates.pies = player.pies - required.pies;
    if (required.applePies) playerUpdates.applePies = player.applePies - required.applePies;

    // Award rewards
    playerUpdates.coins = player.coins + order.rewards.coins;
    playerUpdates.experience = player.experience + order.rewards.experience;
    
    if (order.rewards.bonus) {
      const bonus = order.rewards.bonus;
      if (bonus.seeds) playerUpdates.seeds = (player.seeds || 0) + bonus.seeds;
      if (bonus.fertilizer) playerUpdates.fertilizer = (player.fertilizer || 0) + bonus.fertilizer;
      if (bonus.tools) playerUpdates.tools = (player.tools || 0) + bonus.tools;
    }

    await this.updatePlayer(playerId, playerUpdates);

    // Mark order as completed
    await this.updateOrder(playerId, orderId, {
      status: "completed",
      completedAt: new Date(),
    });

    return {
      success: true,
      message: `Order completed! Earned ${order.rewards.coins} coins and ${order.rewards.experience} XP`,
      rewards: order.rewards,
    };
  }

  async generateCustomerOrders(playerId: string): Promise<void> {
    const player = await this.getPlayer(playerId);
    if (!player) return;

    // Check existing active orders - don't generate more if player already has 3+
    const existingOrders = await this.getPlayerOrders(playerId);
    const activeOrders = existingOrders.filter(order => order.status === "pending");
    if (activeOrders.length >= 3) return;

    // Generate 1-2 new orders based on player level
    const numOrders = Math.min(2, 3 - activeOrders.length);
    
    for (let i = 0; i < numOrders; i++) {
      const orderTemplate = this.generateOrderTemplate(player.level);
      const expiresAt = new Date(Date.now() + orderTemplate.timeLimit * 60 * 1000);
      
      await this.createOrder({
        playerId,
        customerName: orderTemplate.customerName,
        customerAvatar: orderTemplate.customerAvatar,
        title: orderTemplate.title,
        description: orderTemplate.description,
        requiredItems: orderTemplate.requiredItems,
        rewards: orderTemplate.rewards,
        status: "pending",
        priority: orderTemplate.priority,
        timeLimit: orderTemplate.timeLimit,
        expiresAt,
        completedAt: null,
      });
    }
  }

  private generateOrderTemplate(playerLevel: number) {
    const customers = [
      { name: "Farmer Joe", avatar: "👨‍🌾" },
      { name: "Baker Sarah", avatar: "👩‍🍳" },
      { name: "Mrs. Thompson", avatar: "👵" },
      { name: "Chef Marco", avatar: "👨‍🍳" },
      { name: "Little Emily", avatar: "👧" },
      { name: "Mayor Wilson", avatar: "👔" },
    ];

    const customer = customers[Math.floor(Math.random() * customers.length)];
    const difficulty = Math.min(3, Math.max(1, playerLevel));
    const timeLimit = 60 + (difficulty * 30); // 60-150 minutes

    // Generate order based on difficulty and available items
    const orderTypes = [
      {
        title: "Fresh Pumpkins Needed",
        description: `I need some fresh pumpkins for my autumn decorations!`,
        requiredItems: { pumpkins: difficulty * 2 },
        rewards: { coins: difficulty * 50, experience: difficulty * 15 },
        priority: 1,
      },
      {
        title: "Apple Harvest Request",
        description: `Could you spare some crisp apples? They're for my famous apple cider!`,
        requiredItems: { apples: difficulty * 3 },
        rewards: { coins: difficulty * 35, experience: difficulty * 12 },
        priority: 1,
      },
    ];

    // Add pie orders for higher level players
    if (playerLevel >= 2) {
      orderTypes.push({
        title: "Pumpkin Pie Special",
        description: `My customers are craving homemade pumpkin pies. Can you help?`,
        requiredItems: { pies: difficulty },
        rewards: { coins: difficulty * 80, experience: difficulty * 25, bonus: { fertilizer: 2 } },
        priority: 2,
      });
      
      orderTypes.push({
        title: "Apple Pie Delight",
        description: `I need some delicious apple pies for the town festival!`,
        requiredItems: { applePies: difficulty },
        rewards: { coins: difficulty * 70, experience: difficulty * 22, bonus: { seeds: 3 } },
        priority: 2,
      });
    }

    const orderType = orderTypes[Math.floor(Math.random() * orderTypes.length)];

    return {
      customerName: customer.name,
      customerAvatar: customer.avatar,
      title: orderType.title,
      description: orderType.description,
      requiredItems: orderType.requiredItems,
      rewards: orderType.rewards,
      priority: orderType.priority,
      timeLimit,
    };
  }

  async expireOldOrders(): Promise<void> {
    try {
      const now = new Date();
      await db.update(customerOrders)
        .set({ status: "expired" })
        .where(and(
          eq(customerOrders.status, "pending"),
          lt(customerOrders.expiresAt, now)
        ));
    } catch (error) {
      console.error('Database error in expireOldOrders:', error);
    }
  }

  // Game reset operations
  async clearAllPlayerPlots(playerId: string): Promise<void> {
    try {
      await db.delete(plots).where(eq(plots.playerId, playerId));
      console.log(`🧹 DatabaseStorage: Cleared all plots for player ${playerId}`);
    } catch (error) {
      console.error('Database error in clearAllPlayerPlots:', error);
    }
  }

  async clearAllPlayerOvens(playerId: string): Promise<void> {
    try {
      await db.delete(ovens).where(eq(ovens.playerId, playerId));
      console.log(`🧹 DatabaseStorage: Cleared all ovens for player ${playerId}`);
    } catch (error) {
      console.error('Database error in clearAllPlayerOvens:', error);
    }
  }
}

export const storage = new DatabaseStorage();

