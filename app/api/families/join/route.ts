import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { families, familyMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { isValidInviteCode } from '@/lib/inviteCode';

// POST /api/families/join - Join a family using invite code
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { inviteCode } = body;

    if (!inviteCode || !isValidInviteCode(inviteCode)) {
      return NextResponse.json(
        { error: 'Invalid invite code format' },
        { status: 400 }
      );
    }

    // Find family by invite code
    const [family] = await db
      .select()
      .from(families)
      .where(eq(families.inviteCode, inviteCode.toUpperCase()))
      .limit(1)
      .execute();

    if (!family) {
      return NextResponse.json(
        { error: 'Family not found with this invite code' },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const [existingMember] = await db
      .select()
      .from(familyMembers)
      .where(
        and(
          eq(familyMembers.familyId, family.id),
          eq(familyMembers.userId, session.user.id)
        )
      )
      .limit(1)
      .execute();

    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this family' },
        { status: 400 }
      );
    }

    // Add user as member
    const [newMember] = await db
      .insert(familyMembers)
      .values({
        familyId: family.id,
        userId: session.user.id,
        role: 'MEMBER',
      })
      .returning()
      .execute();

    return NextResponse.json({
      message: 'Successfully joined family',
      family,
      member: newMember,
    });
  } catch (error) {
    console.error('Error joining family:', error);
    return NextResponse.json(
      { error: 'Failed to join family' },
      { status: 500 }
    );
  }
}
