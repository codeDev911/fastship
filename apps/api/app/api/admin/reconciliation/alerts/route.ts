import { NextRequest, NextResponse } from 'next/server';
import { reconciliationService } from '@/lib/services/financial.engine';

export async function GET(request: NextRequest) {
  try {
    const alerts = await reconciliationService.getActiveAlerts();
    
    return NextResponse.json({
      alerts: alerts.map((alert: any) => ({
        id: alert.id,
        walletId: alert.walletId,
        severity: alert.severity,
        type: alert.type,
        message: alert.message,
        status: alert.status,
        expectedCents: alert.expectedCents,
        actualCents: alert.actualCents,
        diffCents: alert.diffCents,
        createdAt: alert.createdAt,
        acknowledgedAt: alert.acknowledgedAt,
        resolvedAt: alert.resolvedAt,
        wallet: alert.wallet,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
