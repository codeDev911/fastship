import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendEmail, getApplicationSubmittedEmail } from '@/lib/email';

const driverApplicationSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(10),
  name: z.string().min(2),
  licenseNumber: z.string().min(3),
  licenseExpiry: z.string(), // ISO date
  vehicleType: z.string().min(2),
  vehicleNumber: z.string().min(2),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const application = driverApplicationSchema.parse(body);

    // Check if user already exists with this email/phone
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: application.email }, { phone: application.phone }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email or phone already registered' },
        { status: 400 }
      );
    }

    // Check if there's already an application for this email
    const existingApplication = await prisma.approval.findFirst({
      where: {
        email: application.email,
        applicationType: 'DRIVER',
        status: 'PENDING',
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: 'Application already submitted for this email. Please wait for admin approval.' },
        { status: 400 }
      );
    }

    // Create application
    const approval = await prisma.approval.create({
      data: {
        email: application.email,
        phone: application.phone,
        name: application.name,
        applicationType: 'DRIVER',
        licenseNumber: application.licenseNumber,
        licenseExpiry: new Date(application.licenseExpiry),
        vehicleType: application.vehicleType,
        vehicleNumber: application.vehicleNumber,
        status: 'PENDING',
      },
    });

    // Send confirmation email
    const emailContent = getApplicationSubmittedEmail(application.name, 'DRIVER', approval.id, application.email);
    await sendEmail({
      to: application.email,
      ...emailContent,
    });

    return NextResponse.json(
      {
        message: 'Application submitted successfully! Please check your email for details.',
        approval: {
          id: approval.id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting driver application:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}
