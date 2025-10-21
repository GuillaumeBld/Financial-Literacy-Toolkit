import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { verifyIdentityToken } from "@/lib/auth/identity";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "lms-sso",
      name: "Learning Platform",
      credentials: {
        token: { label: "Identity Token", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.token) {
          return null;
        }

        const profile = await verifyIdentityToken(credentials.token);
        if (!profile) {
          return null;
        }

        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          accessToken: profile.accessToken
        } as any;
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 4 * 60 * 60
  },
  jwt: {
    maxAge: 4 * 60 * 60
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.accessToken = (user as any).accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string | undefined;
      }
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      return session;
    }
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production"
      }
    }
  },
  pages: {
    signIn: "/start"
  }
};
