/**
 * Mobile Authentication Endpoint
 * 
 * Returns JWT token for mobile apps
 * POST /api/auth/mobile
 */

import { NextResponse, NextRequest } from 'next/server';
import { signJWT } from '@/lib/jwt';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '@/lib/password';

const allowedOrigins = [
  'capacitor://localhost',
  'http://localhost',
  'https://fishek.coolify.fennaver.tech',
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
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

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name || user.email,
        },
        accessToken: token,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Mobile auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500, headers: corsHeaders }
    );
  }
}
