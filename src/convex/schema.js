import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  intakes: defineTable({
    userId: v.string(),
    clientId: v.string(),
    name: v.string(),
    amount: v.number(),
    category: v.string(),
    timestamp: v.string()
  })
    .index('by_user', ['userId'])
    .index('by_user_timestamp', ['userId', 'timestamp'])
    .index('by_user_clientId', ['userId', 'clientId']),
  settings: defineTable({
    userId: v.string(),
    metabolismRate: v.string(),
    caffeineLimit: v.number(),
    sleepTime: v.string(),
    targetSleepCaffeine: v.number(),
    pregnancyAdjustment: v.boolean(),
    smokerAdjustment: v.boolean(),
    oralContraceptivesAdjustment: v.boolean(),
    darkMode: v.boolean()
  }).index('by_user', ['userId'])
});
