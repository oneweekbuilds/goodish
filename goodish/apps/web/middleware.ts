import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const BASIC_AUTH_USER = process.env.BASIC_AUTH_USER || 'goodish'
const BASIC_AUTH_PASS = process.env.BASIC_AUTH_PASS || 'preview'

export const config = {
  matcher: [
    // Protect everything except Next.js internals and common public files
    '/((?!_next/|favicon.ico|robots.txt|sitemap.xml|og-image.jpg).*)',
  ],
}

export function middleware(request: NextRequest) {
  // Skip auth in development
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next()
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    const [scheme, encoded] = authHeader.split(' ')
    if (scheme === 'Basic' && encoded) {
      try {
        const decoded = atob(encoded)
        const [user, pass] = decoded.split(':')
        if (user === BASIC_AUTH_USER && pass === BASIC_AUTH_PASS) {
          return NextResponse.next()
        }
      } catch {
        // fall through to unauthorized response
      }
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Protected"' },
  })
}


