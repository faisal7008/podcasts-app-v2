import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { playHistory, like, follow, userPreferences, userProfile } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

/**
 * DELETE /api/account — Delete user account.
 * Requires password confirmation.
 * Uses $transaction to delete all related data atomically.
 *
 * IMPORTANT: Never log the password value.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { password } = await request.json();
    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // Verify password by attempting to sign in
    // better-auth handles password verification internally
    // We use the changePassword or verify endpoint approach
    // For now, we verify via the sign-in flow check
    try {
      const verified = await auth.api.verifyPassword({
        body: {
          password,
        },
        headers: await headers(),
      });

      if (!verified) {
        return NextResponse.json(
          { error: "Invalid password" },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    // Delete all user data atomically in a transaction
    await db.transaction(async (tx) => {
      await tx.delete(playHistory).where(eq(playHistory.userId, userId));
      await tx.delete(like).where(eq(like.userId, userId));
      await tx.delete(follow).where(eq(follow.userId, userId));
      await tx.delete(userPreferences).where(eq(userPreferences.userId, userId));
      await tx.delete(userProfile).where(eq(userProfile.userId, userId));
    });

    // Delete the user account via better-auth
    await auth.api.deleteUser({
      headers: await headers(),
      body: {
        password,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Account deletion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
