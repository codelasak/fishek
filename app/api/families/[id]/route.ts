import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { families, familyMembers, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Helper to verify family membership and get role
async function verifyFamilyAccess(familyId: string, userId: string) {
  const [member] = await db
    .select()
    .from(familyMembers)
    .where(
      and(eq(familyMembers.familyId, familyId), eq(familyMembers.userId, userId))
    )
    .limit(1)
    .execute();

  return member;
}

// GET /api/families/[id] - Get family details with members
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: familyId } = await params;

    // Verify user is a member
    const member = await verifyFamilyAccess(familyId, session.user.id);
    if (!member) {
      return NextResponse.json(
        { error: 'Access denied to this family' },
        { status: 403 }
      );
    }

    // Get family details
    const [family] = await db
      .select()
      .from(families)
      .where(eq(families.id, familyId))
      .limit(1)
      .execute();

    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    // Get all family members with user details
    const members = await db
      .select({
        id: familyMembers.id,
        userId: familyMembers.userId,
        role: familyMembers.role,
        joinedAt: familyMembers.joinedAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(familyMembers)
      .innerJoin(users, eq(familyMembers.userId, users.id))
      .where(eq(familyMembers.familyId, familyId))
      .execute();

    return NextResponse.json({
      family,
      members,
      currentUserRole: member.role,
    });
  } catch (error) {
    console.error('Error fetching family details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch family details' },
      { status: 500 }
    );
  }
}

// PATCH /api/families/[id] - Update family name (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: familyId } = await params;

    // Verify user is admin
    const member = await verifyFamilyAccess(familyId, session.user.id);
    if (!member || member.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only family admins can update family details' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Family name is required' },
        { status: 400 }
      );
    }

    // Update family
    const [updatedFamily] = await db
      .update(families)
      .set({ name: name.trim() })
      .where(eq(families.id, familyId))
      .returning()
      .execute();

    return NextResponse.json({ family: updatedFamily });
  } catch (error) {
    console.error('Error updating family:', error);
    return NextResponse.json(
      { error: 'Failed to update family' },
      { status: 500 }
    );
  }
}

// DELETE /api/families/[id] - Delete family (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: familyId } = await params;

    // Verify user is admin
    const member = await verifyFamilyAccess(familyId, session.user.id);
    if (!member || member.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only family admins can delete the family' },
        { status: 403 }
      );
    }

    // Delete family (cascade will handle members, transactions, etc.)
    await db.delete(families).where(eq(families.id, familyId)).execute();

    return NextResponse.json({ message: 'Family deleted successfully' });
  } catch (error) {
    console.error('Error deleting family:', error);
    return NextResponse.json(
      { error: 'Failed to delete family' },
      { status: 500 }
    );
  }
}
