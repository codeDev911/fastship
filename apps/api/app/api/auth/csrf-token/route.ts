import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { generateCSRFToken } from '@/lib/csrf';

export async function GET(request: NextRequest) {
  try {
    // Get authentication token from cookies
       let token = request.cookies.get('auth_token')?.value|| "";
    
    // If no cookie, try Authorization header (cross-origin requests)
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }
    
    // Verify JWT token
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key'
    );
    const verified = await jwtVerify(token, secret);
    const userId = (verified.payload as any).id;

    // Generate CSRF token
    const csrfToken = await generateCSRFToken(userId);

    // Return CSRF token
    const response = NextResponse.json({
      csrfToken,
    });

    // Optionally set as cookie (can also be sent in request body)
    response.cookies.set('csrf_token', csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 900, // 15 minutes
    });

    return response;
  } catch (error) {
    console.error('[CSRF] Token generation failed:', error);
    return NextResponse.json(
      { message: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
