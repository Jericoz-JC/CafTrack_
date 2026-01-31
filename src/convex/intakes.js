import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

const requireUserId = async (ctx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error('Not authenticated');
  }
  return identity.subject;
};

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return ctx.db
      .query('intakes')
      .withIndex('by_user_timestamp', (q) => q.eq('userId', identity.subject))
      .order('desc')
      .collect();
  }
});

export const listLatest = query({
  args: {
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const limit = Number.isFinite(args.limit) ? args.limit : 10;

    return ctx.db
      .query('intakes')
      .withIndex('by_user_timestamp', (q) => q.eq('userId', identity.subject))
      .order('desc')
      .take(limit);
  }
});

export const add = mutation({
  args: {
    clientId: v.string(),
    name: v.string(),
    amount: v.number(),
    category: v.string(),
    timestamp: v.string(),
    updatedAt: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    const existing = await ctx.db
      .query('intakes')
      .withIndex('by_user_clientId', (q) =>
        q.eq('userId', userId).eq('clientId', args.clientId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    return ctx.db.insert('intakes', {
      userId,
      ...args,
      updatedAt: Number.isFinite(args.updatedAt)
        ? args.updatedAt
        : Date.now()
    });
  }
});

export const remove = mutation({
  args: {
    id: v.id('intakes')
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const intake = await ctx.db.get(args.id);

    if (!intake) {
      return;
    }

    if (intake.userId !== userId) {
      throw new Error('Not authorized');
    }

    await ctx.db.delete(args.id);
  }
});

export const importFromLocal = mutation({
  args: {
    intakes: v.array(
      v.object({
        clientId: v.string(),
        name: v.string(),
        amount: v.number(),
        category: v.string(),
        timestamp: v.string(),
        updatedAt: v.optional(v.number())
      })
    )
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    for (const intake of args.intakes) {
      const existing = await ctx.db
        .query('intakes')
        .withIndex('by_user_clientId', (q) =>
          q.eq('userId', userId).eq('clientId', intake.clientId)
        )
        .first();

      if (existing) {
        continue;
      }

      await ctx.db.insert('intakes', {
        userId,
        ...intake,
        updatedAt: Number.isFinite(intake.updatedAt)
          ? intake.updatedAt
          : new Date(intake.timestamp).getTime()
      });
    }
  }
});

export const upsertIntake = mutation({
  args: {
    clientId: v.string(),
    name: v.string(),
    amount: v.number(),
    category: v.string(),
    timestamp: v.string(),
    updatedAt: v.number()
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    const existing = await ctx.db
      .query('intakes')
      .withIndex('by_user_clientId', (q) =>
        q.eq('userId', userId).eq('clientId', args.clientId)
      )
      .first();

    if (!existing) {
      return ctx.db.insert('intakes', {
        userId,
        ...args
      });
    }

    const existingUpdatedAt = Number.isFinite(existing.updatedAt)
      ? existing.updatedAt
      : new Date(existing.timestamp).getTime();

    if (args.updatedAt > existingUpdatedAt) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        amount: args.amount,
        category: args.category,
        timestamp: args.timestamp,
        updatedAt: args.updatedAt
      });
    }

    return existing._id;
  }
});

export const mergeFromLocal = mutation({
  args: {
    intakes: v.array(
      v.object({
        clientId: v.string(),
        name: v.string(),
        amount: v.number(),
        category: v.string(),
        timestamp: v.string(),
        updatedAt: v.number()
      })
    )
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    for (const intake of args.intakes) {
      const existing = await ctx.db
        .query('intakes')
        .withIndex('by_user_clientId', (q) =>
          q.eq('userId', userId).eq('clientId', intake.clientId)
        )
        .first();

      if (!existing) {
        await ctx.db.insert('intakes', {
          userId,
          ...intake
        });
        continue;
      }

      const existingUpdatedAt = Number.isFinite(existing.updatedAt)
        ? existing.updatedAt
        : new Date(existing.timestamp).getTime();

      if (intake.updatedAt > existingUpdatedAt) {
        await ctx.db.patch(existing._id, {
          name: intake.name,
          amount: intake.amount,
          category: intake.category,
          timestamp: intake.timestamp,
          updatedAt: intake.updatedAt
        });
      }
    }
  }
});
