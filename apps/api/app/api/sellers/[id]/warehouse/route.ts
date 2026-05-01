import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateWarehouseSchema = z.object({
  warehouseName: z.string().min(1),
  warehouseAddress: z.string().min(1),
  warehouseCity: z.string().min(1),
  warehouseState: z.string().min(1),
  warehouseZipCode: z.string().min(1),
  warehouseLatitude: z.number(),
  warehouseLongitude: z.number(),
  warehousePhone: z.string().min(1),
});



export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sellerId = (await params).id;
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      select:{
        id:true,
        warehousePhone:true,
        warehouseName:true,
        warehouseAddress:true,
        warehouseCity:true,
        warehouseState:true,
        warehouseZipCode:true,
        warehouseLatitude:true,
        warehouseLongitude:true,
      }
    })
    return NextResponse.json({ seller });
  }

    catch (error) {
        return NextResponse.json({
            error:"Server error"
        },{status:500})
    }
}


export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id  = (await params).id;
    const body = await request.json();

    // Validate the request body
    const validated = updateWarehouseSchema.parse(body);

    // Check if seller exists
    const seller = await prisma.seller.findUnique({
      where: { id },
    });

    

    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // Update seller with warehouse information
    const updatedSeller = await prisma.seller.update({
      where: { id },
      data: {
        warehouseName: validated.warehouseName,
        warehouseAddress: validated.warehouseAddress,
        warehouseCity: validated.warehouseCity,
        warehouseState: validated.warehouseState,
        warehouseZipCode: validated.warehouseZipCode,
        warehouseLatitude: validated.warehouseLatitude,
        warehouseLongitude: validated.warehouseLongitude,
        warehousePhone:validated.warehousePhone
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Warehouse location updated successfully",
      seller: updatedSeller,
    });
  } catch (error: any) {
    console.error("Update warehouse error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
