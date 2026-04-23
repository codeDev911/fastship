import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
    let pathname = request.nextUrl.pathname;
    if (pathname.startsWith('/admin')) {
        pathname = pathname.replace('/admin', '');
        return NextResponse.redirect(pathname)
    }
    return NextResponse.next();
}