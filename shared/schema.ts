import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  coins: integer("coins").notNull().default(150),
  seeds: integer("seeds").notNull().default(25),
  pumpkins: integer("pumpkins").notNull().default(8),
  day: integer("day").notNull().default(1),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const plotStates = ["empty", "seedling", "growing", "mature"] as const;
export type PlotState = typeof plotStates[number];

export const plots = pgTable("plots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: varchar("player_id").notNull(),
  row: integer("row").notNull(),
  col: integer("col").notNull(),
  state: text("state").$type<PlotState>().notNull().default("empty"),
  plantedAt: timestamp("planted_at"),
  lastWatered: timestamp("last_watered"),
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  lastUpdated: true,
});

export const insertPlotSchema = createInsertSchema(plots).omit({
  id: true,
});

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;
export type InsertPlot = z.infer<typeof insertPlotSchema>;
export type Plot = typeof plots.$inferSelect;

// Game action schemas
export const plantSeedSchema = z.object({
  playerId: z.string(),
  row: z.number().min(0).max(5),
  col: z.number().min(0).max(7),
});

export const harvestPlotSchema = z.object({
  playerId: z.string(),
  row: z.number().min(0).max(5),
  col: z.number().min(0).max(7),
});

export const buyItemSchema = z.object({
  playerId: z.string(),
  item: z.enum(["seeds"]),
  quantity: z.number().min(1).max(100),
});

export const sellItemSchema = z.object({
  playerId: z.string(),
  item: z.enum(["pumpkins"]),
  quantity: z.number().min(1),
});

export type PlantSeedRequest = z.infer<typeof plantSeedSchema>;
export type HarvestPlotRequest = z.infer<typeof harvestPlotSchema>;
export type BuyItemRequest = z.infer<typeof buyItemSchema>;
export type SellItemRequest = z.infer<typeof sellItemSchema>;
