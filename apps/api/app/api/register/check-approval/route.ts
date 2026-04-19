import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const type = searchParams.get('type'); // DRIVER or BUSINESS

    if (!email || !type) {
      return NextResponse.json(
        { error: 'Email and type are required' },
        { status: 400 }
      );
    }

    const approval = await prisma.approval.findFirst({
      where: {
        email,
        applicationType: type as any,
      },
      select: {
        id: true,
        status: true,
        applicationType: true,
        submittedAt: true,
        approvedAt: true,
        rejectionReason: true,
        name: true,
      },
    });

    if (!approval) {
      return NextResponse.json(
        { status: 'NOT_FOUND', message: 'No application found for this email' },
        { status: 404 }
      );
    }

    if (approval.status === 'APPROVED') {
      return NextResponse.json({
        status: 'APPROVED',
        message: 'Your application has been approved! You can now complete your registration.',
        approvalId: approval.id,
        data: approval,
      });
    } else if (approval.status === 'REJECTED') {
      return NextResponse.json({
        status: 'REJECTED',
        message: 'Your application has been rejected.',
        reason: approval.rejectionReason,
        data: approval,
      });
    } else {
      return NextResponse.json({
        status: 'PENDING',
        message: 'Your application is being reviewed. Please check back soon.',
        submittedAt: approval.submittedAt,
        data: approval,
      });
    }
  } catch (error) {
    console.error('Error checking approval status:', error);
    return NextResponse.json(
      { error: 'Failed to check approval status' },
      { status: 500 }
    );
  }
}
