"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react"
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import {
  auth,
  db,
  googleProvider,
  signInWithEmail as firebaseSignInWithEmail,
  registerWithEmail as firebaseRegisterWithEmail,
  resetPassword as firebaseResetPassword,
} from "@/lib/firebase"

const initializedUids = new Set<string>()

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  registerWithEmail: (email: string, password: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)

      // Create user doc in Firestore on first login
      if (firebaseUser) {
        if (!initializedUids.has(firebaseUser.uid)) {
          const userRef = doc(db, "users", firebaseUser.uid)
          const snap = await getDoc(userRef)
          if (!snap.exists()) {
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName,
              email: firebaseUser.email,
              image: firebaseUser.photoURL,
              plan: "free",
              createdAt: serverTimestamp(),
            })
          }
          initializedUids.add(firebaseUser.uid)
        }
      }
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider)
    const idToken = await result.user.getIdToken()
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    })
  }

  const handleSignInWithEmail = async (email: string, password: string) => {
    await firebaseSignInWithEmail(email, password)
    const idToken = await auth.currentUser!.getIdToken()
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    })
  }

  const handleRegisterWithEmail = async (email: string, password: string) => {
    await firebaseRegisterWithEmail(email, password)
    const idToken = await auth.currentUser!.getIdToken()
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    })
  }

  const handleResetPassword = async (email: string) => {
    await firebaseResetPassword(email)
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
    await fetch("/api/auth/session", { method: "DELETE" })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithEmail: handleSignInWithEmail,
        registerWithEmail: handleRegisterWithEmail,
        resetPassword: handleResetPassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
