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
      businessName,
      businessType,
      operationCity,
      operationArea,
    } = await request.json();

    // Validate input
    if (!email || !password || !name || !phone || !businessName || !businessType || !operationCity) {
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
        role: 'BUSINESS',
        isActive: true,
      },
    });

    // Create business linked to user
    const business = await prisma.business.create({
      data: {
        userId: user.id,
        companyName: businessName,
        businessType,
        operatingRegion: operationCity,
        commissionRate: 10, // 10% default commission
        isActive: true,
      },
    });

    // Create wallet for business
    await prisma.wallet.create({
      data: {
        businessId: business.id,
        balance: 0,
        escrowBalance: 0,
      },
    });

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: 'BUSINESS',
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
          role: 'BUSINESS',
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
      value: 'BUSINESS',
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
