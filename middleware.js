import { NextResponse } from 'next/server';

export async function middleware(request) {
  const token = request.cookies.get('auth-token')?.value;

  const isProtected = 
    request.nextUrl.pathname.startsWith('/student') ||
    request.nextUrl.pathname.startsWith('/teacher');

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/student/:path*', '/teacher/:path*'],
};