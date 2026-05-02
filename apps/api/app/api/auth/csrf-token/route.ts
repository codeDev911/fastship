import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken } from '@/lib/csrf';

export async function GET(request: NextRequest) {
  try {
    // Get authentication token from cookies
      
    
    const csrfToken = await generateCSRFToken("random-user");

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
