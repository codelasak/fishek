import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { familyMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Helper to verify family admin access
async function verifyAdminAccess(familyId: string, userId: string) {
  const [member] = await db
    .select()
    .from(familyMembers)
    .where(
      and(eq(familyMembers.familyId, familyId), eq(familyMembers.userId, userId))
    )
    .limit(1)
    .execute();

  return member?.role === 'ADMIN' ? member : null;
}

// DELETE /api/families/[id]/members - Remove a member (admin only)
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
    const { searchParams } = new URL(request.url);
    const memberUserId = searchParams.get('userId');

    if (!memberUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify requester is admin
    const admin = await verifyAdminAccess(familyId, session.user.id);
    if (!admin) {
      return NextResponse.json(
        { error: 'Only family admins can remove members' },
        { status: 403 }
      );
    }

    // Prevent removing yourself
    if (memberUserId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot remove yourself from the family. Use leave instead.' },
        { status: 400 }
      );
    }

    // Remove member
    const deleted = await db
      .delete(familyMembers)
      .where(
        and(
          eq(familyMembers.familyId, familyId),
          eq(familyMembers.userId, memberUserId)
        )
      )
      .returning()
      .execute();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Member not found in this family' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing family member:', error);
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}

// PATCH /api/families/[id]/members - Update member role (admin only)
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
    const body = await request.json();
    const { userId: targetUserId, role } = body;

    if (!targetUserId || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      );
    }

    if (role !== 'ADMIN' && role !== 'MEMBER') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Verify requester is admin
    const admin = await verifyAdminAccess(familyId, session.user.id);
    if (!admin) {
      return NextResponse.json(
        { error: 'Only family admins can change member roles' },
        { status: 403 }
      );
    }

    // Update member role
    const [updatedMember] = await db
      .update(familyMembers)
      .set({ role })
      .where(
        and(
          eq(familyMembers.familyId, familyId),
          eq(familyMembers.userId, targetUserId)
        )
      )
      .returning()
      .execute();

    if (!updatedMember) {
      return NextResponse.json(
        { error: 'Member not found in this family' },
        { status: 404 }
      );
    }

    return NextResponse.json({ member: updatedMember });
  } catch (error) {
    console.error('Error updating member role:', error);
    return NextResponse.json(
      { error: 'Failed to update member role' },
      { status: 500 }
    );
  }
}
