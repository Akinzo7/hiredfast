"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useRef } from "react"
import { CheckCircle2, Lightbulb, Sparkles, RotateCcw, Home } from "lucide-react"
import { useInterview, PerformanceData } from "@/hooks/use-interview"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { saveInterview } from "@/lib/firestore"


function ScoreCircle({ score }: { score: number }) {
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444"

  return (
    <div className="relative flex items-center justify-center">
      <svg width="160" height="160" className="-rotate-90">
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="#1e293b"
          strokeWidth="8"
          fill="transparent"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke={color}
          strokeWidth="8"
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold text-white">{score}</span>
        <span className="text-sm text-slate-400">/100</span>
      </div>
    </div>
  )
}

export default function InterviewResultsPage() {
  const router = useRouter()
  const { performanceData: hookData, resetInterview } = useInterview()
  const [data, setData] = useState<PerformanceData | null>(hookData)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (hookData) {
      setData(hookData)
      setLoading(false)
      return
    }

    if (typeof window === "undefined") return

    try {
      const saved = localStorage.getItem("hiredfast_interview_results")
      if (saved) {
        setData(JSON.parse(saved))
      }
    } catch {
      // ignore
    }
    setLoading(false)
  }, [hookData])

  const { user } = useAuth()
  const hasSaved = useRef(false)

  useEffect(() => {
    if (!data || !user || hasSaved.current) return
    hasSaved.current = true
    const jobTitle = localStorage.getItem("hiredfast_interview_job_title")
    const company = localStorage.getItem("hiredfast_interview_company")
    saveInterview(user.uid, {
      jobTitle: jobTitle ?? undefined,
      company: company ?? undefined,
      score: data.score,
      results: data,
    }).catch(console.error)
  }, [data, user])


  const handlePracticeAgain = () => {
    resetInterview()
    router.push("/interview/setup")
  }

  const handleGoHome = () => {
    resetInterview()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-slate-400 text-sm">No interview results found.</p>
        <Button
          onClick={() => router.push("/")}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Home className="h-4 w-4 mr-2" />
          Go Home
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-start justify-center py-10 px-4 overflow-y-auto">
      <div className="w-full max-w-[640px] flex flex-col items-center gap-8">
        {/* Header */}
        <div className="flex flex-col items-center gap-2">
          <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mt-2">Interview Complete!</h1>
          <p className="text-slate-400 text-sm">Here&apos;s how you did</p>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center gap-2">
          <ScoreCircle score={data.score} />
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-2">
            Overall Score
          </p>
        </div>

        {/* Strengths */}
        <div className="w-full">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <h2 className="text-base font-semibold text-white">Your Strengths</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.strengths.map((s, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 text-sm border border-green-500/20"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Better Answer */}
        {data.betterAnswer && (
          <div className="w-full">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-amber-400" />
              <h2 className="text-base font-semibold text-white">Room for Improvement</h2>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl bg-slate-800/80 border border-slate-700/50 p-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Original Question
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">{data.betterAnswer.originalQuestion}</p>
              </div>
              <div className="rounded-xl bg-slate-800/80 border border-slate-700/50 p-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Your Answer
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">{data.betterAnswer.userAnswer}</p>
              </div>
              <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-4">
                <p className="text-[10px] font-bold text-green-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Improved Answer
                </p>
                <p className="text-sm text-green-200 leading-relaxed">{data.betterAnswer.improvedAnswer}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 w-full mt-2 pb-8">
          <Button
            variant="outline"
            onClick={handlePracticeAgain}
            className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Practice Again
          </Button>
          <Button
            onClick={handleGoHome}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  )
}
