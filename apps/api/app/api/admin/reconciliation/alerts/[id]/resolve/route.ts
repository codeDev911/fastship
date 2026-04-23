import { NextRequest, NextResponse } from 'next/server';
import { reconciliationService } from '@/lib/services/financial.engine';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const alertId = (await params).id;
    const userId = request.headers.get('x-user-id') || 'SYSTEM';
    const { resolution } = await request.json();

    if (!resolution) {
      return NextResponse.json(
        { error: 'Resolution details are required' },
        { status: 400 }
      );
    }

    const result = await reconciliationService.resolveAlert(
      alertId,
      resolution,
      userId
    );

    return NextResponse.json({
      success: true,
      alert: result,
    });
  } catch (error: any) {
    console.error('Error resolving alert:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
