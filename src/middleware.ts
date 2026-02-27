import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PROTECTED_ROUTES = [
  "/dashboard",
  "/resume/editor",
  "/interview/setup",
  "/interview/session",
  "/interview/results",
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_ROUTES.some(
    (route) =>
      pathname === route || pathname.startsWith(route + "/")
  )

  if (!isProtected) return NextResponse.next()

  const sessionCookie = request.cookies.get("firebase-session")?.value
  if (!sessionCookie) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const verifyUrl = new URL("/api/auth/verify", request.url).toString()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(verifyUrl, {
      method: "GET",
      headers: {
        "x-session-cookie": sessionCookie,
        "x-internal-secret": process.env.MIDDLEWARE_SECRET ?? "",
      },
      signal: controller.signal,
    })

    const data = await response.json()
    if (data.valid === true) {
      return NextResponse.next()
    }

    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    const redirectResponse = NextResponse.redirect(loginUrl)
    redirectResponse.cookies.delete("firebase-session")
    return redirectResponse
  } catch {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    const redirectResponse = NextResponse.redirect(loginUrl)
    redirectResponse.cookies.delete("firebase-session")
    return redirectResponse
  } finally {
    clearTimeout(timeoutId)
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
}
