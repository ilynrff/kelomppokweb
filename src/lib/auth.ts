import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

function normalizeWhatsApp(whatsapp: string) {
  let cleaned = whatsapp.replace(/\D/g, ""); // remove all non-digits
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.substring(1);
  } else if (!cleaned.startsWith("62")) {
    cleaned = "62" + cleaned;
  }
  return "+" + cleaned;
}

import { validateMembershipStatus } from "./membershipService";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        whatsapp: { label: "WhatsApp", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.whatsapp || !credentials?.password) {
          throw new Error("Nomor WhatsApp dan password wajib diisi");
        }

        const normalizedWA = normalizeWhatsApp(credentials.whatsapp);
        console.log("DEBUG: Login attempt for:", normalizedWA);

        let user = null;
        try {
          user = await prisma.user.findFirst({
            where: { whatsapp: normalizedWA }
          });
        } catch (dbError) {
          console.error("DEBUG: Database error during login:", dbError);
          return null;
        }

        console.log("DEBUG: User found:", !!user);
        if (user) {
          console.log(`DEBUG: Hash from DB starts with: ${user.password.substring(0, 10)}...`);
        }

        if (!user) {
          console.log("DEBUG: User not found in database.");
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        console.log("DEBUG: Password valid:", isValid);

        if (!isValid) {
          console.log("DEBUG: Password mismatch.");
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.whatsapp,
          whatsapp: user.whatsapp,
          role: user.role,
          membership: user.membership,
          membershipStatus: user.membershipStatus,
          membershipExpiresAt: user.membershipExpiresAt
        } as any;
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = (user as any).id;
        token.whatsapp = (user as any).whatsapp;
        token.role = (user as any).role || "USER";
        token.membership = (user as any).membership || "BASIC";
        token.membershipStatus = (user as any).membershipStatus || "FREE";
        token.membershipExpiresAt = (user as any).membershipExpiresAt;
        token.name = user.name;
      }

      // Handle session update trigger
      if (trigger === "update") {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { name: true, membership: true, membershipStatus: true, membershipExpiresAt: true }
          });
          if (dbUser) {
            token.name = dbUser.name;
            token.membership = dbUser.membership;
            token.membershipStatus = dbUser.membershipStatus;
            token.membershipExpiresAt = dbUser.membershipExpiresAt;
          }
        } catch (dbError) {
          console.error("DEBUG: Failed to fetch fresh user data for session update:", dbError);
        }

        // Support fallback manual session update overrides if passed
        if (session) {
          if (session.name) token.name = session.name;
          if (session.membership) token.membership = session.membership;
          if (session.membershipStatus) token.membershipStatus = session.membershipStatus;
          if (session.membershipExpiresAt) token.membershipExpiresAt = session.membershipExpiresAt;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        const freshUser = await validateMembershipStatus(token.id as string);
        if (freshUser) {
          (session.user as any).id = freshUser.id;
          (session.user as any).whatsapp = freshUser.whatsapp;
          (session.user as any).role = freshUser.role;
          (session.user as any).membership = freshUser.membership;
          (session.user as any).membershipStatus = freshUser.membershipStatus;
          (session.user as any).membershipExpiresAt = freshUser.membershipExpiresAt;
          session.user.name = freshUser.name;
        } else {
          (session.user as any).id = token.id as string;
          (session.user as any).whatsapp = token.whatsapp as string;
          (session.user as any).role = token.role as string;
          (session.user as any).membership = token.membership as string;
          (session.user as any).membershipStatus = token.membershipStatus as string;
          (session.user as any).membershipExpiresAt = token.membershipExpiresAt;
          session.user.name = token.name as string;
        }
      }
      return session;
    }
  },
  pages: {
    signIn: "/login"
  }
};
