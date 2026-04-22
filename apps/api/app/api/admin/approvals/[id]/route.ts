import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendEmail, getApplicationApprovedEmail, getApplicationRejectedEmail } from '@/lib/email';
//// update now
const updateApprovalSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']).optional(),
  rejectionReason: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, rejectionReason } = updateApprovalSchema.parse(body);

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const approval = await prisma.approval.findUnique({
      where: { id: (await params).id },
      include: { driver: true, business: true },
    });

    if (!approval) {
      return NextResponse.json(
        { error: 'Approval not found' },
        { status: 404 }
      );
    }

    const updatedApproval = await prisma.approval.update({
      where: { id: (await params).id },
      data: {
        status,
        approvedAt: status === 'APPROVED' ? new Date() : undefined,
        rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
        updatedAt: new Date(),
      },
    });

    // If approved, send notification email
    if (status === 'APPROVED') {
      console.log(`✅ APPROVED: ${approval.applicationType} application for ${approval.email}`);
      
      // Generate completion URL
      const completionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register/${
        approval.applicationType === 'DRIVER' ? 'driver' : 'business'
      }/complete?approvalId=${approval.id}`;

      // Send approval email
      const emailContent = await getApplicationApprovedEmail(
        approval.name,
        approval.applicationType,
        approval.id,
        completionUrl
      );
      await  sendEmail({
        to: approval.email,
        ...emailContent,
      });
      
      // If already has associated driver/business, mark as verified
      if (approval.driverId) {
        await prisma.driver.update({
          where: { id: approval.driverId },
          data: { isVerified: true },
        });
      }
      if (approval.businessId) {
        await prisma.business.update({
          where: { id: approval.businessId },
          data: { isActive: true },
        });
      }
    } else if (status === 'REJECTED') {
      console.log(`❌ REJECTED: ${approval.applicationType} application for ${approval.email}`);
      console.log(`Reason: ${rejectionReason || 'No reason provided'}`);

      // Send rejection email
      const emailContent = await getApplicationRejectedEmail(
        approval.name,
        approval.applicationType,
        rejectionReason || 'Your application does not meet our current requirements.'
      );
      await sendEmail({
        to: approval.email,
        ...emailContent,
      });
    }

    return NextResponse.json({ data: updatedApproval });
  } catch (error) {
    console.error('Error updating approval:', error);
    return NextResponse.json(
      { error: 'Failed to update approval' },
      { status: 500 }
    );
  }
}
