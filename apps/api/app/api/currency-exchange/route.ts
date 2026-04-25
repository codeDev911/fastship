import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {

    const exchangeRates = await prisma.exchangeRate.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ exchangeRates });   
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return NextResponse.json({ error: 'Failed to fetch exchange rates' }, { status: 500 });
  }
}