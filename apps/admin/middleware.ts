import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
    const { nextUrl } = request;
    const pathname = nextUrl.pathname;

    if (pathname.startsWith('/admin')) {
        // 1. Clone the existing URL to maintain the base (hostname/protocol)
        const url = nextUrl.clone();
        
        // 2. Update the pathname (stripping '/admin')
        url.pathname = pathname.replace('/admin', '');
        
        // 3. Redirect using the full URL object
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}