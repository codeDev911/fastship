import { NextRequest, NextResponse } from 'next/server';
import { reconciliationService } from '@/lib/services/financial.engine';

// Only allow requests from Vercel
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Verify request is from Vercel
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await reconciliationService.runScheduledReconciliation();
    
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('[CRON] Reconciliation cron job error:', error);
    return NextResponse.json(
      { 
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  try {
    // Verify request is from Vercel or authenticated user
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await reconciliationService.runScheduledReconciliation();
    
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('[CRON] Reconciliation cron job error:', error);
    return NextResponse.json(
      { 
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}