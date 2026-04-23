import { NextRequest, NextResponse } from 'next/server';
import { reconciliationService } from '@/lib/services/financial.engine';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const alertId = (await params).id;
    const userId = request.headers.get('x-user-id') || 'SYSTEM';

    const result = await reconciliationService.acknowledgeAlert(
      alertId,
      userId
    );

    return NextResponse.json({
      success: true,
      alert: result,
    });
  } catch (error: any) {
    console.error('Error acknowledging alert:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
