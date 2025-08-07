import { type Player, type InsertPlayer, type Plot, type InsertPlot, type PlotState, type Oven, type InsertOven, type OvenState } from "@shared/schema";
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

  constructor() {
    this.players = new Map();
    this.plots = new Map();
    this.ovens = new Map();
    
    // Create default player for demo
    this.createDefaultPlayer();
  }

  private async createDefaultPlayer() {
    const defaultPlayer: Player = {
      id: "default",
      coins: 150,
      seeds: 25,
      pumpkins: 8,
      pies: 0,
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
      pies: insertPlayer.pies ?? 0,
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

  async updatePieBaking(): Promise<void> {
    const now = new Date();
    
    for (const oven of Array.from(this.ovens.values())) {
      if (oven.state !== "baking" || !oven.startedAt) {
        continue;
      }

      const minutesSinceStarted = Math.floor((now.getTime() - oven.startedAt.getTime()) / (1000 * 60));
      
      if (minutesSinceStarted >= 30) { // 30 minutes baking time
        await this.updateOven(oven.playerId, oven.slotNumber, { 
          state: "ready" 
        });
      }
    }
  }
}

export const storage = new MemStorage();
