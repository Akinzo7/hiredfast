import { NextResponse } from "next/server"
import { adminAuth } from "@/lib/firebase-admin"

export async function GET(req: Request) {
  const internalSecret = req.headers.get("x-internal-secret")
  const expectedSecret = process.env.MIDDLEWARE_SECRET

  if (!internalSecret || !expectedSecret || internalSecret !== expectedSecret) {
    return NextResponse.json({ valid: false }, { status: 401 })
  }

  const sessionCookie = req.headers.get("x-session-cookie")
  if (!sessionCookie || sessionCookie.trim() === "") {
    return NextResponse.json({ valid: false }, { status: 400 })
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true)
    return NextResponse.json({ valid: true, uid: decodedClaims.uid })
  } catch {
    return NextResponse.json({ valid: false }, { status: 200 })
  }
}
