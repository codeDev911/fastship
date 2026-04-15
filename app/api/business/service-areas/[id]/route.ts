import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updates
const updateServiceAreaSchema = z.object({
  state: z.string().min(2).optional(),
  city: z.string().min(2).optional(),
  activeDrivers: z.number().min(0).optional(),
  capacity: z.number().min(1).optional(),
  isActive: z.boolean().optional(),
});

// GET: Fetch single service area
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const serviceArea = await prisma.businessServiceArea.findUnique({
      where: { id: params.id },
      include: {
        business: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    if (!serviceArea) {
      return NextResponse.json(
        { error: 'Service area not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      serviceArea,
    });
  } catch (error: any) {
    console.error('Error fetching service area:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service area' },
      { status: 500 }
    );
  }
}

// PATCH: Update service area
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    // Validate input
    const validationResult = updateServiceAreaSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    // Check if service area exists
    const existing = await prisma.businessServiceArea.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Service area not found' },
        { status: 404 }
      );
    }

    // If state or city is being updated, check for conflicts
    if (validationResult.data.state || validationResult.data.city) {
      const newState = validationResult.data.state || existing.state;
      const newCity = validationResult.data.city || existing.city;

      if (newState !== existing.state || newCity !== existing.city) {
        const conflict = await prisma.businessServiceArea.findUnique({
          where: {
            businessId_state_city: {
              businessId: existing.businessId,
              state: newState,
              city: newCity,
            },
          },
        });

        if (conflict && conflict.id !== params.id) {
          return NextResponse.json(
            { error: `Service area already exists for ${newState}, ${newCity}` },
            { status: 409 }
          );
        }
      }
    }

    // Update service area
    const updated = await prisma.businessServiceArea.update({
      where: { id: params.id },
      data: validationResult.data,
      include: {
        business: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Service area updated successfully',
      serviceArea: updated,
    });
  } catch (error: any) {
    console.error('Error updating service area:', error);
    return NextResponse.json(
      { error: 'Failed to update service area' },
      { status: 500 }
    );
  }
}

// DELETE: Remove service area (soft delete - set isActive to false)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const serviceArea = await prisma.businessServiceArea.findUnique({
      where: { id: params.id },
    });

    if (!serviceArea) {
      return NextResponse.json(
        { error: 'Service area not found' },
        { status: 404 }
      );
    }

    // Soft delete - mark as inactive
    const deleted = await prisma.businessServiceArea.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Service area deleted successfully',
      serviceArea: deleted,
    });
  } catch (error: any) {
    console.error('Error deleting service area:', error);
    return NextResponse.json(
      { error: 'Failed to delete service area' },
      { status: 500 }
    );
  }
}
