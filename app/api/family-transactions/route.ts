import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { familyTransactions, familyMembers, familyCategories } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// Helper to verify family membership
async function verifyFamilyMembership(familyId: string, userId: string) {
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

// GET /api/family-transactions?familyId=xxx - Get all transactions for a family
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

    // Verify user is a family member
    const member = await verifyFamilyMembership(familyId, session.user.id);
    if (!member) {
      return NextResponse.json(
        { error: 'Access denied to this family' },
        { status: 403 }
      );
    }

    // Get all family transactions with category details
    const transactions = await db
      .select({
        id: familyTransactions.id,
        familyId: familyTransactions.familyId,
        userId: familyTransactions.userId,
        amount: familyTransactions.amount,
        description: familyTransactions.description,
        date: familyTransactions.date,
        categoryId: familyTransactions.categoryId,
        type: familyTransactions.type,
        notes: familyTransactions.notes,
        receiptImage: familyTransactions.receiptImage,
        createdAt: familyTransactions.createdAt,
        categoryName: familyCategories.name,
        categoryIcon: familyCategories.icon,
        categoryColor: familyCategories.color,
      })
      .from(familyTransactions)
      .leftJoin(
        familyCategories,
        eq(familyTransactions.categoryId, familyCategories.id)
      )
      .where(eq(familyTransactions.familyId, familyId))
      .orderBy(desc(familyTransactions.createdAt))
      .execute();

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Error fetching family transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch family transactions' },
      { status: 500 }
    );
  }
}

// POST /api/family-transactions - Create a new family transaction
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      familyId,
      amount,
      description,
      date,
      categoryId,
      type,
      notes,
      receiptImage,
    } = body;

    if (!familyId || !amount || !description || !date || !categoryId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify user is a family member
    const member = await verifyFamilyMembership(familyId, session.user.id);
    if (!member) {
      return NextResponse.json(
        { error: 'Access denied to this family' },
        { status: 403 }
      );
    }

    // Create transaction
    const [newTransaction] = await db
      .insert(familyTransactions)
      .values({
        familyId,
        userId: session.user.id,
        amount: amount.toString(),
        description: description.trim(),
        date,
        categoryId,
        type,
        notes: notes || null,
        receiptImage: receiptImage || null,
      })
      .returning()
      .execute();

    return NextResponse.json({ transaction: newTransaction }, { status: 201 });
  } catch (error) {
    console.error('Error creating family transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create family transaction' },
      { status: 500 }
    );
  }
}

// PATCH /api/family-transactions - Update a family transaction
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      familyId,
      amount,
      description,
      date,
      categoryId,
      type,
      notes,
      receiptImage,
    } = body;

    if (!id || !familyId) {
      return NextResponse.json(
        { error: 'Transaction ID and Family ID are required' },
        { status: 400 }
      );
    }

    // Verify user is a family member
    const member = await verifyFamilyMembership(familyId, session.user.id);
    if (!member) {
      return NextResponse.json(
        { error: 'Access denied to this family' },
        { status: 403 }
      );
    }

    // Get transaction to verify ownership or admin role
    const [transaction] = await db
      .select()
      .from(familyTransactions)
      .where(
        and(
          eq(familyTransactions.id, id),
          eq(familyTransactions.familyId, familyId)
        )
      )
      .limit(1)
      .execute();

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Only transaction creator or family admin can edit
    if (transaction.userId !== session.user.id && member.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You can only edit your own transactions' },
        { status: 403 }
      );
    }

    // Build update object
    const updates: any = {};
    if (amount !== undefined) updates.amount = amount.toString();
    if (description !== undefined) updates.description = description.trim();
    if (date !== undefined) updates.date = date;
    if (categoryId !== undefined) updates.categoryId = categoryId;
    if (type !== undefined) updates.type = type;
    if (notes !== undefined) updates.notes = notes;
    if (receiptImage !== undefined) updates.receiptImage = receiptImage;

    // Update transaction
    const [updatedTransaction] = await db
      .update(familyTransactions)
      .set(updates)
      .where(
        and(
          eq(familyTransactions.id, id),
          eq(familyTransactions.familyId, familyId)
        )
      )
      .returning()
      .execute();

    return NextResponse.json({ transaction: updatedTransaction });
  } catch (error) {
    console.error('Error updating family transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update family transaction' },
      { status: 500 }
    );
  }
}

// DELETE /api/family-transactions?id=xxx&familyId=xxx - Delete a family transaction
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
        { error: 'Transaction ID and Family ID are required' },
        { status: 400 }
      );
    }

    // Verify user is a family member
    const member = await verifyFamilyMembership(familyId, session.user.id);
    if (!member) {
      return NextResponse.json(
        { error: 'Access denied to this family' },
        { status: 403 }
      );
    }

    // Get transaction to verify ownership or admin role
    const [transaction] = await db
      .select()
      .from(familyTransactions)
      .where(
        and(
          eq(familyTransactions.id, id),
          eq(familyTransactions.familyId, familyId)
        )
      )
      .limit(1)
      .execute();

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Only transaction creator or family admin can delete
    if (transaction.userId !== session.user.id && member.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You can only delete your own transactions' },
        { status: 403 }
      );
    }

    // Delete transaction
    await db
      .delete(familyTransactions)
      .where(
        and(
          eq(familyTransactions.id, id),
          eq(familyTransactions.familyId, familyId)
        )
      )
      .execute();

    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting family transaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete family transaction' },
      { status: 500 }
    );
  }
}
