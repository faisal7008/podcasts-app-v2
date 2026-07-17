import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/src/generated/prisma";
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
    const [profile, preferences] = await prisma.$transaction([
      prisma.userProfile.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          displayName: session.user.name,
          avatarUrl: session.user.image,
        },
        update: {},
      }),
      prisma.userPreferences.upsert({
        where: { userId: session.user.id },
        create: { userId: session.user.id },
        update: {},
      }),
    ]);

    return NextResponse.json({
      profile,
      preferences: {
        ...preferences,
        // Convert Decimal to number for JSON serialization
        playbackSpeed: preferences.playbackSpeed instanceof Prisma.Decimal
          ? (preferences.playbackSpeed as unknown as { toNumber(): number }).toNumber()
          : Number(preferences.playbackSpeed),
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
      results.profile = await prisma.userProfile.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          ...profileUpdates,
        },
        update: profileUpdates,
      });
    }

    if (prefsUpdates) {
      const updated = await prisma.userPreferences.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          ...prefsUpdates,
        },
        update: prefsUpdates,
      });

      results.preferences = {
        ...updated,
        // Convert Decimal to number for JSON serialization
        playbackSpeed: updated.playbackSpeed instanceof Prisma.Decimal
          ? (updated.playbackSpeed as unknown as { toNumber(): number }).toNumber()
          : Number(updated.playbackSpeed),
      };
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("[API] Profile PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
