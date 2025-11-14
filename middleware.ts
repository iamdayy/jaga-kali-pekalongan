import { type NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/admin")) {
    const sessionToken = request.cookies.get("admin_session_token")?.value

    if (!sessionToken && !pathname.startsWith("/admin/login")) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
