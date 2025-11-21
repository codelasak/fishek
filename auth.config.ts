import { DrizzleAdapter } from '@auth/drizzle-adapter';
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { users } from '@/db/schema';
import { verifyPassword } from '@/lib/password';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

if (!authSecret) {
  throw new Error('AUTH_SECRET or NEXTAUTH_SECRET must be defined for authentication to work.');
}

const authConfig: NextAuthConfig = {
  adapter: DrizzleAdapter(db),
  secret: authSecret,
  session: {
    strategy: 'jwt',
  },
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'Email ve Şifre',
      credentials: {
        email: { label: 'E-posta', type: 'email' },
        password: { label: 'Şifre', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const parsed = credentialsSchema.safeParse(credentials);
          if (!parsed.success) {
            console.log('[Auth] Validation failed:', parsed.error);
            return null;
          }

          const email = parsed.data.email.toLowerCase();
          console.log('[Auth] Looking up user:', email);

          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (!user) {
            console.log('[Auth] User not found');
            return null;
          }

          if (!user.password) {
            console.log('[Auth] User has no password');
            return null;
          }

          console.log('[Auth] Verifying password...');
          const isValid = await verifyPassword(parsed.data.password, user.password);

          if (!isValid) {
            console.log('[Auth] Invalid password');
            return null;
          }

          console.log('[Auth] Login successful for:', email);
          return {
            id: user.id,
            name: user.name,
            email: user.email,
          };
        } catch (error) {
          console.error('[Auth] Error during authorization:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

export default authConfig;
