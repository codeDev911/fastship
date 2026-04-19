import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { reconciliationService } from '@/lib/services/financial.engine';

export async function POST(request: NextRequest) {
  try {
    // Call the reconciliation service to reconcile all wallets
    const result = await reconciliationService.reconcileAllWallets();

    return NextResponse.json({ 
      success: true,
      message: 'Wallet reconciliation completed',
      result 
    });
  } catch (error) {
    console.error('Error reconciling wallets:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reconcile wallets'
      },
      { status: 500 }
    );
  }
}
