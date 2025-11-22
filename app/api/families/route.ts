import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helpers';
import { db } from '@/db';
import { families, familyMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateInviteCode } from '@/lib/inviteCode';

// GET /api/families - Get user's families
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all families where user is a member
    const userFamilies = await db
      .select({
        id: families.id,
        name: families.name,
        inviteCode: families.inviteCode,
        createdBy: families.createdBy,
        createdAt: families.createdAt,
        role: familyMembers.role,
        joinedAt: familyMembers.joinedAt,
      })
      .from(familyMembers)
      .innerJoin(families, eq(familyMembers.familyId, families.id))
      .where(eq(familyMembers.userId, user.id))
      .execute();

    return NextResponse.json({ families: userFamilies });
  } catch (error) {
    console.error('Error fetching families:', error);
    return NextResponse.json(
      { error: 'Failed to fetch families' },
      { status: 500 }
    );
  }
}

// POST /api/families - Create a new family
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Family name is required' },
        { status: 400 }
      );
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let codeExists = true;
    let attempts = 0;

    // Ensure invite code is unique (max 10 attempts)
    while (codeExists && attempts < 10) {
      const existing = await db
        .select()
        .from(families)
        .where(eq(families.inviteCode, inviteCode))
        .limit(1)
        .execute();

      if (existing.length === 0) {
        codeExists = false;
      } else {
        inviteCode = generateInviteCode();
        attempts++;
      }
    }

    if (codeExists) {
      return NextResponse.json(
        { error: 'Failed to generate unique invite code' },
        { status: 500 }
      );
    }

    // Create family
    const [newFamily] = await db
      .insert(families)
      .values({
        name: name.trim(),
        inviteCode,
        createdBy: user.id,
      })
      .returning()
      .execute();

    // Add creator as admin member
    await db
      .insert(familyMembers)
      .values({
        familyId: newFamily.id,
        userId: user.id,
        role: 'ADMIN',
      })
      .execute();

    return NextResponse.json({ family: newFamily }, { status: 201 });
  } catch (error) {
    console.error('Error creating family:', error);
    return NextResponse.json(
      { error: 'Failed to create family' },
      { status: 500 }
    );
  }
}
