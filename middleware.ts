import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const publicPaths = ['/login', '/register'];

export default auth((req) => {
  const isPublic = publicPaths.includes(req.nextUrl.pathname);
  const isLoggedIn = Boolean(req.auth);

  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  if (isLoggedIn && isPublic) {
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
