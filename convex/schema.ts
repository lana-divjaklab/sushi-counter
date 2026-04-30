import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tables: defineTable({
    name: v.string(),
    code: v.string(),
    createdByClientId: v.string(),
    caloriesPerPiece: v.number(),
    status: v.union(v.literal("active"), v.literal("archived")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_status", ["status"]),

  players: defineTable({
    tableId: v.id("tables"),
    clientId: v.string(),
    name: v.string(),
    pieces: v.number(),
    calories: v.number(),
    joinedAt: v.number(),
    updatedAt: v.number(),
    lastActionAt: v.number(),
  })
    .index("by_table", ["tableId"])
    .index("by_table_client", ["tableId", "clientId"])
    .index("by_client", ["clientId"]),

  events: defineTable({
    tableId: v.id("tables"),
    playerId: v.id("players"),
    clientId: v.string(),
    playerName: v.string(),
    delta: v.number(),
    resultingPieces: v.number(),
    caloriesDelta: v.number(),
    createdAt: v.number(),
  })
    .index("by_table", ["tableId"])
    .index("by_client", ["clientId"]),
});
