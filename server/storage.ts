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
      day: 1,
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
    // Create 8x6 grid of empty plots
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 8; col++) {
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

    // Add some initial demo plots for the default player
    if (playerId === "default") {
      await this.updatePlot(playerId, 0, 2, { 
        state: "seedling", 
        plantedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      });
      await this.updatePlot(playerId, 0, 3, { 
        state: "growing", 
        plantedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
      });
      await this.updatePlot(playerId, 0, 4, { 
        state: "mature", 
        plantedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      });
      await this.updatePlot(playerId, 0, 7, { 
        state: "mature", 
        plantedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days ago
      });
      await this.updatePlot(playerId, 1, 0, { 
        state: "seedling", 
        plantedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      });
      await this.updatePlot(playerId, 1, 2, { 
        state: "growing", 
        plantedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      });
      await this.updatePlot(playerId, 1, 5, { 
        state: "seedling", 
        plantedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      });
      await this.updatePlot(playerId, 1, 6, { 
        state: "mature", 
        plantedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000) // 9 days ago
      });
    }
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
