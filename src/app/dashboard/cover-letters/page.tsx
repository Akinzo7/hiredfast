"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Mail, Plus } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getCoverLetters } from "@/lib/firestore"
import { Timestamp } from "firebase/firestore"

export default function CoverLettersPage() {
  const { user } = useAuth()
  const [letters, setLetters] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!user) return
    getCoverLetters(user.uid).then((data) => {
      setLetters(data)
      setLoaded(true)
    })
  }, [user])

  const formatDate = (ts: Timestamp | undefined) =>
    ts ? ts.toDate().toLocaleDateString() : ""

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Cover Letters</h1>
        <Link href="/"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" /> New Letter
        </Link>
      </div>

      {loaded && letters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-2xl">
          <Mail className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium">No cover letters yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {letters.map((letter) => (
            <div key={letter.id}
              className="rounded-xl border bg-card p-4">
              <p className="font-medium text-sm">
                {letter.jobTitle ?? "Cover Letter"}
              </p>
              {letter.company && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {letter.company}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {letter.content?.slice(0, 100)}...
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {formatDate(letter.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
