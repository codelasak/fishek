import { NextRequest, NextResponse } from 'next/server';
import { getTransactions, saveTransaction } from '@/services/databaseService';
import { auth } from '@/auth';

// GET /api/transactions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transactions = await getTransactions(session.user.id);
    return NextResponse.json(transactions, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST /api/transactions
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const transaction = await request.json();
    await saveTransaction({ ...transaction, userId: session.user.id });
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error saving transaction:', error);
    return NextResponse.json(
      { error: 'Failed to save transaction' },
      { status: 500, headers: corsHeaders }
    );
  }
}
