import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Check if user is authenticated
  const isAuthenticated = !!token;

  // If user is authenticated, prevent access to login/register routes
  if (isAuthenticated && (pathname.startsWith('/account'))) {
    return NextResponse.redirect(new URL('/', req.url)); // Redirect to home if authenticated
  }

  // If user is unauthenticated and trying to access a protected route, redirect to login
  if (!isAuthenticated && pathname.startsWith('/app')) {
    return NextResponse.redirect(new URL('/account/login', req.url));
  }

  // Allow access to other routes
  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/account/:path*'], // Apply middleware to specific routes
};
