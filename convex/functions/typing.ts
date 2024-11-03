import { v } from "convex/values";
import { authenticatedMutation, authenticatedQuery } from "./helpers";

export const upsert = authenticatedMutation({
  args: {
    directMessage: v.id("directMessages"),
  },
  handler: async (ctx, { directMessage }) => {
    // check if dm already exists
    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_user_direct_message", (q) =>
        q.eq("user", ctx.user._id).eq("directMessage", directMessage)
      )
      .unique();
    const expiresAt = Date.now() + 1000 * 5;
    // update it if it exists
    if (existing) {
      await ctx.db.patch(existing._id, {
        user: ctx.user._id,
        directMessage,
        expiresAt,
      });
      // create it if it doesn't exist
    } else {
      await ctx.db.insert("typingIndicators", {
        user: ctx.user._id,
        directMessage,
        expiresAt,
      });
    }
  },
});

export const list = authenticatedQuery({
  args: {
    directMessage: v.id("directMessages"),
  },
  handler: async (ctx, { directMessage }) => {
    const now = Date.now();
    const typingIndicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_direct_message", (q) =>
        q.eq("directMessage", directMessage)
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
    directMessage: v.id("directMessages"),
  },
  handler: async (ctx, { directMessage }) => {
    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_user_direct_message", (q) =>
        q.eq("user", ctx.user._id).eq("directMessage", directMessage)
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
