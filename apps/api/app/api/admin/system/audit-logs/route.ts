import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Fetch recent approvals (act as audit logs)
    const approvals = await prisma.approval.findMany({
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        applicationType: true,
        status: true,
        submittedAt: true,
        updatedAt: true,
        rejectionReason: true,
      },
    });

    // Transform approvals into audit log format
    const auditLogs = approvals.map((approval) => ({
      id: approval.id,
      action: approval.status === 'APPROVED' ? 'Approved' : approval.status === 'REJECTED' ? 'Rejected' : 'Submitted',
      type: approval.status === 'APPROVED' ? 'APPROVAL' : approval.status === 'REJECTED' ? 'REJECTION' : 'USER_CREATED',
      targetId: approval.id,
      targetType: approval.applicationType,
      adminEmail: 'system@fastship.com', // System action for submissions
      details: approval.rejectionReason || `${approval.applicationType} application for ${approval.email}`,
      timestamp: approval.status === 'APPROVED' || approval.status === 'REJECTED' ? approval.updatedAt : approval.submittedAt,
    }));

    return NextResponse.json(
      {
        logs: auditLogs,
        count: auditLogs.length,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch audit logs',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
