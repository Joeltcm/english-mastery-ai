import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { db } from "@/lib/prisma";
import { consumePersistentRateLimit } from "@/lib/rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Railway terminates TLS at its proxy and forwards the request internally.
  // Explicitly trusting the forwarded host prevents Auth.js from treating the
  // internal localhost:8080 URL as an untrusted production host.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  providers: [Credentials({
    credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
    async authorize(credentials) {
      const email = typeof credentials?.email === "string" ? credentials.email.toLowerCase().trim() : "";
      const password = typeof credentials?.password === "string" ? credentials.password : "";
      if (!email || !password || !process.env.DATABASE_URL) return null;
      const rate = await consumePersistentRateLimit(`login:${email}`, 10, 15 * 60_000);
      if (!rate.allowed) return null;
      const user = await db.user.findUnique({ where: { email } });
      if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) return null;
      return { id: user.id, email: user.email, name: user.name };
    },
  })],
  callbacks: {
    async jwt({ token }) {
      if (token.sub && process.env.DATABASE_URL) {
        const user = await db.user.findUnique({ where: { id: token.sub }, select: { id: true } });
        if (!user) return {};
      }
      return token;
    },
    async session({ session, token }) { if (session.user && token.sub) session.user.id = token.sub; return session; },
  },
});
