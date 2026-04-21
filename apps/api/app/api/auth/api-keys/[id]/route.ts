import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";
import { csrfErrorResponse, validateCSRFMiddleware } from "@/lib/csrf-middleware";

/**
 * PATCH /api/auth/api-keys/[id]
 * Update API key settings (name, scope, rate limit)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = request.nextUrl.searchParams.get("userId") || "";

    // Check if API key belongs to user
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: params.id },
    });

    if (!apiKey) {
      return NextResponse.json(
        { message: "API key not found" },
        { status: 404 },
      );
    }

    if (apiKey.userId !== userId) {
      return NextResponse.json(
        { message: "Unauthorized: API key does not belong to you" },
        { status: 403 },
      );
    }

    // Parse request body
    const { name, scope, rateLimit } = await request.json();

    // Update API key
    const updated = await prisma.apiKey.update({
      where: { id: (await params).id },
      data: {
        ...(name && { name }),
        ...(scope && { scope }),
        ...(rateLimit && { rateLimit }),
      },
      select: {
        id: true,
        name: true,
        prefix: true,
        scope: true,
        rateLimit: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: "API key updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("[API Keys] PATCH error:", error);
    return NextResponse.json(
      { message: "Failed to update API key" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/auth/api-keys/[id]
 * Revoke/delete an API key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Validate CSRF token
    if (!(await validateCSRFMiddleware(request))) {
      return csrfErrorResponse();
    }

    // Verify authentication
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "your-secret-key",
    );
    const verified = await jwtVerify(token, secret);
    const userId = (verified.payload as any).id;

    // Check if API key belongs to user
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: (await params).id },
    });

    if (!apiKey) {
      return NextResponse.json(
        { message: "API key not found" },
        { status: 404 },
      );
    }

    if (apiKey.userId !== userId) {
      return NextResponse.json(
        { message: "Unauthorized: API key does not belong to you" },
        { status: 403 },
      );
    }

    // Mark as revoked
    const revoked = await prisma.apiKey.update({
      where: { id: (await params).id },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        message: "API key revoked successfully",
        data: {
          id: revoked.id,
          prefix: revoked.prefix,
          revokedAt: revoked.revokedAt,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[API Keys] DELETE error:", error);
    return NextResponse.json(
      { message: "Failed to revoke API key" },
      { status: 500 },
    );
  }
}
