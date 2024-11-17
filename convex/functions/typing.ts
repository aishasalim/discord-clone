import { v } from "convex/values";
import {
  authenticatedMutation,
  authenticatedQuery,
  assertChannelMember,
} from "./helpers";

export const upsert = authenticatedMutation({
  args: {
    dmOrChannelId: v.union(v.id("channels"), v.id("directMessages")),
  },
  handler: async (ctx, { dmOrChannelId }) => {
    await assertChannelMember(ctx, dmOrChannelId);
    // check if dm already exists
    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_user_dmOrChannelId", (q) =>
        q.eq("user", ctx.user._id).eq("dmOrChannelId", dmOrChannelId)
      )
      .unique();
    const expiresAt = Date.now() + 1000 * 5;
    // update it if it exists
    if (existing) {
      await ctx.db.patch(existing._id, {
        user: ctx.user._id,
        dmOrChannelId,
        expiresAt,
      });
      // create it if it doesn't exist
    } else {
      await ctx.db.insert("typingIndicators", {
        user: ctx.user._id,
        dmOrChannelId,
        expiresAt,
      });
    }
  },
});

export const list = authenticatedQuery({
  args: {
    dmOrChannelId: v.union(v.id("channels"), v.id("directMessages")),
  },
  handler: async (ctx, { dmOrChannelId }) => {
    await assertChannelMember(ctx, dmOrChannelId);

    const now = Date.now();
    const typingIndicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_dmOrChannelId", (q) =>
        q.eq("dmOrChannelId", dmOrChannelId)
      )
      .filter((q) =>
        q.and(
          q.neq(q.field("user"), ctx.user._id),
          q.gt(q.field("expiresAt"), now)
        )
      )
      .collect();

    return await Promise.all(
      typingIndicators.map(async (indicator) => {
        const user = await ctx.db.get(indicator.user);
        if (!user) {
          throw new Error("User does not exist.");
        }
        return user.username;
      })
    );
  },
});

export const remove = authenticatedMutation({
  args: {
    dmOrChannelId: v.union(v.id("channels"), v.id("directMessages")),
  },
  handler: async (ctx, { dmOrChannelId }) => {
    await assertChannelMember(ctx, dmOrChannelId);

    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_user_dmOrChannelId", (q) =>
        q.eq("user", ctx.user._id).eq("dmOrChannelId", dmOrChannelId)
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
