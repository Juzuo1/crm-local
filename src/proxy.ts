import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import env from '@/lib/env';

const secret = new TextEncoder().encode(env.JWT_SECRET);
const cookieName = env.COOKIE_NAME;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公开路由
  if (pathname === '/login' || pathname.startsWith('/api/auth') || pathname === '/api/health') {
    return NextResponse.next();
  }

  const token = request.cookies.get(cookieName)?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete(cookieName);
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
