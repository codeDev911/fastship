import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id  =(await  params).id;

    const business = await prisma.business.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        companyName: true,
        businessType: true,
        operatingRegion: true,
        commissionRate: true,
        serviceAreas:true,
        insuranceProvider: true,
        insuranceNumber: true,
        bankAccount: true,
        bankName: true,
        driverAssignments:{
            select:{
                id:true,
            }
        },
        accountHolder: true,
        rating: true,
        isActive: true,
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
        drivers: {
          select: {
            id: true,
            user:{
                select:{
                    id:true,
                    name:true,
                    email:true
                }
            },
            assignments:{
                select:{
                    id:true,
                }
            },
          },
        },
        rateCards: {
          select: {
            id: true,
            name: true,
            description: true,
            baseRate: true,
            perKmRate: true,
            minimumDistance: true,
            maximumDistance: true,
            minWeight: true,
            maxWeight: true,
            weightSurcharge: true,
            serviceStates: true,
            inCityDelivery: true,
            serviceCities: true,
            isActive: true,
            createdAt: true,
          },
          take: 10,
        },
        settlements: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        
      },
      
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: business });
  } catch (error) {
    console.error('Error fetching business details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business details' },
      { status: 500 }
    );
  }
}
