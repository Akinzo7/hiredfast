"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Mic, Plus } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getInterviews } from "@/lib/firestore"
import { cn } from "@/lib/utils"
import { Timestamp } from "firebase/firestore"

export default function InterviewsPage() {
  const { user } = useAuth()
  const [interviews, setInterviews] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!user) return
    getInterviews(user.uid).then((data) => {
      setInterviews(data)
      setLoaded(true)
    })
  }, [user])

  const formatDate = (ts: Timestamp | undefined) =>
    ts ? ts.toDate().toLocaleDateString() : ""

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Interview History</h1>
        <Link href="/"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" /> Practice Now
        </Link>
      </div>

      {loaded && interviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-2xl">
          <Mic className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium">No interviews yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Practice your first mock interview
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {interviews.map((interview) => (
            <div key={interview.id}
              className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
              <div>
                <p className="text-sm font-medium">
                  {interview.jobTitle ?? "Mock Interview"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {interview.company 
                    ? `${interview.company} • ` : ""}
                  {formatDate(interview.createdAt)}
                </p>
              </div>
              {interview.score != null && (
                <span className={cn(
                  "text-sm font-bold px-2.5 py-1 rounded-full",
                  interview.score >= 80
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : interview.score >= 60
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                )}>
                  {interview.score}/100
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
