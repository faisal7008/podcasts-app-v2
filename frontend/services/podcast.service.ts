import { db } from "@/lib/db";
import { podcast } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export class PodcastService {
  /**
   * Check if a user owns a specific podcast
   * @returns The podcast record if owned, otherwise undefined
   */
  static async verifyOwnership(podcastId: string, userId: string) {
    return await db.query.podcast.findFirst({
      where: and(
        eq(podcast.id, podcastId),
        eq(podcast.userId, userId)
      ),
    });
  }
}
