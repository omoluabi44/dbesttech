import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = [
  '/dashboard',
  '/subjects',
  '/quiz',
  '/performance',
  '/profile',
  '/past-questions',
];

const AUTH_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Try to get token from a cookie if we implement it, 
  // or we'll rely on client-side routing for localStorage.
  // Next.js middleware can't read localStorage.
  // We'll redirect if we detect they are trying to access protected routes
  // but we can't reliably know here. We will use a soft approach:
  // Let the client components handle the final redirect if localStorage is empty.
  // For now, this just passes through, but in a real app using HttpOnly cookies:
  
  const token = request.cookies.get('auth_token')?.value;

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

  // If we have a token and they visit login, send to dashboard
  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If no token and they visit protected route, send to login
  if (!token && isProtectedRoute) {
    // Note: since we use localStorage, we can't do this reliably here.
    // We'll let the client-side AuthProvider handle it.
    // Uncomment if using cookies:
    // return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
