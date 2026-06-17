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
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.membership) token.membership = session.membership;
        if (session.membershipStatus) token.membershipStatus = session.membershipStatus;
        if (session.membershipExpiresAt) token.membershipExpiresAt = session.membershipExpiresAt;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).whatsapp = token.whatsapp as string;
        (session.user as any).role = token.role as string;
        (session.user as any).membership = token.membership as string;
        (session.user as any).membershipStatus = token.membershipStatus as string;
        (session.user as any).membershipExpiresAt = token.membershipExpiresAt;
        session.user.name = token.name as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login"
  }
};
