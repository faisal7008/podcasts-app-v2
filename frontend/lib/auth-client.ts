import { createAuthClient } from "better-auth/react";

/**
 * Client-side Better Auth instance.
 * Used in React components for sign-in, sign-up, session management, etc.
 */
export const authClient = createAuthClient();

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;
