import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendEmail, getApplicationSubmittedEmail } from '@/lib/email';

const businessApplicationSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(10),
  companyName: z.string().min(2),
  businessType: z.string().min(2),
  operatingRegion: z.string().min(2),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const application = businessApplicationSchema.parse(body);

    // Check if user already exists with this email/phone
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: application.email }, { phone: application.phone }],
      },
    });

    if (existingUser) {
        console.log("yes");
      return NextResponse.json(
        { error: 'Email or phone already registered' },
        { status: 400 }
      );
      
    }

    // Check if there's already an application for this email
    const existingApplication = await prisma.approval.findFirst({
      where: {
        email: application.email,
        applicationType: 'BUSINESS',
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
        name: application.companyName,
        applicationType: 'BUSINESS',
        companyName: application.companyName,
        businessType: application.businessType,
        operatingRegion: application.operatingRegion,
        status: 'PENDING',
      },
    });

    // Send confirmation email
    const emailContent = getApplicationSubmittedEmail(application.companyName, 'BUSINESS', approval.id, application.email);
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
    console.error('Error submitting business application:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}
