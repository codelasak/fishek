import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { spendingLimits, familyMembers, budgetAlerts } from '@/db/schema';
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

// GET /api/spending-limits?familyId=xxx - Get spending limits for a family
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('familyId');

    if (!familyId) {
      return NextResponse.json(
        { error: 'Family ID is required' },
        { status: 400 }
      );
    }

    // Verify user is admin
    const admin = await verifyAdminAccess(familyId, session.user.id);
    if (!admin) {
      return NextResponse.json(
        { error: 'Only family admins can view spending limits' },
        { status: 403 }
      );
    }

    // Get all spending limits
    const limits = await db
      .select()
      .from(spendingLimits)
      .where(eq(spendingLimits.familyId, familyId))
      .execute();

    return NextResponse.json({ limits });
  } catch (error) {
    console.error('Error fetching spending limits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spending limits' },
      { status: 500 }
    );
  }
}

// POST /api/spending-limits - Create spending limit
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { familyId, categoryId, userId, limitAmount, period, alertThreshold } =
      body;

    if (!familyId || !limitAmount) {
      return NextResponse.json(
        { error: 'Family ID and limit amount are required' },
        { status: 400 }
      );
    }

    // Verify user is admin
    const admin = await verifyAdminAccess(familyId, session.user.id);
    if (!admin) {
      return NextResponse.json(
        { error: 'Only family admins can set spending limits' },
        { status: 403 }
      );
    }

    // Create spending limit
    const [newLimit] = await db
      .insert(spendingLimits)
      .values({
        familyId,
        categoryId: categoryId || null,
        userId: userId || null,
        limitAmount: limitAmount.toString(),
        period: period || 'MONTHLY',
        alertThreshold: alertThreshold || 80,
      })
      .returning()
      .execute();

    return NextResponse.json({ limit: newLimit }, { status: 201 });
  } catch (error) {
    console.error('Error creating spending limit:', error);
    return NextResponse.json(
      { error: 'Failed to create spending limit' },
      { status: 500 }
    );
  }
}

// DELETE /api/spending-limits?id=xxx&familyId=xxx - Delete spending limit
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const familyId = searchParams.get('familyId');

    if (!id || !familyId) {
      return NextResponse.json(
        { error: 'Spending limit ID and Family ID are required' },
        { status: 400 }
      );
    }

    // Verify user is admin
    const admin = await verifyAdminAccess(familyId, session.user.id);
    if (!admin) {
      return NextResponse.json(
        { error: 'Only family admins can delete spending limits' },
        { status: 403 }
      );
    }

    // Delete spending limit
    await db
      .delete(spendingLimits)
      .where(
        and(eq(spendingLimits.id, id), eq(spendingLimits.familyId, familyId))
      )
      .execute();

    return NextResponse.json({ message: 'Spending limit deleted successfully' });
  } catch (error) {
    console.error('Error deleting spending limit:', error);
    return NextResponse.json(
      { error: 'Failed to delete spending limit' },
      { status: 500 }
    );
  }
}
