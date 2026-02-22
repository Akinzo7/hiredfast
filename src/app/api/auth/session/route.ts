import { adminAuth } from "@/lib/firebase-admin"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// POST — create session cookie after login
export async function POST(req: Request) {
  try {
    const { idToken } = await req.json()

    // Verify the ID token
    await adminAuth.verifyIdToken(idToken)

    // Create a session cookie (expires in 7 days)
    const expiresIn = 60 * 60 * 24 * 7 * 1000 // 7 days in ms
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    })

    const cookieStore = await cookies()
    cookieStore.set("firebase-session", sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    })

    return NextResponse.json({ status: "success" })
  } catch (error) {
    console.error("Session creation error:", error)
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 401 }
    )
  }
}

// DELETE — clear session cookie on sign out
export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete("firebase-session")
  return NextResponse.json({ status: "success" })
}
