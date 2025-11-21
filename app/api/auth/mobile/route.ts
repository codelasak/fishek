/**
 * Mobile Authentication Endpoint
 * 
 * Returns JWT token for mobile apps
 * POST /api/auth/mobile
 */

import { NextResponse } from 'next/server';
import { signJWT } from '@/lib/jwt';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '@/lib/password';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = await signJWT({
      id: user.id,
      email: user.email,
      name: user.name || user.email,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.email,
      },
      accessToken: token,
    });
  } catch (error) {
    console.error('Mobile auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
