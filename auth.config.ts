import type { NextAuthConfig } from 'next-auth';

// Edge-compatible config (no Node.js crypto)
// Full providers are in auth.ts for API routes only
const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  providers: [], // Providers added in auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const publicPaths = ['/login', '/register'];
      const isPublic = publicPaths.includes(nextUrl.pathname);

      if (!isLoggedIn && !isPublic) {
        return false; // Redirect to signIn page
      }
      return true;
    },
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
