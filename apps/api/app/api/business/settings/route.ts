import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const businessSettingsSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  businessType: z.string().min(2, 'Business type is required'),
  operatingRegion: z.string().min(2, 'Operating region is required'),
  commissionRate: z.number().min(0).max(100, 'Commission rate must be between 0 and 100'),
  insuranceProvider: z.string().optional().nullable(),
  insuranceNumber: z.string().optional().nullable(),
  bankAccount: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  accountHolder: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// GET: Fetch business settings
export async function GET(req: NextRequest) {
  try {
    // Extract userId from query params or auth
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const businessId = searchParams.get('businessId');

    
    if (!userId && !businessId) {
      return NextResponse.json(
        { error: 'User or Business ID is required' },
        { status: 400 }
      );
    }

    const where:any ={}

    if(businessId) where.id = businessId
    if(userId) where.userId = userId

    const business = await prisma.business.findUnique({
      where: where,
      include: {
        user: {
          select: {
            email: true,
            name: true,
            phone: true,
            profileImage: true,
          },
        },
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      business,
    });
  } catch (error: any) {
    console.error('Error fetching business settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business settings' },
      { status: 500 }
    );
  }
}

// PATCH: Update business settings
export async function PATCH(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const body = await req.json();
    
    // Validate input
    const validationResult = businessSettingsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    // Check if business exists
    const existingBusiness = await prisma.business.findUnique({
      where: { userId },
    });

    if (!existingBusiness) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Update business
    const updatedBusiness = await prisma.business.update({
      where: { userId },
      data: validationResult.data,
      include: {
        user: {
          select: {
            email: true,
            name: true,
            phone: true,
            profileImage: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Business settings updated successfully',
      business: updatedBusiness,
    });
  } catch (error: any) {
    console.error('Error updating business settings:', error);
    return NextResponse.json(
      { error: 'Failed to update business settings' },
      { status: 500 }
    );
  }
}
