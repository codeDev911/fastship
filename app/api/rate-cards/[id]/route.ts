import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const rateCard = await prisma.rateCard.findUnique({
      where: { id: params.id },
    });

    if (!rateCard) {
      return NextResponse.json(
        { message: 'Rate card not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(rateCard);
  } catch (error) {
    console.error('[v0] Get rate card error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch rate card' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { basePricePerKg, pricePerKm, minPrice, maxPrice, isActive } = await request.json();

    const rateCard = await prisma.rateCard.update({
      where: { id: params.id },
      data: {
        ...(basePricePerKg !== undefined && { basePricePerKg: parseFloat(basePricePerKg) }),
        ...(pricePerKm !== undefined && { pricePerKm: parseFloat(pricePerKm) }),
        ...(minPrice !== undefined && { minPrice: parseFloat(minPrice) }),
        ...(maxPrice !== undefined && { maxPrice: parseFloat(maxPrice) }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(rateCard);
  } catch (error) {
    console.error('[v0] Update rate card error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update rate card';
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.rateCard.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Rate card deleted' });
  } catch (error) {
    console.error('[v0] Delete rate card error:', error);
    return NextResponse.json(
      { message: 'Failed to delete rate card' },
      { status: 500 }
    );
  }
}
