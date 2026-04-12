import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { financialService } from "@/lib/services/financial.service"
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

   const {
      sellerId,
      receiverName,
      receiverPhone,
      receiverAddress,
      weight,
      dimensions,
      paymentMethod,
      description,
    } = body
    console.log();
    
    // Validate required fields
    if (!sellerId ||!weight) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create shipment
    const shipment = await prisma.shipment.create({
      data: {
        ...body,
        weight: parseFloat(weight),
        dimensions,
        status: 'PENDING',
        paymentMethod: paymentMethod || 'COD',
        description,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        seller: {
          select: {
            wallet: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    

    return NextResponse.json(shipment, { status: 201 });
  } catch (error) {
    console.error('[v0] Order creation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create order';
    return NextResponse.json({ message }, { status: 500 });
  }
}
