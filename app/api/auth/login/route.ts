import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { SignJWT } from "jose";

export async function POST(request: NextRequest) {
  try {
    const { email, password, role } = await request.json();

    // Validate input
    if (!email || !password || !role) {
      return NextResponse.json(
        { message: "Email, password, and role are required" },
        { status: 400 },
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        driver: true,
        seller: true,
        business: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Verify user role matches requested role
    if (user.role !== role.toUpperCase()) {
      return NextResponse.json(
        { message: "Invalid role for this account" },
        { status: 401 },
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "your-secret-key",
    );

    // Create JWT token
    const token = await new SignJWT({
      id: user.id,
      jobId: user.driver?.id || user.seller?.id || user.business?.id || null,
      email: user.email,
      role: role.toUpperCase(),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24m")
      .sign(secret);

    // Set secure HTTP-only cookie
    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          jobId:
            user.driver?.id || user.seller?.id || user.business?.id || null,
          email: user.email,
          name: user.name,
          phone: user.phone || undefined,
          role: role.toUpperCase(),
          createdAt: user.createdAt.toISOString(),
        },
        token,
      },
      { status: 200 },
    );

    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    response.cookies.set({
      name: "user_role",
      value: role.toUpperCase(),
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    });
    console.log("login success");
    
    return response;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[v0] Login error:", errorMessage);
    console.error(
      "[v0] Error stack:",
      error instanceof Error ? error.stack : "No stack",
    );
    return NextResponse.json(
      { message: `Login failed: ${errorMessage}` },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ yes: true });
}
