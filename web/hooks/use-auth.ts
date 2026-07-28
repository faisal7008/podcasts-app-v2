"use client";

import { useSession } from "@/lib/auth-client";

/**
 * Convenience hook wrapping better-auth's useSession into a simpler shape.
 * Returns the user object, loading state, login status, and any errors.
 */
export function useAuth() {
  const session = useSession();

  return {
    user: session.data?.user ?? null,
    session: session.data?.session ?? null,
    isLoggedIn: !!session.data?.user,
    isLoading: session.isPending,
    error: session.error,
  };
}
