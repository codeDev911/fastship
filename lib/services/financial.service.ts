import { prisma } from "@/lib/prisma";
import { TransactionType, PaymentStatus } from "@prisma/client";


const getById = (label:string,id:string)=>{
  switch (label) {
    case "seller":
      return {id:{sellerId:id}}
  
    case "business":
      return {id:{businessId:id}}
  
    case "driver":
      return {id:{driverId:id}}
  
    default:
      break;
  }
}

export const financialService = {
  async topUpWallet(walletId: string, amount: number) {
    return this.createTransaction(walletId, "CREDIT", amount, "Wallet top-up");
  },

  async createTransaction(
    walletId: string,
    type: TransactionType,
    amount: number,
    description: string,
    referenceId?: string
  ) {
    const transaction = await prisma.transaction.create({
      data: {
        walletId,
        type,
        amount,
        description,
        referenceId,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    // Update wallet balance
    const balanceChange =
      ["CREDIT", "SETTLEMENT"].includes(type) ? amount : -amount;

    await prisma.wallet.update({
      where: { id: walletId },
      data: {
        balance: {
          increment: balanceChange,
        },
      },
    });

    return transaction;
  },

  async lockEscrow(walletId: string, amount: number, reason: string) {
    

    let wallet = await prisma.wallet.findUnique({
      where:{
        id:walletId
      },
      select:{
        balance:true,
        escrowBalance:true
      }
    })

    // if escrow is grater then the wallet balance will rise error
    if(Number(amount) > Number( wallet?.balance)){
      throw new Error("Insufficient balance")
    }

    await prisma.wallet.update({
      where: { id: walletId },
      data: {
        escrowBalance: {
          increment: amount,
        },
      },
    });
    
    const transaction = await prisma.transaction.create({
      data: {
        walletId,
        type: "ESCROW_LOCK",
        amount,
        description: `Escrow locked: ${reason}`,
        status: "PENDING",
      },
    });

    return transaction;
  },

  async releaseEscrow(walletId: string, amount: number, reason: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet || wallet.escrowBalance < amount) {
      throw new Error("Insufficient escrow balance");
    }

    const transaction = await prisma.transaction.create({
      data: {
        walletId,
        type: "CREDIT",
        amount, 
        description: `Escrow released: ${reason}`,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    await prisma.wallet.update({
      where: { id: walletId },
      data: {
        escrowBalance: {
          decrement: amount,
        }, 
      },
    });

    return transaction;
  },

  async processPayment(
    shipmentId: string,
    amount: number,
    paymentMethod: "PREPAID" | "COD"
  ) {
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        seller: {
          include: {
            wallet: true,
          },
        },
      },
    });

    if (!shipment) {
      throw new Error("Shipment not found");
    }

    let tax = amount * 0; // 0% tax 
    let commission = amount * 0; // 0% commission
    let driverPayable = 0;
    commission = Number(shipment.actualRate)

    if(paymentMethod === "COD"){
      tax = amount * 0.0; // 0% tax for COD
      driverPayable = commission * 0.8; // Driver gets 80% of commission for COD
    }


    const payment = await prisma.payment.create({
      data: {
        shipmentId,
        amount,
        tax,
        commission,
        driverPayable,
        paymentMethod,
        paymentStatus: paymentMethod === "PREPAID" ? "COMPLETED" : "PENDING",
        paidAt: paymentMethod === "PREPAID" ? new Date() : undefined,
      },
    });

    

    return payment;
  },

  async settleDriverPayment(driverId: string, amount: number) {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        wallet: true,
      },
    });

    if (!driver || !driver.wallet) {
      throw new Error("Driver or wallet not found");
    }

    // Create earning record
    const earning = await prisma.earning.create({
      data: {
        driverId,
        amount,
      },
    });

    // Add to wallet
    await this.createTransaction(
      driver.wallet.id,
      "CREDIT",
      amount,
      `Settlement for delivery`,
      earning.id
    );

    return earning;
  },

  async processSettlement(
    businessId: string,
    periodStart: Date,
    periodEnd: Date
  ) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        wallet: true,
      },
    });

    if (!business) {
      throw new Error("Business not found");
    }

    // Get all unsettled earnings in period
    const earnings = await prisma.earning.findMany({
      where: {
        earnedAt: {
          gte: periodStart,
          lte: periodEnd,
        },
        isSettled: false,
      },
    });

    const totalAmount = earnings.reduce(
      (sum, earning) => sum + earning.amount,
      0
    );
    const commission = totalAmount * (business.commissionRate / 100);
    const netAmount = totalAmount - commission;

    // Create settlement record
    const settlement = await prisma.settlement.create({
      data: {
        businessId,
        periodStart,
        periodEnd,
        totalAmount,
        commission,
        netAmount,
        status: "COMPLETED",
        settledAt: new Date(),
      },
    });

    // Mark earnings as settled
    await prisma.earning.updateMany({
      where: {
        id: {
          in: earnings.map((e) => e.id),
        },
      },
      data: {
        isSettled: true,
        settlementId: settlement.id,
      },
    });

    // Add to business wallet
    if (business.wallet) {
      await this.createTransaction(
        business.wallet.id,
        "SETTLEMENT",
        netAmount,
        `Settlement for period ${periodStart.toISOString()} - ${periodEnd.toISOString()}`,
        settlement.id
      );
    }

    return settlement;
  },

  async addCODDebt(driverId: string, amount: number, shipmentId?: string) {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      throw new Error("Driver not found");
    }

    const debt = await prisma.driverDebt.create({
      data: {
        driverId,
        amount,
        shipmentId: shipmentId || undefined,
        debtReason: "COD collection not completed",
      },
    });

    // Update driver's current debt
    await prisma.driver.update({
      where: { id: driverId },
      data: {
        currentDebt: {
          increment: amount,
        },
      },
    });

    return debt;
  },

  async settleCODDebt(driverId: string, amount: number) {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        wallet: true,
      },
    });

    if (!driver || !driver.wallet) {
      throw new Error("Driver or wallet not found");
    }

    if (driver.currentDebt < amount) {
      throw new Error("Amount exceeds current debt");
    }
 

    // Update unsettled debts
    const debts = await prisma.driverDebt.findMany({
      where: {
        driverId,
        isSettled: false,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    let remainingAmount = amount;
    for (const debt of debts) {
      if (remainingAmount <= 0) break;

      const settleAmount = Math.min(remainingAmount, debt.amount);
      await prisma.driverDebt.update({
        where: { id: debt.id },
        data: {
          isSettled: true,
          settledAt: new Date(),
        },
      });

      remainingAmount -= settleAmount;
    }

    // Update driver current debt
    await prisma.driver.update({
      where: { id: driverId },
      data: {
        currentDebt: {
          decrement: Number(amount),
        },
      },
    });

    return { settledAmount: Number(amount), remainingDebt: driver.currentDebt - Number(amount) };
  },

  async transferFunds(from:"driver"|"business"|"seller", to : "driver"|"business"|"seller", fromId:any,toId:any,amount:any,description?:"Funds transfer"){

    const getIdSender = getById(from,fromId) || {id:{sellerId:"s"}}
    const getIdReciever = getById(to,toId) || {id:{sellerId:"s"}}

    try {
      await prisma.$transaction(async (tx)=>{
      let senderWallet = await tx.wallet.findUnique({
        where:getIdSender?.id
      })

      let recievedWallet = await tx.wallet.findUnique({
        where:getIdReciever?.id
      })

      if(!senderWallet || !recievedWallet){
        throw new Error("No wallets founded!")
      }

      if(senderWallet?.balance < Number(amount)){
        throw new Error("Insufficient Balance")
      }

      console.log(getIdReciever);
      console.log(getIdSender);
      console.log(from);
      console.log(to);
      

      // begin transaction

      // Deduct from sender
      await tx.wallet.update({
        where:{
          id:senderWallet.id
        },data:{
          balance:{
            decrement:Number(amount)
          }
        }
      })

      let sender = await tx.transaction.create({
        data:{
          referenceId:senderWallet.id,
          amount:Number(amount),
          description:description||"Funds Transfer",
          type:"DEBIT",
          completedAt:new Date(),
          status:"COMPLETED",
          walletId:senderWallet.id
        }
      })

      // add to reciever
      await tx.wallet.update({
        where:{
          id:recievedWallet.id
        },data:{
          balance:{
            increment:Number(amount)
          }
        }
      })
      let reciever = await tx.transaction.create({
        data:{
          referenceId:recievedWallet.id,
          amount:Number(amount),
          description:description||"Funds Transfer",
          type:"CREDIT",
          completedAt:new Date(),
          status:"COMPLETED",
          walletId:recievedWallet.id
        }
      })
      return JSON.stringify({sender,reciever})
    })
    } catch (error) {
      return error
    }

  },

  async processShipmentTransactions(shipment:any){
      await prisma.$transaction(async (tx) => {
        // cut escrow from sellet wallet
        await tx.wallet.update({
          where: { id: shipment.seller.wallet?.id },
          data: {
            balance: {
              decrement: shipment.actualRate || shipment.expectedRate || 0,
            },
            escrowBalance: {
              decrement: shipment.actualRate || shipment.expectedRate || 0,
            },
          },
        });
        await tx.transaction.create({
          data: {
            walletId: shipment.seller.wallet?.id || "",
            amount: shipment.actualRate || shipment.expectedRate || 0,
            type: "DEBIT",
            description: `${shipment.actualRate || shipment.expectedRate || 0} Escrow cut for shipment ${shipment.id}`,
          },
        });

        // release fund to business wallet
        let businessWallet = await tx.wallet.update({
          where: { businessId: shipment.businessId || "" },
          select: {
            id: true,
          },
          data: {
            escrowBalance:{
              decrement:  (shipment.actualRate || shipment.expectedRate || 0) * 0.1, // release escrow 10% 
            },
            balance: {
              increment:
                (shipment.actualRate || shipment.expectedRate || 0) * 0.1, // 10% to business
            },
          },
        });

        await tx.transaction.create({
          data: {
            walletId: businessWallet.id,
            amount: (shipment.actualRate || shipment.expectedRate || 0) * 0.1, // 10% to business
            type: "CREDIT",
            description: `10% Credit  shipment ${shipment.id}`,
          },
        });
      });
      await financialService.settleDriverPayment(
        shipment.assignment?.driverId,
        (shipment.actualRate || shipment.expectedRate || 0) * 0.8,
      );
  },

  async cutEscrow(walletId:string,amount:number,reason:string){
     const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet || wallet.escrowBalance < Number(amount)) {
      throw new Error("Insufficient escrow balance");
    }

    const transaction = await prisma.transaction.create({
      data: {
        walletId,
        type: "COMMISSION",
        amount:Number(amount), 
        description: `Escrow cuts: ${reason}`,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    await prisma.wallet.update({
      where: { id: walletId },
      data: {
        balance:{
          decrement:Number(amount)
        },
        escrowBalance: {
          decrement: Number(amount),
        }, 
      },
    });

    return transaction;
  }
};
