import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const driverId = request.nextUrl.searchParams.get('driverId');

    if (!driverId) {
      return NextResponse.json(
        { error: 'driverId is required' },
        { status: 400 }
      );
    }

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: { wallet: true },
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }

    
    const currentDebt = driver.currentDebt

    // Get debt limit from business settings (default 50000)
    const debtLimit = 25000; // This can be fetched from a settings table if it's configurable

    const totalCollectedCash = driver.currentDebt

    return NextResponse.json({
      totalCollectedCash,
      currentDebt,
      maxDebtLimit: debtLimit,
      remainingLimit: Math.max(0, debtLimit - currentDebt),
      debtPercentage: (currentDebt / debtLimit) * 100,
      isSuspended: currentDebt >= debtLimit,
    });
  } catch (error) {
    console.error('Error fetching driver debt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch driver debt' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { driverId, amount, shipmentId } = await request.json();

    if (!driverId || !amount) {
      return NextResponse.json(
        { error: 'driverId and amount are required' },
        { status: 400 }
      );
    }

    // Update shipment as settled
    if (shipmentId) {
      await prisma.shipment.update({
        where: { id: shipmentId },
        data: { isSettled: true },
      });
    }

    // Create debt settlement transaction
    const transaction = await prisma.transaction.create({
      data: {
        type: 'SETTLEMENT',
        amount,
        status: 'COMPLETED',
        description: `Debt settlement for driver ${driverId}`,
        wallet:{
          connect:{
            driverId
          }
        }
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Error settling debt:', error);
    return NextResponse.json(
      { error: 'Failed to settle debt' },
      { status: 500 }
    );
  }
}
