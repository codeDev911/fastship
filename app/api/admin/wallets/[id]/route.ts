import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { reconciliationService } from '@/lib/services/financial.engine';

const adjustWalletSchema = z.object({
  action: z.enum(['add', 'deduct']),
  amount: z.number().positive(),
  reason: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id  = (await params).id;

    const wallet = await prisma.wallet.findUnique({
      where: { id },
      select: {
        id: true,
        balance: true,
        escrowBalance: true,
        totalEarnings: true,
        totalWithdrawals: true,
        createdAt: true,
        lastUpdated: true,
        seller: {
          select: {
            id: true,
            companyName: true,
            user: { select: { id: true, email: true, phone: true, name: true } },
          },
        },
        driver: {
          select: {
            id: true,
            user: { select: { id: true, email: true, phone: true, name: true } },
            totalDeliveries: true,
            totalEarnings: true,
          },
        },
        business: {
          select: {
            id: true,
            companyName: true,
            user: { select: { id: true, email: true, phone: true } },
          },
        },
        transactions: {
          select: {
            id: true,
            type: true,
            amount: true,
            description: true,
            status: true,
            createdAt: true,
            completedAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        ledgerEntries: {
          select: {
            id: true,
            amount: true,
            type: true,
            category: true,
            balanceAfter: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        reconciliationLogs: {
          select: {
            id: true,
            expected: true,
            actual: true,
            difference: true,
            status: true,
            message: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    let name = 'Unknown';
    let entityType = '';

    if (wallet.seller) {
      name = wallet.seller.companyName;
      entityType = 'Seller';
    } else if (wallet.driver) {
      name = wallet.driver.user.name;
      entityType = 'Driver';
    } else if (wallet.business) {
      name = wallet.business.companyName;
      entityType = 'Business';
    }

    return NextResponse.json({
      data: {
        ...wallet,
        name,
        entityType,
        available: wallet.balance - wallet.escrowBalance,
      },
    });
  } catch (error) {
    console.error('Error fetching wallet details:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet details' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const walletId = (await params).id;

    // Check if it's a reconciliation request
    if (body.action === 'reconcile') {
      const result = await reconciliationService.reconcileWallet(walletId);
      return NextResponse.json({ data: result });
    }

    // Standard adjustment operations
    const { action, amount, reason } = adjustWalletSchema.parse(body);

    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    const newBalance = action === 'add' ? wallet.balance + amount : wallet.balance - amount;

    if (newBalance < 0) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    const updatedWallet = await prisma.wallet.update({
      where: { id: walletId },
      data: {
        balance: newBalance,
        totalWithdrawals: action === 'deduct' ? wallet.totalWithdrawals + amount : wallet.totalWithdrawals,
      },
    });

    return NextResponse.json({ data: updatedWallet });
  } catch (error) {
    console.error('Error adjusting wallet:', error);
    return NextResponse.json({ error: 'Failed to adjust wallet' }, { status: 500 });
  }
}
