import { db } from "@/lib/db";
import { follow, like } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";

export class SocialService {
  // Follows
  static async getFollow(userId: string, podcastId: string) {
    return await db.query.follow.findFirst({
      where: and(eq(follow.userId, userId), eq(follow.podcastId, podcastId)),
    });
  }

  static async getFollowsByUser(userId: string) {
    return await db.query.follow.findMany({
      where: eq(follow.userId, userId),
    });
  }

  static async addFollow(userId: string, podcastId: string) {
    const existing = await this.getFollow(userId, podcastId);
    if (existing) return existing;
    const [newFollow] = await db.insert(follow).values({ userId, podcastId }).returning();
    return newFollow;
  }

  static async removeFollow(userId: string, podcastId: string) {
    await db.delete(follow).where(
      and(eq(follow.userId, userId), eq(follow.podcastId, podcastId))
    );
  }

  // Likes
  static async getLike(userId: string, episodeId: string) {
    return await db.query.like.findFirst({
      where: and(eq(like.userId, userId), eq(like.episodeId, episodeId)),
    });
  }

  static async getLikesByUser(userId: string) {
    return await db.query.like.findMany({
      where: eq(like.userId, userId),
      orderBy: [desc(like.createdAt)],
    });
  }

  static async addLike(userId: string, episodeId: string) {
    const existing = await this.getLike(userId, episodeId);
    if (existing) return existing;
    const [newLike] = await db.insert(like).values({ userId, episodeId }).returning();
    return newLike;
  }

  static async removeLike(userId: string, episodeId: string) {
    await db.delete(like).where(
      and(eq(like.userId, userId), eq(like.episodeId, episodeId))
    );
  }
}
