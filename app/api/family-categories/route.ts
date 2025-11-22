import { NextResponse, NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth-helpers';
import { db } from '@/db';
import { familyCategories, familyMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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

// GET /api/family-categories?familyId=xxx - Get all categories for a family
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user?.id) {
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
    const member = await verifyFamilyMembership(familyId, user.id);
    if (!member) {
      return NextResponse.json(
        { error: 'Access denied to this family' },
        { status: 403 }
      );
    }

    // Get all family categories
    const categories = await db
      .select()
      .from(familyCategories)
      .where(eq(familyCategories.familyId, familyId))
      .execute();

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching family categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch family categories' },
      { status: 500 }
    );
  }
}

// POST /api/family-categories - Create a new family category
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { familyId, name, icon, type, budgetLimit, color } = body;

    if (!familyId || !name || !icon || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify user is a family member
    const member = await verifyFamilyMembership(familyId, user.id);
    if (!member) {
      return NextResponse.json(
        { error: 'Access denied to this family' },
        { status: 403 }
      );
    }

    // Create category
    const [newCategory] = await db
      .insert(familyCategories)
      .values({
        familyId,
        name: name.trim(),
        icon,
        type,
        budgetLimit: budgetLimit || null,
        color: color || null,
      })
      .returning()
      .execute();

    return NextResponse.json({ category: newCategory }, { status: 201 });
  } catch (error) {
    console.error('Error creating family category:', error);
    return NextResponse.json(
      { error: 'Failed to create family category' },
      { status: 500 }
    );
  }
}

// PATCH /api/family-categories - Update a family category
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, familyId, name, icon, budgetLimit, color } = body;

    if (!id || !familyId) {
      return NextResponse.json(
        { error: 'Category ID and Family ID are required' },
        { status: 400 }
      );
    }

    // Verify user is a family member
    const member = await verifyFamilyMembership(familyId, user.id);
    if (!member) {
      return NextResponse.json(
        { error: 'Access denied to this family' },
        { status: 403 }
      );
    }

    // Build update object
    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (icon !== undefined) updates.icon = icon;
    if (budgetLimit !== undefined) updates.budgetLimit = budgetLimit;
    if (color !== undefined) updates.color = color;

    // Update category
    const [updatedCategory] = await db
      .update(familyCategories)
      .set(updates)
      .where(
        and(eq(familyCategories.id, id), eq(familyCategories.familyId, familyId))
      )
      .returning()
      .execute();

    if (!updatedCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ category: updatedCategory });
  } catch (error) {
    console.error('Error updating family category:', error);
    return NextResponse.json(
      { error: 'Failed to update family category' },
      { status: 500 }
    );
  }
}

// DELETE /api/family-categories?id=xxx&familyId=xxx - Delete a family category
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const familyId = searchParams.get('familyId');

    if (!id || !familyId) {
      return NextResponse.json(
        { error: 'Category ID and Family ID are required' },
        { status: 400 }
      );
    }

    // Verify user is a family member (admin check could be added here)
    const member = await verifyFamilyMembership(familyId, user.id);
    if (!member) {
      return NextResponse.json(
        { error: 'Access denied to this family' },
        { status: 403 }
      );
    }

    // Delete category
    const deleted = await db
      .delete(familyCategories)
      .where(
        and(eq(familyCategories.id, id), eq(familyCategories.familyId, familyId))
      )
      .returning()
      .execute();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting family category:', error);
    return NextResponse.json(
      { error: 'Failed to delete family category' },
      { status: 500 }
    );
  }
}
