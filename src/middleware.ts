import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PROTECTED_ROUTES = [
  "/dashboard",
  "/resume/editor",
  "/interview/setup",
  "/interview/session",
  "/interview/results",
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_ROUTES.some(
    (route) =>
      pathname === route || pathname.startsWith(route + "/")
  )

  if (!isProtected) return NextResponse.next()

  // Check for Firebase session cookie
  const session = request.cookies.get("firebase-session")?.value

  if (!session) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
}
