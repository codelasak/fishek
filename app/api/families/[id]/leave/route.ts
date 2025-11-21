import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { familyMembers } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';

// POST /api/families/[id]/leave - Leave a family
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: familyId } = await params;

    // Check if user is a member
    const [member] = await db
      .select()
      .from(familyMembers)
      .where(
        and(
          eq(familyMembers.familyId, familyId),
          eq(familyMembers.userId, session.user.id)
        )
      )
      .limit(1)
      .execute();

    if (!member) {
      return NextResponse.json(
        { error: 'You are not a member of this family' },
        { status: 404 }
      );
    }

    // If user is admin, check if there are other members
    if (member.role === 'ADMIN') {
      const [memberCount] = await db
        .select({ count: count() })
        .from(familyMembers)
        .where(eq(familyMembers.familyId, familyId))
        .execute();

      if (memberCount.count > 1) {
        // Check if there's another admin
        const [otherAdmins] = await db
          .select({ count: count() })
          .from(familyMembers)
          .where(
            and(
              eq(familyMembers.familyId, familyId),
              eq(familyMembers.role, 'ADMIN')
            )
          )
          .execute();

        if (otherAdmins.count === 1) {
          return NextResponse.json(
            {
              error:
                'You are the only admin. Please promote another member to admin before leaving, or delete the family.',
            },
            { status: 400 }
          );
        }
      }
    }

    // Remove user from family
    await db
      .delete(familyMembers)
      .where(
        and(
          eq(familyMembers.familyId, familyId),
          eq(familyMembers.userId, session.user.id)
        )
      )
      .execute();

    return NextResponse.json({ message: 'Successfully left the family' });
  } catch (error) {
    console.error('Error leaving family:', error);
    return NextResponse.json(
      { error: 'Failed to leave family' },
      { status: 500 }
    );
  }
}
