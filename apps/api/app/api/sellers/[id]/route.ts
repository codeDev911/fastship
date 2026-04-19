import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for seller updates
const updateSellerSchema = z.object({
  companyName: z.string().min(1, "Company name is required").optional(),
  businessType: z.string().min(1, "Business type is required").optional(),
  address: z.string().min(1, "Address is required").optional(),
  city: z.string().min(1, "City is required").optional(),
  state: z.string().min(1, "State is required").optional(),
  zipCode: z.string().min(1, "Zip code is required").optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  accountHolder: z.string().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided for update" }
);

type UpdateSellerInput = z.infer<typeof updateSellerSchema>;

/**
 * GET /api/sellers/[id]
 * Fetch seller details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sellerId = (await params).id;

    if (!sellerId) {
      return NextResponse.json(
        { error: "Seller ID is required" },
        { status: 400 }
      );
    }

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
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!seller) {
      return NextResponse.json(
        { error: "Seller not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: seller });
  } catch (error) {
    console.error("Error fetching seller:", error);
    return NextResponse.json(
      { error: "Failed to fetch seller information" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/sellers/[id]
 * Update seller company and banking information
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sellerId = (await params).id;

    if (!sellerId) {
      return NextResponse.json(
        { error: "Seller ID is required" },
        { status: 400 }
      );
    }

    // Check if seller exists
    const existingSeller = await prisma.seller.findUnique({
      where: { id: sellerId },
    });

    if (!existingSeller) {
      return NextResponse.json(
        { error: "Seller not found" },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate input
    const validationResult = updateSellerSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data as UpdateSellerInput;

    // Build update object - only include provided fields
    const updatePayload: Record<string, any> = {};

    if (updateData.companyName !== undefined) {
      updatePayload.companyName = updateData.companyName;
    }
    if (updateData.businessType !== undefined) {
      updatePayload.businessType = updateData.businessType;
    }
    if (updateData.address !== undefined) {
      updatePayload.address = updateData.address;
    }
    if (updateData.city !== undefined) {
      updatePayload.city = updateData.city;
    }
    if (updateData.state !== undefined) {
      updatePayload.state = updateData.state;
    }
    if (updateData.zipCode !== undefined) {
      updatePayload.zipCode = updateData.zipCode;
    }
    if (updateData.bankName !== undefined) {
      updatePayload.bankName = updateData.bankName;
    }
    if (updateData.bankAccount !== undefined) {
      updatePayload.bankAccount = updateData.bankAccount;
    }
    if (updateData.accountHolder !== undefined) {
      updatePayload.accountHolder = updateData.accountHolder;
    }

    // Update seller
    const updatedSeller = await prisma.seller.update({
      where: { id: sellerId },
      data: updatePayload,
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
        isVerified: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Seller information updated successfully",
        data: updatedSeller,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating seller:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.flatten(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update seller information" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sellers/[id]
 * Delete a seller (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sellerId = (await params).id;

    if (!sellerId) {
      return NextResponse.json(
        { error: "Seller ID is required" },
        { status: 400 }
      );
    }

    // Check if seller exists
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
    });

    if (!seller) {
      return NextResponse.json(
        { error: "Seller not found" },
        { status: 404 }
      );
    }

    // Delete seller (cascades to related records)
    await prisma.seller.delete({
      where: { id: sellerId },
    });

    return NextResponse.json(
      { message: "Seller deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting seller:", error);
    return NextResponse.json(
      { error: "Failed to delete seller" },
      { status: 500 }
    );
  }
}
