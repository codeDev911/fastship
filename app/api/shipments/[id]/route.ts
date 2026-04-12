import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { financialService } from "@/lib/services/financial.service";

const updateShipmentSchema = z.object({
  status: z.enum([
    "PENDING",
    "ASSIGNED",
    "PICKUP",
    "PICKED_UP",
    "IN_TRANSIT",
    "DELIVERED",
    "FAILED",
    "CANCELLED",
  ]).optional(),
  notes: z.string().optional(),
  businessId: z.string().optional(),
  amount: z.number().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = request.nextUrl.searchParams.get("businessId");
    const driverId = request.nextUrl.searchParams.get("driverId");
    

    const where: any = { id: (await params).id };
    if (businessId) where.businessId = businessId;
    if (driverId) where.assignment = { driverId };

    const shipment = await prisma.shipment.findUnique({
      where: where,
      include: {
        seller: true,
        assignment: {
          include: {
            driver: true,
            business: true,
          },
        },
        payment: true,
        tracking: true,
        activities: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    return NextResponse.json(shipment);
  } catch (error) {
    console.error("Get shipment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = body
    const lockEscrow = request.nextUrl.searchParams.get("lockEscrow") === "true";
    const {amount,driverId,...rest} = validated
    let data :any
    if(driverId){
      data = {
         ...rest,
        assignment:{
          connectOrCreate:{ 
            where:{
              shipmentId:(await params).id,
            },
            create:{
              driverId:driverId || '',
              businessId:validated.businessId || '',
              assignedAt:new Date(),
              assignmentStatus:"ASSIGNED",
            }
          }
        },
      }

      
    }else {
      amount ? data = {
          ...rest,
          actualRate:amount ,
      }:
      data = {
        ...rest,
         
      }
    }
    const shipment = await prisma.shipment.update({
      where: { id: (await params).id },
      data: {
       ...data,
       updatedAt: new Date(),
      },

      include: {
        seller:{
          select:{
            wallet:{
              select:{
                id:true
              }
            }
          }
        },
        assignment: {
          include: {
            driver: {
              include:{
                user:{
                  select:{
                    name:true,
                    email:true,
                    phone:true,
                    isActive:true,
                    isVerified:true
                  }
                }
              }
            },
          },
        },
        tracking: true,
      },
    });

    // Update tracking status if shipment status changed
    if (validated.status) {
      await prisma.tracking.upsert({
        where: { shipmentId: (await params).id },
        update: {
          currentStatus: validated.status,
        },
        create: {
          shipmentId: (await params).id,
          currentStatus: validated.status,
        },
      });

      let businessWallet = await prisma.wallet.findUnique({
        where:{
          businessId:shipment?.businessId||"",
        },
        select:{
          id:true
        }
      })

      // lockEscrow of the seller and the business
      // the seller escrow will be distributed amoung driver and business 
      // and the business escrow will be cuts due to 10% platform fee
        if(lockEscrow){
          await financialService.lockEscrow(shipment?.seller?.wallet?.id, amount || 0, "Shipping fee locked")
          await financialService.lockEscrow(businessWallet?.id, Number(amount) * 0.1 || 10, "Platform fee locked 10%")
        }

      // Create activity log
      await prisma.shipmentActivity.create({
        data: {
          shipmentId: (await params).id,
          status: validated.status,
          description: `Shipment status updated to ${validated.status}`,
        },
      });
    }



    return NextResponse.json(shipment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Update shipment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
