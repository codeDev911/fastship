import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * Schema for updating a rate card
 */
const updateRateCardSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  description: z.string().optional(),
  baseRate: z.number().positive("Base rate must be positive").optional(),
  perKmRate: z.number().positive("Per km rate must be positive").optional(),
  minimumDistance: z.number().nonnegative("Minimum distance cannot be negative").optional(),
  maximumDistance: z.number().positive("Maximum distance must be positive").optional(),
  minWeight: z.number().nonnegative("Min weight cannot be negative").optional(),
  maxWeight: z.number().positive("Max weight must be positive").optional(),
  weightSurcharge: z.number().nonnegative("Weight surcharge cannot be negative").optional(),
  serviceStates: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/rate-cards/[id]
 * Fetch a specific rate card with business details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rateCard = await prisma.rateCard.findUnique({
      where: { id: (await params).id },
      include: {
        business: {
          select: {
            id: true,
            companyName: true,
            businessType: true,
            rating: true,
            isActive: true,
          },
        },
      },
    });

    if (!rateCard) {
      return NextResponse.json(
        { error: 'Rate card not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(rateCard);
  } catch (error) {
    console.error('[rate-cards GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rate card' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/rate-cards/[id]
 * Update a rate card
 * 
 * All fields are optional - only provided fields will be updated
 * Validates constraints (e.g., minDistance < maxDistance)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Fetch existing rate card first
    const existingRateCard = await prisma.rateCard.findUnique({
      where: { id: (await params).id },
    });

    if (!existingRateCard) {
      return NextResponse.json(
        { error: 'Rate card not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = updateRateCardSchema.parse(body);

    // Prepare update data - merge with existing values for validation
    const updateData: any = { ...validated };

    // Get values to validate (use existing if not updating)
    const minDist = updateData.minimumDistance ?? existingRateCard.minimumDistance;
    const maxDist = updateData.maximumDistance ?? existingRateCard.maximumDistance;
    const minWgt = updateData.minWeight ?? existingRateCard.minWeight;
    const maxWgt = updateData.maxWeight ?? existingRateCard.maxWeight;

    // Validate distance range
    if (minDist >= maxDist) {
      return NextResponse.json(
        { error: 'Minimum distance must be less than maximum distance' },
        { status: 400 }
      );
    }

    // Validate weight range
    if (minWgt >= maxWgt) {
      return NextResponse.json(
        { error: 'Min weight must be less than max weight' },
        { status: 400 }
      );
    }

    // Add updatedAt timestamp
    updateData.updatedAt = new Date();

    const rateCard = await prisma.rateCard.update({
      where: { id: (await params).id },
      data: updateData,
      include: {
        business: {
          select: {
            id: true,
            companyName: true,
            rating: true,
          },
        },
      },
    });

    return NextResponse.json(rateCard);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('[rate-cards PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update rate card' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rate-cards/[id]
 * Delete a rate card (soft delete - set isActive to false)
 * 
 * Option 1: Hard delete (uncomment code below to enable)
 * Option 2: Soft delete (current implementation)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rateCard = await prisma.rateCard.findUnique({
      where: { id:(await  params).id },
    });

    if (!rateCard) {
      return NextResponse.json(
        { error: 'Rate card not found' },
        { status: 404 }
      );
    }

    // Option 1: Soft delete (recommended - preserves data)
    const updated = await prisma.rateCard.update({
      where: { id: (await params).id },
      data: { isActive: false },
    });

    // Option 2: Hard delete (uncomment to enable)
    // const deleted = await prisma.rateCard.delete({
    //   where: { id: params.id },
    // });

    return NextResponse.json({
      message: 'Rate card deleted successfully',
      data: updated,
    });
  } catch (error) {
    console.error('[rate-cards DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete rate card' },
      { status: 500 }
    );
  }
}
