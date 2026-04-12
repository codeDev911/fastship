import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { financialService } from '@/lib/services/financial.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');
    const driverId = searchParams.get('driverId');
    const businessId = searchParams.get('businessId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!sellerId && !driverId && !businessId) {
      return NextResponse.json(
        { message: 'IDs required' },
        { status: 400 }
      );
    }

   


    let where : any ={}

    if(sellerId) where.wallet ={  sellerId };
    if(driverId) where.wallet ={  driverId };
    if(businessId) where.wallet ={  businessId };

    // Fetch seller transactions
    const transactions = await prisma.transaction.findMany({
      where: where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
    
    
    // Map transactions to billing format
    const billing = transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      date: tx.createdAt.toISOString(),
      status: tx.status,
    }));

    return NextResponse.json({
      data: billing,
      total:transactions.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[v0] Billing error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch billing';
    return NextResponse.json({ message }, { status: 500 });
  }
}
