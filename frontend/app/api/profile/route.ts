import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userProfile, userPreferences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

/**
 * GET /api/profile — Fetch user profile and preferences.
 * PATCH /api/profile — Update profile or preferences.
 * Creates profile + preferences on first access via $transaction.
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure profile and preferences exist (first-time access)
    // Drizzle upsert
    const [profile] = await db.insert(userProfile).values({
      userId: session.user.id,
      displayName: session.user.name,
      avatarUrl: session.user.image,
    }).onConflictDoUpdate({
      target: userProfile.userId,
      set: { updatedAt: new Date() } // dummy update to return the row
    }).returning();

    const [preferences] = await db.insert(userPreferences).values({
      userId: session.user.id,
    }).onConflictDoUpdate({
      target: userPreferences.userId,
      set: { userId: session.user.id }
    }).returning();

    return NextResponse.json({
      profile,
      preferences: {
        ...preferences,
        playbackSpeed: Number(preferences.playbackSpeed),
      },
    });
  } catch (error) {
    console.error("[API] Profile GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { profile: profileUpdates, preferences: prefsUpdates } = body;

    const results: Record<string, unknown> = {};

    if (profileUpdates) {
      const [updatedProfile] = await db.insert(userProfile).values({
        userId: session.user.id,
        ...profileUpdates,
      }).onConflictDoUpdate({
        target: userProfile.userId,
        set: profileUpdates,
      }).returning();
      results.profile = updatedProfile;
    }

    if (prefsUpdates) {
      // Ensure playbackSpeed is correctly parsed if it's passed
      if (prefsUpdates.playbackSpeed) {
        prefsUpdates.playbackSpeed = prefsUpdates.playbackSpeed.toString();
      }

      const [updatedPrefs] = await db.insert(userPreferences).values({
        userId: session.user.id,
        ...prefsUpdates,
      }).onConflictDoUpdate({
        target: userPreferences.userId,
        set: prefsUpdates,
      }).returning();

      results.preferences = {
        ...updatedPrefs,
        playbackSpeed: Number(updatedPrefs.playbackSpeed),
      };
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("[API] Profile PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
