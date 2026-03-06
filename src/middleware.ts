import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify, importX509, decodeProtectedHeader } from "jose"

const PROTECTED_ROUTES = [
  "/dashboard",
  "/resume/editor",
  "/cover-letter/editor",
  "/interview/setup",
  "/interview/session",
  "/interview/results",
]

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

// Cache the fetching of the x509 certs
let cachedCerts: Record<string, string> | null = null
let certsExpiration = 0

async function getFirebaseSessionCerts() {
  if (cachedCerts && Date.now() < certsExpiration) {
    return cachedCerts
  }
  const response = await fetch("https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys")
  const certs = await response.json()
  
  // Cache them for 6 hours
  cachedCerts = certs
  certsExpiration = Date.now() + 6 * 60 * 60 * 1000
  return certs
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  )

  if (!isProtected) return NextResponse.next()

  const sessionCookie = request.cookies.get("firebase-session")?.value

  if (!sessionCookie) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    const header = decodeProtectedHeader(sessionCookie)
    const kid = header.kid

    if (!kid) throw new Error("No key ID found in session cookie")

    const certs = await getFirebaseSessionCerts()
    const cert = certs[kid]

    if (!cert) throw new Error("Public key not found")

    const publicKey = await importX509(cert, "RS256")

    await jwtVerify(sessionCookie, publicKey, {
      audience: FIREBASE_PROJECT_ID,
      issuer: `https://session.firebase.google.com/${FIREBASE_PROJECT_ID}`,
    })
    
    return NextResponse.next()
  } catch (err) {
    console.error("Middleware JWT verification failed:", err)
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    const redirectResponse = NextResponse.redirect(loginUrl)
    redirectResponse.cookies.delete("firebase-session")
    return redirectResponse
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
}
