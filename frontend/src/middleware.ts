import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Backend sets cookie as 'jwt' — must match here
  const token = request.cookies.get('jwt')?.value;

  const { pathname } = request.nextUrl;

  // Protect /admin, /teacher, /student routes
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/teacher') ||
    pathname.startsWith('/student')
  ) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // /change-password: allow only if logged in
  if (pathname === '/change-password') {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect authenticated users away from login page to admin dashboard
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/teacher/:path*',
    '/student/:path*',
    '/login',
    '/change-password'
  ],
};
