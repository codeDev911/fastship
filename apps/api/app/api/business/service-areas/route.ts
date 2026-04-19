import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const serviceAreaSchema = z.object({
  state: z.string().min(2, 'State is required'),
  city: z.string().min(2, 'City is required'),
  activeDrivers: z.number().min(0, 'Active drivers cannot be negative'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  isActive: z.boolean().optional(),
});

// GET: Fetch service areas for a business
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    const serviceAreas = await prisma.businessServiceArea.findMany({
      where: {businessId},
    });

    

    return NextResponse.json({
      success: true,
      serviceAreas,
      total: serviceAreas.length,
    });
  } catch (error: any) {
    console.error('Error fetching service areas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service areas' },
      { status: 500 }
    );
  }
}

// POST: Create new service area
export async function POST(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    const body = await req.json();
    
    // Validate input
    const validationResult = serviceAreaSchema.safeParse(body);
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
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Check for duplicate (state + city combination)
    const existing = await prisma.businessServiceArea.findUnique({
      where: {
        businessId_state_city: {
          businessId,
          state: validationResult.data.state,
          city: validationResult.data.city,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Service area already exists for ${validationResult.data.state}, ${validationResult.data.city}` },
        { status: 409 }
      );
    }

    // Create service area
    const serviceArea = await prisma.businessServiceArea.create({
      data: {
        businessId,
        ...validationResult.data,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Service area created successfully',
        serviceArea,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating service area:', error);
    return NextResponse.json(
      { error: 'Failed to create service area' },
      { status: 500 }
    );
  }
}
