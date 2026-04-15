import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { financialService } from "@/lib/services/financial.service";
import { bidService } from "@/lib/services/bid.service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
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
        seller: {
          include:{
            user:{
              select:{
                id:true,
                name:true,
                email:true,
                phone:true,
              }
            }
          }
        },
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
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(shipment);
  } catch (error) {
    console.error("Get shipment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const validated = body;
    const shipmentId = (await params).id;
    const lockEscrow = request.nextUrl.searchParams.get("lockEscrow") == "true";
    const { amount, driverId, businessId, ...rest } = validated;

    // ==========================================
    // STEP 1: Validate bid acceptance (if business assignment)
    // ==========================================
    // if (lockEscrow && businessId && amount) {
    //   const bidValidation = await bidService.validateBidAcceptance(
    //     shipmentId,
    //     amount,
    //     businessId
    //   );

    //   if (!bidValidation.isValid) {
    //     return NextResponse.json(
    //       { error: bidValidation.errors.join("; ") },
    //       { status: 400 }
    //     );
    //   }

    //   if (bidValidation.warnings.length > 0) {
    //     console.warn("Bid acceptance warnings:", bidValidation.warnings);
    //   }
    // }

    // ==========================================
    // STEP 2: Prepare shipment data
    // ==========================================
    let data: any;

    if (driverId) {
      data = {
        ...rest,
        assignment: {
          connectOrCreate: {
            where: {
              shipmentId: shipmentId,
            },
            create: {
              driverId: driverId || "",
              businessId: businessId || "",
              assignedAt: new Date(),
              assignmentStatus: "ASSIGNED",
            },
          },
        },
      };
    } else {
      data = amount
        ? {
            ...rest,
            actualRate: amount,
          }
        : {
            ...rest,
          };
    }

    // ==========================================
    // STEP 3: Process transaction
    // ==========================================
    return await prisma.$transaction(
      async (tx) => {
        const shipment = await tx.shipment.update({
          where: { id: shipmentId },
          data: {
            ...data,
            businessId,
            updatedAt: new Date(),
          },

          include: {
            seller: {
              select: {
                wallet: {
                  select: {
                    id: true,
                  },
                },
              },
            },
            assignment: {
              include: {
                driver: {
                  include: {
                    user: {
                      select: {
                        name: true,
                        email: true,
                        phone: true,
                        isActive: true,
                        isVerified: true,
                      },
                    },
                  },
                },
              },
            },
            tracking: true,
          },
        });

        let businessWallet = await tx.wallet.findUnique({
          where: {
            businessId:businessId || "",
          },
          select: {
            id: true,
          },
        });

        console.log(businessId);
        

        // ==========================================
        // STEP 4: Lock escrow if assigning to business
        // ==========================================
        if (lockEscrow) {
          if (!shipment.seller.wallet) {
            throw new Error("Seller wallet not found");
          }

          if (!businessWallet) {
            throw new Error("Business wallet not found");
          }

          // Lock seller escrow for shipping fee
          await financialService.lockEscrow(
            tx,
            shipment.seller.wallet.id,
            amount || 0,
            "Shipping fee locked",
            shipment.id
          );

          // Lock business escrow for 10% platform fee
          await financialService.lockEscrow(
            tx,
            businessWallet.id,
            Number(amount) * 0.1 || 10,
            "Platform fee locked 10%",
            shipment.id
          );

          // ==========================================
          // STEP 5: Update bid status
          // ==========================================
          if (businessId) {
            await tx.bid.updateMany({
              where: {
                shipmentId,
                businessId,
              },
              data: {
                bidStatus: "ACCEPTED",
                isAccepted: true,
                acceptedAt: new Date(),
              },
            });

            // Mark other bids as rejected
            await tx.bid.updateMany({
              where: {
                shipmentId,
                businessId: { not: businessId },
              },
              data: {
                bidStatus: "REJECTED",
              },
            });
          }
        }

        // Create activity log
        await tx.shipmentActivity.create({
          data: {
            shipmentId: shipmentId,
            status: validated.status || shipment.status,
            description: businessId
              ? `Shipment assigned to business`
              : `Shipment status updated to ${validated.status}`,
          },
        });

       return NextResponse.json( shipment)
      },
      { timeout: 200000 }
    );
  } catch (error) {
    console.error("Update shipment error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
