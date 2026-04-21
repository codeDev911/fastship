import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Try to get token from cookie first (same-origin requests)
    let token = request.cookies.get('auth_token')?.value;
    
    // If no cookie, try Authorization header (cross-origin requests)
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }
    

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as any;

    // Fetch user from User model
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        driver: true,
        seller: true,
        business: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: decoded.role, // Use role from decoded token instead of cookie
      createdAt: user.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('[v0] Auth me error:', error);
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: 401 }
    );
  }
}