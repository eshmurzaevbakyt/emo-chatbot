import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const token = request.cookies.get('sb-access-token')?.value ||
    request.cookies.get(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`)?.value;

  const isAuthPage = request.nextUrl.pathname === '/';
  const isProtected = request.nextUrl.pathname.startsWith('/student') ||
    request.nextUrl.pathname.startsWith('/teacher');

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/student/:path*', '/teacher/:path*'],
};