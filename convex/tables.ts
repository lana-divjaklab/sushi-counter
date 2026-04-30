import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export const createTable = mutation({
  args: {
    tableName: v.string(),
    playerName: v.string(),
    clientId: v.string(),
    caloriesPerPiece: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let code = "";
    for (let i = 0; i < 10; i += 1) {
      const candidate = randomCode();
      const existing = await ctx.db
        .query("tables")
        .withIndex("by_code", (q) => q.eq("code", candidate))
        .unique();
      if (!existing) {
        code = candidate;
        break;
      }
    }
    if (!code) throw new Error("Could not generate unique table code");

    const tableId = await ctx.db.insert("tables", {
      name: args.tableName.trim(),
      code,
      createdByClientId: args.clientId,
      caloriesPerPiece: args.caloriesPerPiece,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("players", {
      tableId,
      clientId: args.clientId,
      name: args.playerName.trim(),
      pieces: 0,
      calories: 0,
      joinedAt: now,
      updatedAt: now,
      lastActionAt: now,
    });

    return { code };
  },
});

export const joinTable = mutation({
  args: {
    code: v.string(),
    playerName: v.string(),
    clientId: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedCode = args.code.trim().toUpperCase();
    const table = await ctx.db
      .query("tables")
      .withIndex("by_code", (q) => q.eq("code", normalizedCode))
      .unique();

    if (!table || table.status !== "active") {
      throw new Error("Table not found");
    }

    const now = Date.now();
    const existingPlayer = await ctx.db
      .query("players")
      .withIndex("by_table_client", (q) => q.eq("tableId", table._id).eq("clientId", args.clientId))
      .unique();

    if (existingPlayer) {
      await ctx.db.patch(existingPlayer._id, {
        name: args.playerName.trim(),
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("players", {
        tableId: table._id,
        clientId: args.clientId,
        name: args.playerName.trim(),
        pieces: 0,
        calories: 0,
        joinedAt: now,
        updatedAt: now,
        lastActionAt: now,
      });
    }

    await ctx.db.patch(table._id, { updatedAt: now });

    return { code: normalizedCode };
  },
});

export const changeCount = mutation({
  args: {
    code: v.string(),
    clientId: v.string(),
    delta: v.number(),
  },
  handler: async (ctx, args) => {
    if (![1, -1].includes(args.delta)) {
      throw new Error("Delta must be 1 or -1");
    }

    const table = await ctx.db
      .query("tables")
      .withIndex("by_code", (q) => q.eq("code", args.code.trim().toUpperCase()))
      .unique();

    if (!table) throw new Error("Table not found");

    const player = await ctx.db
      .query("players")
      .withIndex("by_table_client", (q) => q.eq("tableId", table._id).eq("clientId", args.clientId))
      .unique();

    if (!player) throw new Error("Player not found in this table");

    const nextPieces = Math.max(0, player.pieces + args.delta);
    const actualDelta = nextPieces - player.pieces;

    if (actualDelta === 0) {
      return { pieces: player.pieces, calories: player.calories };
    }

    const caloriesDelta = actualDelta * table.caloriesPerPiece;
    const now = Date.now();

    await ctx.db.patch(player._id, {
      pieces: nextPieces,
      calories: Math.max(0, player.calories + caloriesDelta),
      updatedAt: now,
      lastActionAt: now,
    });

    await ctx.db.patch(table._id, { updatedAt: now });

    await ctx.db.insert("events", {
      tableId: table._id,
      playerId: player._id,
      clientId: player.clientId,
      playerName: player.name,
      delta: actualDelta,
      resultingPieces: nextPieces,
      caloriesDelta,
      createdAt: now,
    });

    return {
      pieces: nextPieces,
      calories: Math.max(0, player.calories + caloriesDelta),
    };
  },
});

export const getTableState = query({
  args: {
    code: v.string(),
    clientId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalizedCode = args.code.trim().toUpperCase();
    const table = await ctx.db
      .query("tables")
      .withIndex("by_code", (q) => q.eq("code", normalizedCode))
      .unique();

    if (!table) return null;

    const players = await ctx.db
      .query("players")
      .withIndex("by_table", (q) => q.eq("tableId", table._id))
      .collect();

    const leaderboard = [...players]
      .sort((a, b) => {
        if (b.pieces !== a.pieces) return b.pieces - a.pieces;
        return a.joinedAt - b.joinedAt;
      })
      .map((player, index) => ({
        id: player._id,
        rank: index + 1,
        name: player.name,
        pieces: player.pieces,
        calories: player.calories,
        isCurrentUser: player.clientId === args.clientId,
      }));

    const currentPlayer = players.find((player) => player.clientId === args.clientId) ?? null;
    const recentEvents = (
      await ctx.db
        .query("events")
        .withIndex("by_table", (q) => q.eq("tableId", table._id))
        .order("desc")
        .take(12)
    ).map((event) => ({
      id: event._id,
      playerName: event.playerName,
      delta: event.delta,
      resultingPieces: event.resultingPieces,
      createdAt: event.createdAt,
    }));

    const totalPieces = players.reduce((sum, player) => sum + player.pieces, 0);
    const totalCalories = players.reduce((sum, player) => sum + player.calories, 0);

    return {
      table: {
        id: table._id,
        name: table.name,
        code: table.code,
        caloriesPerPiece: table.caloriesPerPiece,
        status: table.status,
        createdAt: table.createdAt,
        updatedAt: table.updatedAt,
      },
      currentPlayer: currentPlayer
        ? {
            id: currentPlayer._id,
            name: currentPlayer.name,
            pieces: currentPlayer.pieces,
            calories: currentPlayer.calories,
          }
        : null,
      leaderboard,
      recentEvents,
      summary: {
        totalPlayers: players.length,
        totalPieces,
        totalCalories,
      },
    };
  },
});

export const getPersonalStats = query({
  args: {
    clientId: v.string(),
  },
  handler: async (ctx, args) => {
    const playerSessions = await ctx.db
      .query("players")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const sessions = await Promise.all(
      playerSessions.map(async (session) => {
        const table = await ctx.db.get(session.tableId);
        return {
          id: session._id,
          tableName: table?.name ?? "Unknown table",
          tableCode: table?.code ?? "??????",
          pieces: session.pieces,
          calories: session.calories,
          joinedAt: session.joinedAt,
          updatedAt: session.updatedAt,
        };
      }),
    );

    const sortedSessions = sessions.sort((a, b) => b.updatedAt - a.updatedAt);

    return {
      totalPieces: sortedSessions.reduce((sum, session) => sum + session.pieces, 0),
      totalCalories: sortedSessions.reduce((sum, session) => sum + session.calories, 0),
      totalSessions: sortedSessions.length,
      sessions: sortedSessions,
    };
  },
});
