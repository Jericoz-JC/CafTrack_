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
    timestamp: v.string()
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
      ...args
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
        timestamp: v.string()
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
        ...intake
      });
    }
  }
});
