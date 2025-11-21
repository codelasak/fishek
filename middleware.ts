import NextAuth from 'next-auth';
import authConfig from './auth.config';

// Use edge-compatible config (no Node.js crypto)
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
