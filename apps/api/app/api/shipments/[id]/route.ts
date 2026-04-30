import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { financialService } from "@/lib/services/financial.service";
import { bidService } from "@/lib/services/bid.service";
import { Currency } from "@prisma/client";
import currencyService from "@/lib/services/currency.service";
import { toCents } from "@fastship/lib/server";

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
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
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
    const { amount, driverId, businessId, sellerId, ...rest } = validated;

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
            actualRate_cents: amount ? Math.round(amount * 100) : null,
          }
        : {
            ...rest,
          };
    }

    const updatedShipment = await prisma.$transaction(
      async (tx) => {
        if (sellerId) {
          let seller = await tx.seller.findUnique({
            where: {
              id: sellerId,
            },
            select: {
              wallet: {
                select: {
                  id: true,
                  currency: true,
                },
              },
            },
          });

          if (!seller) {
            throw new Error("Seller not found");
          }

          
          if (seller.wallet?.currency !== Currency.USD) {
            const { baseAmount, baseCents, rate } =
              await currencyService.toBaseCurrency(
                amount,
                seller?.wallet?.currency!,
              );
            data.actualRate = baseAmount;
            data.actualRate_cents = baseCents;
            data.exchangeRate = rate;
            data.actualRateDisplay = amount; // show original amount in user's currency
          }
        else{ // otherwise save in USD and convert later for display
          data.actualRate = amount;
          data.actualRate_cents = toCents(amount);
          data.exchangeRate = 1;
          data.actualRateDisplay = amount; // show original amount in user's currency
          
        }
      }
        const shipment = await tx.shipment.update({
          where: { id: shipmentId },
          data: {
            ...data,
            exchangeRate: data.exchangeRate || 1,
            businessId,
            updatedAt: new Date(),
          },

          include: {
            seller: {
              select: {
                wallet: {
                  select: {
                    id: true,
                    currency: true,
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
            businessId: businessId || "",
          },
          select: {
            id: true,
            currency: true,
          },
        });

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

            console.log(shipment?.seller?.wallet?.currency!);
            
          
          // Lock seller escrow for shipping fee
          await financialService.lockEscrow(
            tx,
            shipment.seller.wallet.id,
            amount || 0,
            "Shipping fee locked",
            shipment.id,
            shipment?.seller?.wallet?.currency!,
          );

          // convert the amount to business wallet currency if different
          let amountInBusinessCurrency = amount || 0;
          if (businessWallet.currency !== shipment?.currency!) {
            const converted = await currencyService.convert(
              amount || 0,
              shipment?.currency!,
              businessWallet.currency,
            );
            amountInBusinessCurrency = converted;
          }

          // Lock business escrow for 10% platform fee
          await financialService.lockEscrow(
            tx,
            businessWallet.id,
            Number(amountInBusinessCurrency) * 0.1,
            "Platform fee locked 10%",
            shipment.id,
            businessWallet.currency,
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
              : driverId
                ? "Driver assigned"
                : `Shipment status updated to ${validated.status}`,
          },
        });

        return shipment;
      },
      { timeout: 200000 },
    );

    // Update Shopify order status if shipment status changed
    if (validated.status) {
      updateShopifyOrderStatus(shipmentId, validated.status).catch((err) =>
        console.warn("Failed to update Shopify status:", err),
      );
    }

    return NextResponse.json(updatedShipment);
  } catch (error) {
    console.error("Update shipment error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

/**
 * Helper function to update Shopify order status
 * Called after shipment status changes
 */
async function updateShopifyOrderStatus(shipmentId: string, newStatus: string) {
  try {
    // Get the shipment with related Shopify order
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        shopifyOrders: {
          include: {
            integration: true,
          },
        },
      },
    });

    if (
      !shipment ||
      !shipment.shopifyOrders ||
      shipment.shopifyOrders.length === 0
    ) {
      return; // No Shopify order to update
    }

    // Update Shopify status for each associated order
    for (const shopifyOrder of shipment.shopifyOrders) {
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/integrations/shopify/update-status`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              shipmentId,
              integrationId: shopifyOrder.integrationId,
              status: newStatus,
            }),
          },
        ).catch((err) => console.warn("Failed to update Shopify status:", err));
      } catch (error) {
        console.warn(
          `Failed to update Shopify order status for integration ${shopifyOrder.integrationId}:`,
          error,
        );
      }
    }
  } catch (error) {
    console.warn("Error in updateShopifyOrderStatus:", error);
    // Don't throw - this is a secondary operation
  }
}
