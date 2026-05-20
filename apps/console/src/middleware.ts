import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_ROUTES = new Set(["/sign-in", "/sign-up", "/pending-approval"])

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const hasAccessToken = request.cookies.has("eudora_access_token")

  if (pathname.startsWith("/auth/")) {
    return NextResponse.redirect(new URL(pathname.replace(/^\/auth/, ""), request.url))
  }

  if (!hasAccessToken && isDashboardRoute(pathname)) {
    const signInUrl = new URL("/sign-in", request.url)
    signInUrl.searchParams.set("next", pathname)

    return NextResponse.redirect(signInUrl)
  }

  if (hasAccessToken && AUTH_ROUTES.has(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    // |sitemap.xml|robots.txt
  ],
}

function isDashboardRoute(pathname: string): boolean {
  return !AUTH_ROUTES.has(pathname) && !pathname.startsWith("/errors") && pathname !== "/" && pathname !== "/landing"
}
