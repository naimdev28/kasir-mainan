import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('token')?.value;
  let user = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
      user = payload;
    } catch {}
  }
  if (!user) return NextResponse.redirect(new URL('/login', req.url));
  if (pathname.startsWith('/admin') && user.role !== 'admin')
    return NextResponse.redirect(new URL('/kasir', req.url));
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*', '/kasir/:path*'] };
