import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest,
  { params }: { params: { id: string } }

) {
  try {
    const id = (await params).id;

    const driver = await prisma.driver.findUnique({
      where: { id },
    });

    if(!driver) {
      return NextResponse.json({ message: 'Driver not found' }, { status: 404 });
    }

    return NextResponse.json(driver);

  } catch (error) {
    console.error('[v0] Driver orders error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch orders';
    return NextResponse.json({ message }, { status: 500 });
  }
}
 
