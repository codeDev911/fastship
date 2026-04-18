import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sellerId = (await params).id;

    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        userId: true,
        companyName: true,
        businessType: true,
        taxId: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        bankAccount: true,
        bankName: true,
        accountHolder: true,
        warehouseName: true,
        warehouseAddress: true,
        warehouseCity: true,
        warehouseState: true,
        warehouseZipCode: true,
        warehouseLatitude: true,
        warehouseLongitude: true,
        warehousePhone: true,
        rating: true,
        totalOrders: true,
        cancelledOrders: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
        wallet: {
          select: {
            id: true,
            balance: true,
            escrowBalance: true,
          },
        },
        shipments: {
          select: {
            id: true,
            status: true,
            distance: true,
            codAmount:true,
            actualRate: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        disputes: {
          select: {
            id: true,
            reason: true,
            status: true,
            amount: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    const totalOrders = seller?.shipments.length

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    return NextResponse.json({ data: {...seller,totalOrders} });
  } catch (error) {
    console.error('Error fetching seller:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seller' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sellerId = (await params).id;
    const body = await request.json();

    // Only allow specific fields to be updated
    const allowedFields = ['isVerified', 'isActive'];
    const updateData: any = {};

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    const updatedSeller = await prisma.seller.update({
      where: { id: sellerId },
      data: updateData,
      select: {
        id: true,
        companyName: true,
        isVerified: true,
      },
    });

    return NextResponse.json({ data: updatedSeller });
  } catch (error) {
    console.error('Error updating seller:', error);
    return NextResponse.json(
      { error: 'Failed to update seller' },
      { status: 500 }
    );
  }
}
