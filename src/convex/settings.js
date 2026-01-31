import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

const requireUserId = async (ctx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error('Not authenticated');
  }
  return identity.subject;
};

export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const settings = await ctx.db
      .query('settings')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .first();

    if (!settings) return null;

    const { userId, _id, _creationTime, ...rest } = settings;
    return rest;
  }
});

export const save = mutation({
  args: {
    metabolismRate: v.string(),
    caffeineLimit: v.number(),
    sleepTime: v.string(),
    targetSleepCaffeine: v.number(),
    pregnancyAdjustment: v.boolean(),
    smokerAdjustment: v.boolean(),
    oralContraceptivesAdjustment: v.boolean(),
    darkMode: v.boolean()
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    const existing = await ctx.db
      .query('settings')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return ctx.db.insert('settings', {
      userId,
      ...args
    });
  }
});
