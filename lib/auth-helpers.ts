/**
 * Authentication Helpers
 * 
 * Unified authentication for both web (NextAuth session) and mobile (JWT token)
 */

import { auth } from '@/auth';
import { verifyJWT } from './jwt';
import { NextRequest } from 'next/server';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

/**
 * Get authenticated user from either NextAuth session or JWT Bearer token
 * Supports both web (session cookies) and mobile (Authorization header)
 */
export async function getAuthUser(request?: NextRequest): Promise<AuthUser | null> {
  // First, try NextAuth session (web)
  const session = await auth();
  if (session?.user) {
    return {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.name || '',
    };
  }

  // If no session, try JWT token from Authorization header (mobile)
  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      const payload = await verifyJWT(token);
      if (payload) {
        return {
          id: payload.id,
          email: payload.email,
          name: payload.name,
        };
      }
    }
  }

  return null;
}
