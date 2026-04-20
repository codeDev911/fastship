import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const completeRegistrationSchema = z.object({
  approvalId: z.string(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { approvalId, password } = completeRegistrationSchema.parse(body);

    // Get the approval
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
    });

    if (!approval) {
      return NextResponse.json(
        { error: 'Approval not found' },
        { status: 404 }
      );
    }

    if (approval.applicationType !== 'DRIVER') {
      return NextResponse.json(
        { error: 'Invalid approval type' },
        { status: 400 }
      );
    }

    if (approval.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Application not approved yet. Status: ' + approval.status },
        { status: 400 }
      );
    }

    if (approval.driverId) {
      return NextResponse.json(
        { error: 'Application already completed' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: approval.email,
        phone: approval.phone,
        name: approval.name,
        password: hashedPassword,
        role: 'DRIVER',
        isVerified: true, // Already approved
      },
    });

    // Create driver record
    const driver = await prisma.driver.create({
      data: {
        userId: user.id,
        licenseNumber: approval.licenseNumber!,
        licenseExpiry: approval.licenseExpiry!,
        vehicleType: approval.vehicleType!,
        vehicleNumber: approval.vehicleNumber!,
        isVerified: true, // Already approved
      },
    });

    // Create wallet for driver
    await prisma.wallet.create({
      data: {
        driverId: driver.id,
      },
    });

    // Update approval to link it to the driver
    await prisma.approval.update({
      where: { id: approvalId },
      data: {
        driverId: driver.id,
      },
    });

    // Send registration complete email
    // const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`;
    // const emailContent = getRegistrationCompleteEmail(approval.name, 'DRIVER', loginUrl);
    // await sendEmail({
    //   to: approval.email,
    //   ...emailContent,
    // });

    return NextResponse.json(
      {
        message: 'Driver account created successfully!',
        driverId: driver.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error completing driver registration:', error);
    return NextResponse.json(
      { error: 'Failed to complete registration' },
      { status: 500 }
    );
  }
}
