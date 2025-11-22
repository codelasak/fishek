import { NextRequest, NextResponse } from 'next/server';
import { getDashboardStats } from '@/services/databaseService';
import { getAuthUser } from '@/lib/auth-helpers';

// GET /api/stats
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await getDashboardStats(user.id);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
