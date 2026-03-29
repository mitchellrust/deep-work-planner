import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, accounts } from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
  }),
  
  providers: [
    Google({
      // Request offline access and force consent prompt to ensure we always get refresh tokens
      // This is critical for future Google Calendar API integration
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  
  // Use JWT strategy - adapter stores users/accounts but sessions stay in JWT
  session: {
    strategy: "jwt",
  },

  callbacks: {
    // Store OAuth tokens and user ID in the JWT when user signs in
    async jwt({ token, account, profile, user }) {
      // Initial sign in - persist access token, refresh token, expiry, and user ID
      if (account && profile) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.email = profile.email ?? undefined;
        token.name = profile.name ?? undefined;
        token.picture = profile.picture ?? undefined;
      }
      
      // Store user ID from the database (available on initial sign-in)
      if (user) {
        token.userId = user.id;
      }
      
      return token;
    },

    // Expose user info, user ID, and token metadata to the client session
    async session({ session, token }: { session: Session; token: JWT }) {
      // Add custom fields to session
      if (token) {
        session.user.id = token.userId as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
        // Store when the access token expires (useful for client-side checks)
        session.expiresAt = token.expiresAt as number;
      }
      
      return session;
    },
  },

  pages: {
    // Use default Auth.js sign-in page for now
    // Can customize later by creating app/auth/signin/page.tsx
    // signIn: '/auth/signin',
  },
});
