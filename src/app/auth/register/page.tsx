"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Box, Loader2, Mail } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function RegisterPage() {
  const router = useRouter()
  const { signInWithGoogle, registerWithEmail } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loadingProvider, setLoadingProvider] = useState<"google" | "email" | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleSignIn = async () => {
    setLoadingProvider("google")
    setError(null)
    try {
      await signInWithGoogle()
      router.push("/dashboard")
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        setError("Failed to sign in with Google. Please try again.")
      }
    } finally {
      setLoadingProvider(null)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }

    setLoadingProvider("email")
    try {
      await registerWithEmail(email, password)
      router.push("/dashboard")
    } catch (err: any) {
      const code = err?.code
      if (code === "auth/email-already-in-use") {
        setError("An account with this email already exists.")
      } else if (code === "auth/weak-password") {
        setError("Password is too weak. Use at least 8 characters.")
      } else if (code === "auth/invalid-email") {
        setError("Please enter a valid email address.")
      } else {
        setError(err.message ?? "Registration failed. Please try again.")
      }
    } finally {
      setLoadingProvider(null)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Box className="h-7 w-7 text-foreground" />
        <span className="text-2xl font-bold text-foreground">
          HiredFast
        </span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-[420px] bg-card rounded-2xl border border-border shadow-sm p-8">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-card-foreground">
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Get started with your AI-powered career toolkit
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 text-center dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Email / Password form */}
        <form onSubmit={handleRegister} className="space-y-3 mb-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="password"
            placeholder="Password (min. 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <button
            type="submit"
            disabled={loadingProvider !== null}
            className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors text-sm font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loadingProvider === "email" ? (
              <Loader2 className="h-5 w-5 animate-spin text-white/70" />
            ) : (
              <Mail className="h-5 w-5 shrink-0" />
            )}
            Create Account
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loadingProvider !== null}
          className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-xl border border-border bg-card hover:bg-accent transition-colors text-sm font-medium text-card-foreground shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loadingProvider === "google" ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          ) : (
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93 -6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          Continue with Google
        </button>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-blue-500 hover:text-blue-400 transition-colors"
          >
            Sign in
          </Link>
        </p>

        <p className="text-center text-xs text-muted-foreground mt-4">
          By continuing, you agree to our{" "}
          <span className="underline cursor-pointer">
            Terms of Service
          </span>
          {" "}and{" "}
          <span className="underline cursor-pointer">
            Privacy Policy
          </span>
        </p>
      </div>

      <Link
        href="/"
        className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back to Home
      </Link>
    </div>
  )
}
