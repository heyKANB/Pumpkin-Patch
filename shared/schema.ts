import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  level: integer("level").notNull().default(1),
  experience: integer("experience").notNull().default(0),
  coins: integer("coins").notNull().default(25),
  seeds: integer("seeds").notNull().default(3),
  pumpkins: integer("pumpkins").notNull().default(0),
  appleSeeds: integer("apple_seeds").notNull().default(0),
  apples: integer("apples").notNull().default(0),
  pies: integer("pies").notNull().default(0),
  applePies: integer("apple_pies").notNull().default(0),
  fertilizer: integer("fertilizer").notNull().default(0),
  tools: integer("tools").notNull().default(0),
  day: integer("day").notNull().default(1),
  fieldSize: integer("field_size").notNull().default(3),
  kitchenSlots: integer("kitchen_slots").notNull().default(1),
  kitchenUnlocked: integer("kitchen_unlocked").notNull().default(0), // 0 = locked, 1 = unlocked
  lastDailyCollection: timestamp("last_daily_collection"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const plotStates = ["empty", "seedling", "growing", "mature"] as const;
export type PlotState = typeof plotStates[number];

export const cropTypes = ["pumpkin", "apple"] as const;
export type CropType = typeof cropTypes[number];

export const plots = pgTable("plots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: varchar("player_id").notNull(),
  row: integer("row").notNull(),
  col: integer("col").notNull(),
  state: text("state").$type<PlotState>().notNull().default("empty"),
  cropType: text("crop_type").$type<CropType>().default("pumpkin"),
  plantedAt: timestamp("planted_at"),
  lastWatered: timestamp("last_watered"),
  fertilized: integer("fertilized").notNull().default(0), // 0 = not fertilized, 1 = fertilized
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  lastUpdated: true,
}).extend({
  appleSeeds: z.number().min(0).default(3), // Ensure new players start with 3 apple seeds
});

export const insertPlotSchema = createInsertSchema(plots).omit({
  id: true,
});

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;
export type InsertPlot = z.infer<typeof insertPlotSchema>;
export type Plot = typeof plots.$inferSelect;
export type InsertOven = z.infer<typeof insertOvenSchema>;
export type Oven = typeof ovens.$inferSelect;

// Game action schemas
export const plantSeedSchema = z.object({
  playerId: z.string(),
  row: z.number().min(0).max(9),
  col: z.number().min(0).max(9),
  cropType: z.enum(["pumpkin", "apple"]).default("pumpkin"),
});

export const harvestPlotSchema = z.object({
  playerId: z.string(),
  row: z.number().min(0).max(9),
  col: z.number().min(0).max(9),
});

export const fertilizePlotSchema = z.object({
  playerId: z.string(),
  row: z.number().min(0).max(9),
  col: z.number().min(0).max(9),
});

// Challenge system
export const challengeTypes = ["harvest", "plant", "bake", "earn", "expand"] as const;
export type ChallengeType = typeof challengeTypes[number];

export const challengeStatus = ["active", "completed", "failed", "locked"] as const;
export type ChallengeStatus = typeof challengeStatus[number];

export const seasonalChallenges = pgTable("seasonal_challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: varchar("player_id").notNull(),
  challengeId: varchar("challenge_id").notNull(), // unique identifier for challenge type
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").$type<ChallengeType>().notNull(),
  targetValue: integer("target_value").notNull(), // target amount to achieve
  currentProgress: integer("current_progress").notNull().default(0),
  rewards: jsonb("rewards").$type<{coins?: number, seeds?: number, pumpkins?: number, apples?: number, fertilizer?: number, tools?: number}>().notNull(),
  status: text("status").$type<ChallengeStatus>().notNull().default("active"),
  difficulty: integer("difficulty").notNull().default(1), // 1-5 difficulty levels
  season: text("season").notNull().default("autumn"), // autumn, winter, spring, summer
  expiresAt: timestamp("expires_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertChallengeSchema = createInsertSchema(seasonalChallenges).omit({
  id: true,
  createdAt: true,
});

export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type SeasonalChallenge = typeof seasonalChallenges.$inferSelect;

// Challenge action schemas
export const completeChallengeSchema = z.object({
  playerId: z.string(),
  challengeId: z.string(),
});

export const updateChallengeProgressSchema = z.object({
  playerId: z.string(),
  challengeId: z.string(),
  progress: z.number(),
});

export const ovenStates = ["empty", "baking", "ready"] as const;
export type OvenState = typeof ovenStates[number];

export const ovens = pgTable("ovens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: varchar("player_id").notNull(),
  slotNumber: integer("slot_number").notNull(),
  state: text("state").$type<OvenState>().notNull().default("empty"),
  pieType: text("pie_type", { enum: ["pumpkin", "apple"] }),
  startedAt: timestamp("started_at"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const startBakingSchema = z.object({
  playerId: z.string(),
  slotNumber: z.number().min(0).max(4),
  pieType: z.enum(["pumpkin", "apple"]).default("pumpkin"),
});

export const collectPieSchema = z.object({
  playerId: z.string(),
  slotNumber: z.number().min(0).max(4),
});

export const expandKitchenSchema = z.object({
  playerId: z.string(),
});

export const unlockKitchenSchema = z.object({
  playerId: z.string(),
});

export const insertOvenSchema = createInsertSchema(ovens).omit({
  id: true,
  lastUpdated: true,
});

export const collectDailyCoinsSchema = z.object({
  playerId: z.string(),
});

export const buyItemSchema = z.object({
  playerId: z.string(),
  item: z.enum(["seeds", "apple-seeds", "fertilizer", "tools"]),
  quantity: z.number().min(1).max(100),
});

export const sellItemSchema = z.object({
  playerId: z.string(),
  item: z.enum(["pumpkins", "apples", "seeds", "apple-seeds", "pies", "apple-pies"]),
  quantity: z.number().min(1),
});

export const expandFieldSchema = z.object({
  playerId: z.string(),
});

export const rewardCoinsSchema = z.object({
  playerId: z.string(),
  amount: z.number().min(1).max(1000),
});

export const unlockLevelSchema = z.object({
  playerId: z.string(),
});

// Customer Order system
export const orderStatus = ["pending", "in_progress", "completed", "expired"] as const;
export type OrderStatus = typeof orderStatus[number];

export const customerOrders = pgTable("customer_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: varchar("player_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerAvatar: text("customer_avatar").notNull(), // emoji or avatar identifier
  title: text("title").notNull(),
  description: text("description").notNull(),
  requiredItems: jsonb("required_items").$type<{
    pumpkins?: number;
    apples?: number;
    pies?: number;
    applePies?: number;
  }>().notNull(),
  rewards: jsonb("rewards").$type<{
    coins: number;
    experience: number;
    bonus?: { seeds?: number; fertilizer?: number; tools?: number };
  }>().notNull(),
  status: text("status").$type<OrderStatus>().notNull().default("pending"),
  priority: integer("priority").notNull().default(1), // 1=normal, 2=urgent, 3=premium
  timeLimit: integer("time_limit").notNull(), // minutes until expiration
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at").notNull(),
});

export const insertOrderSchema = createInsertSchema(customerOrders).omit({
  id: true,
  createdAt: true,
});

export const fulfillOrderSchema = z.object({
  playerId: z.string(),
  orderId: z.string(),
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type CustomerOrder = typeof customerOrders.$inferSelect;

export type PlantSeedRequest = z.infer<typeof plantSeedSchema>;
export type HarvestPlotRequest = z.infer<typeof harvestPlotSchema>;
export type BuyItemRequest = z.infer<typeof buyItemSchema>;
export type SellItemRequest = z.infer<typeof sellItemSchema>;
export type ExpandFieldRequest = z.infer<typeof expandFieldSchema>;
export type RewardCoinsRequest = z.infer<typeof rewardCoinsSchema>;
export type UnlockLevelRequest = z.infer<typeof unlockLevelSchema>;
