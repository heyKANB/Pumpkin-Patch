import { type Player, type InsertPlayer, type Plot, type InsertPlot, type PlotState } from "@shared/schema";
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
  
  // Game operations
  initializePlayerField(playerId: string): Promise<void>;
  updatePumpkinGrowth(): Promise<void>;
  expandPlayerField(playerId: string): Promise<{ success: boolean; message: string; cost?: number }>;
}

export class MemStorage implements IStorage {
  private players: Map<string, Player>;
  private plots: Map<string, Plot>;

  constructor() {
    this.players = new Map();
    this.plots = new Map();
    
    // Create default player for demo
    this.createDefaultPlayer();
  }

  private async createDefaultPlayer() {
    const defaultPlayer: Player = {
      id: "default",
      coins: 150,
      seeds: 25,
      pumpkins: 8,
      fertilizer: 0,
      tools: 0,
      day: 1,
      fieldSize: 3,
      lastUpdated: new Date(),
    };
    this.players.set("default", defaultPlayer);
    await this.initializePlayerField("default");
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
      ...insertPlayer, 
      id,
      lastUpdated: new Date(),
    };
    this.players.set(id, player);
    await this.initializePlayerField(id);
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
    const plot: Plot = { ...insertPlot, id };
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
          });
        }
      }
    }

    // Add some initial demo plots for the default player (only if field is 3x3)
    if (playerId === "default" && fieldSize === 3) {
      await this.updatePlot(playerId, 0, 1, { 
        state: "seedling", 
        plantedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      });
      await this.updatePlot(playerId, 1, 0, { 
        state: "growing", 
        plantedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
      });
      await this.updatePlot(playerId, 2, 2, { 
        state: "mature", 
        plantedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
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

  async updatePumpkinGrowth(): Promise<void> {
    const now = new Date();
    
    for (const plot of this.plots.values()) {
      if (plot.state === "empty" || plot.state === "mature" || !plot.plantedAt) {
        continue;
      }

      const daysSincePlanted = Math.floor((now.getTime() - plot.plantedAt.getTime()) / (1000 * 60 * 60 * 24));
      
      let newState: PlotState = plot.state;
      if (daysSincePlanted >= 6) {
        newState = "mature";
      } else if (daysSincePlanted >= 3) {
        newState = "growing";
      } else if (daysSincePlanted >= 0) {
        newState = "seedling";
      }

      if (newState !== plot.state) {
        await this.updatePlot(plot.playerId, plot.row, plot.col, { state: newState });
      }
    }
  }
}

export const storage = new MemStorage();
