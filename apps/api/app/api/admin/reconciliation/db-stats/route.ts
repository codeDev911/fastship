import { NextRequest, NextResponse } from 'next/server';
import { reconciliationService } from '@/lib/services/financial.engine';

export async function GET(request: NextRequest) {
  try {
    const stats = await reconciliationService.getReconciliationDbStats();
    
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error fetching DB stats:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
