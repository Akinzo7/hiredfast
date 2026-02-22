"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FileText, Mic, Mail, ArrowRight } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getResumes, getInterviews, getCoverLetters } from "@/lib/firestore"
import { cn } from "@/lib/utils"
import { Timestamp } from "firebase/firestore"

export default function DashboardPage() {
  const { user } = useAuth()
  const [counts, setCounts] = useState({ 
    resumes: 0, interviews: 0, letters: 0 
  })
  const [recentInterviews, setRecentInterviews] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!user) return
    Promise.all([
      getResumes(user.uid),
      getInterviews(user.uid),
      getCoverLetters(user.uid),
    ]).then(([resumes, interviews, letters]) => {
      setCounts({
        resumes: resumes.length,
        interviews: interviews.length,
        letters: letters.length,
      })
      setRecentInterviews(interviews.slice(0, 3))
      setLoaded(true)
    })
  }, [user])

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? "Good morning" :
    hour < 17 ? "Good afternoon" : "Good evening"
  const firstName = user?.displayName?.split(" ")[0] ?? "there"

  const formatDate = (ts: Timestamp | undefined) => {
    if (!ts) return ""
    return ts.toDate().toLocaleDateString()
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          {greeting}, {firstName}! 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long", year: "numeric",
            month: "long", day: "numeric",
          })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Resumes Created", value: counts.resumes,
            icon: FileText, color: "text-blue-500" },
          { label: "Interviews Practiced", value: counts.interviews,
            icon: Mic, color: "text-orange-500" },
          { label: "Cover Letters", value: counts.letters,
            icon: Mail, color: "text-green-500" },
        ].map((stat) => (
          <div key={stat.label}
            className="rounded-xl border bg-card p-4">
            <stat.icon className={cn("h-5 w-5 mb-2", stat.color)} />
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-base font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Build Resume", href: "/",
              description: "Create a new tailored resume",
              bg: "bg-blue-600" },
            { label: "Practice Interview", href: "/",
              description: "Simulate a mock interview",
              bg: "bg-orange-600" },
            { label: "Generate Cover Letter", href: "/",
              description: "Write a targeted cover letter",
              bg: "bg-green-600" },
          ].map((action) => (
            <Link key={action.label} href={action.href}
              className="rounded-xl border bg-card p-4 hover:bg-accent transition-colors">
              <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center mb-3",
                action.bg
              )}>
                <ArrowRight className="h-4 w-4 text-white" />
              </div>
              <p className="font-medium text-sm">{action.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Interviews */}
      {recentInterviews.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-4">
            Recent Interviews
          </h2>
          <div className="space-y-2">
            {recentInterviews.map((interview) => (
              <div key={interview.id}
                className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
                <div>
                  <p className="text-sm font-medium">
                    {interview.jobTitle ?? "Interview"}
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
        </div>
      )}
    </div>
  )
}
