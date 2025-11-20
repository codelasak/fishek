import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const publicPaths = ['/login', '/register'];

export async function middleware(req: Request) {
  const request = req as any;
  const url = request.nextUrl;
  const isPublic = publicPaths.includes(url.pathname);

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/login', url));
  }

  if (token && isPublic) {
    return NextResponse.redirect(new URL('/', url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
