"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Play, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InterviewTypeDropdown } from "@/components/interview/interview-type-dropdown"

const INTERVIEWER_AVATAR = "https://api.dicebear.com/7.x/personas/svg?seed=EmiliaZimmerman"
const INTERVIEWER_NAME = "Emilia Zimmerman"

const TYPE_LABELS: Record<string, string> = {
  portfolio: "PORTFOLIO REVIEW",
  technical: "TECHNICAL SKILLS ASSESSMENT",
  cultural: "CULTURAL FIT AND COLLABORATION",
}

export default function InterviewSetupPage() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState("portfolio")
  const [jobTitle, setJobTitle] = useState("")
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const title = localStorage.getItem("hiredfast_interview_job_title") || ""
    setJobTitle(title)
  }, [])

  const handleStart = () => {
    try {
      localStorage.setItem("hiredfast_interview_type", selectedType)
    } catch {}
    router.push("/interview/session")
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center gap-6 max-w-lg w-full">
        {/* Interview Type Dropdown */}
        <InterviewTypeDropdown value={selectedType} onChange={setSelectedType} />

        {/* Type label */}
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
            {TYPE_LABELS[selectedType] || "PORTFOLIO REVIEW"}
          </span>
          <Info className="h-3.5 w-3.5" />
        </div>

        {/* Subtitle */}
        {jobTitle && (
          <p className="text-sm text-slate-500">
            Interview with the {jobTitle}
          </p>
        )}

        {/* Avatar */}
        <div className="relative mt-2">
          <div className="h-32 w-32 rounded-full ring-4 ring-slate-700/50 ring-offset-4 ring-offset-[#0d1117] overflow-hidden bg-slate-800 flex items-center justify-center">
            {imgError ? (
              <span className="text-3xl font-bold text-slate-400">EZ</span>
            ) : (
              <img
                src={INTERVIEWER_AVATAR}
                alt={INTERVIEWER_NAME}
                className="h-full w-full object-cover"
                onError={() => setImgError(true)}
              />
            )}
          </div>
        </div>

        {/* Greeting */}
        <div className="text-center mt-4">
          <h1 className="text-xl md:text-2xl font-bold text-white leading-snug">
            Hi! I&apos;m {INTERVIEWER_NAME},
            <br />
            your interviewer today.
          </h1>
        </div>

        {/* Start Button */}
        <Button
          onClick={handleStart}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-10 py-6 text-base font-semibold gap-2 shadow-lg shadow-blue-600/20"
        >
          <Play className="h-5 w-5 fill-current" />
          Start Interview
        </Button>
      </div>
    </div>
  )
}
