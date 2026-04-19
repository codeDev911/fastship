import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const {
      email,
      password,
      name,
      phone,
      licenseNumber,
      vehicleType,
      vehicleNumber,
    } = await request.json();

    // Validate input
    if (!email || !password || !name || !phone || !licenseNumber || !vehicleType || !vehicleNumber) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user first
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        name,
        password: passwordHash,
        role: 'DRIVER',
        isActive: true,
      },
    });

    // Create driver linked to user
    const driver = await prisma.driver.create({
      data: {
        userId: user.id,
        licenseNumber,
        vehicleType,
        vehicleNumber,
        licenseExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 5)), // 5 years validity
        isActive: true,
        totalDeliveries: 0,
        totalEarnings: 0,
      },
    });

    // Create wallet for driver
    await prisma.wallet.create({
      data: {
        driverId: driver.id,
        balance: 0,
        escrowBalance: 0,
      },
    });

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: 'DRIVER',
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Set secure HTTP-only cookie
    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: 'DRIVER',
          createdAt: user.createdAt.toISOString(),
        },
        token,
      },
      { status: 201 }
    );

    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    });

    response.cookies.set({
      name: 'user_role',
      value: 'DRIVER',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[v0] Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
