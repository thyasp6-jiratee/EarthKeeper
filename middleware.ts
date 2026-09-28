// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'rahasia123'
);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Biarkan akses ke asset statis & API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Helper: Semua role diarahkan ke /dashboard
  // (karena dashboard udah otomatis beda tampilan per role)
  const getRoleDashboard = (_role: string) => {
    return '/dashboard';
  };

  // 2. Akses Root Path ('/')
  if (pathname === '/') {
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return NextResponse.redirect(
          new URL(getRoleDashboard(payload.role as string), request.url)
        );
      } catch {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Public Routes (/login, /register)
  const publicRoutes = ['/login', '/register', '/forgot-password'];
  if (publicRoutes.includes(pathname)) {
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return NextResponse.redirect(
          new URL(getRoleDashboard(payload.role as string), request.url)
        );
      } catch {
        return NextResponse.next();
      }
    }
    return NextResponse.next();
  }

  // 4. Proteksi Token untuk Protected Routes
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    // Role-based Access Control (RBAC)
    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (pathname.startsWith('/petugas') && role !== 'PETUGAS' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (pathname.startsWith('/masyarakat') && role !== 'MASYARAKAT' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    // Token invalid / expired
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }
}

export const config = {
  matcher: [
    '/',
    '/dashboard',
    '/dashboard/:path*',
    '/admin/:path*',
    '/petugas/:path*',
    '/masyarakat/:path*',
    '/login',
    '/register',
    '/forgot-password',
  ],
};