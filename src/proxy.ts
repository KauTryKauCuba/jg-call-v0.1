import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const session = request.cookies.get("jg_session")?.value
  const { pathname } = request.nextUrl

  // Allow static assets, images, favicon, and the login page
  if (
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    pathname.startsWith("/icon")
  ) {
    return NextResponse.next()
  }

  // Redirect to login if session is not verified
  if (session !== "70861GA_verified") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Apply proxy to all routes except API and static assets
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
