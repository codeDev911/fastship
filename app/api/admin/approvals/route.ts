import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    let where: any = {};

    if (type !== 'all') {
      where.applicationType = type;
    }

    const approvals = await prisma.approval.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        licenseNumber: true,
        vehicleType: true,
        companyName: true,
        businessType: true,
        operatingRegion: true,
        applicationType: true,
        status: true,
        submittedAt: true,
      },
      orderBy: { submittedAt: 'desc' },
      take: 100,
    });

    const formattedApprovals = approvals.map(approval => ({
      id: approval.id,
      name: approval.name,
      email: approval.email,
      phone: approval.phone,
      licenseNumber: approval.licenseNumber,
      vehicleType: approval.vehicleType,
      companyName: approval.companyName,
      businessType: approval.businessType,
      operatingRegion: approval.operatingRegion,
      applicationType: approval.applicationType,
      status: approval.status,
      submittedAt: approval.submittedAt,
    }));

    return NextResponse.json({ data: formattedApprovals });
  } catch (error) {
    console.error('Error fetching approvals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approvals' },
      { status: 500 }
    );
  }
}
