import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Temporary pass-through to unblock production.
// Original file backed up as middleware.backup.ts
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protect everything except Next.js internals and common public files
    '/((?!_next/|favicon.ico|robots.txt|sitemap.xml|og-image.jpg).*)',
  ],
}