// Type augmentation for next-auth
// This extends the default session and JWT types with custom fields

import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Extends the built-in session.user type
   */
  interface Session {
    user: {
      email: string;
      name: string;
      image: string;
    } & DefaultSession["user"];
    // Token expiry timestamp (useful for client-side checks)
    expiresAt?: number;
  }
}

declare module "next-auth/jwt" {
  /**
   * Extends the built-in JWT type with OAuth tokens and user profile
   */
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    email?: string;
    name?: string;
    picture?: string;
  }
}
