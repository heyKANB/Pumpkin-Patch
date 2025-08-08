import { type Player, type InsertPlayer, type Plot, type InsertPlot, type PlotState, type Oven, type InsertOven, type OvenState, type SeasonalChallenge, type InsertChallenge, type ChallengeStatus } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Player operations
  getPlayer(id: string): Promise<Player | undefined>;
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
  
  // Game operations
  initializePlayerField(playerId: string): Promise<void>;
  initializePlayerKitchen(playerId: string): Promise<void>;
  updatePumpkinGrowth(): Promise<void>;
  updatePieBaking(): Promise<void>;
  expandPlayerField(playerId: string): Promise<{ success: boolean; message: string; cost?: number }>;
  expandPlayerKitchen(playerId: string): Promise<{ success: boolean; message: string; cost?: number }>;
}

export class MemStorage implements IStorage {
  private players: Map<string, Player>;
  private plots: Map<string, Plot>;
  private ovens: Map<string, Oven>;
  private challenges: Map<string, SeasonalChallenge>;

  constructor() {
    this.players = new Map();
    this.plots = new Map();
    this.ovens = new Map();
    this.challenges = new Map();
    
    // Create default player for demo
    this.createDefaultPlayer();
  }

  private async createDefaultPlayer() {
    const defaultPlayer: Player = {
      id: "default",
      coins: 150,
      seeds: 25,
      pumpkins: 8,
      appleSeeds: 0,
      apples: 0,
      pies: 0,
      applePies: 0,
      fertilizer: 0,
      tools: 0,
      day: 1,
      fieldSize: 3,
      kitchenSlots: 1,
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

  async getPlayer(id: string): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = randomUUID();
    const player: Player = { 
      id,
      coins: insertPlayer.coins ?? 150,
      seeds: insertPlayer.seeds ?? 25,
      pumpkins: insertPlayer.pumpkins ?? 8,
      appleSeeds: insertPlayer.appleSeeds ?? 0,
      apples: insertPlayer.apples ?? 0,
      pies: insertPlayer.pies ?? 0,
      applePies: insertPlayer.applePies ?? 0,
      fertilizer: insertPlayer.fertilizer ?? 0,
      tools: insertPlayer.tools ?? 0,
      day: insertPlayer.day ?? 1,
      fieldSize: insertPlayer.fieldSize ?? 3,
      kitchenSlots: insertPlayer.kitchenSlots ?? 1,
      lastUpdated: new Date(),
    };
    this.players.set(id, player);
    await this.initializePlayerField(id);
    await this.initializePlayerKitchen(id);
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
      cropType: insertPlot.cropType ?? "pumpkin",
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

      const minutesSincePlanted = Math.floor((now.getTime() - plot.plantedAt.getTime()) / (1000 * 60));
      
      // Apply fertilizer speed boost (reduces time needed by 50%)
      const effectiveMinutes = plot.fertilized ? minutesSincePlanted * 2 : minutesSincePlanted;
      
      let newState: PlotState = plot.state;
      if (effectiveMinutes >= 60) {
        newState = "mature";
      } else if (effectiveMinutes >= 30) {
        newState = "growing";
      } else if (effectiveMinutes >= 0) {
        newState = "seedling";
      }

      if (newState !== plot.state) {
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
      ...insertChallenge,
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
}

export const storage = new MemStorage();

