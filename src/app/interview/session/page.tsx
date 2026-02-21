"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Mic,
  MicOff,
  Pause,
  MessageSquare,
  SkipForward,
  PhoneOff,
  Volume2,
  VolumeX,
  RefreshCw,
  Loader2,
  MoreHorizontal,
  Send,
  X,
} from "lucide-react"
import { useInterview } from "@/hooks/use-interview"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const INTERVIEWER_AVATAR = "https://api.dicebear.com/7.x/personas/svg?seed=EmiliaZimmerman"
const USER_AVATAR = "https://api.dicebear.com/7.x/initials/svg?seed=You"
const INTERVIEWER_NAME = "Emilia Zimmerman"

export default function InterviewSessionPage() {
  const router = useRouter()
  const {
    status,
    messages,
    currentQuestionNumber,
    totalQuestions,
    performanceData,
    isSpeaking,
    startInterview,
    submitAnswer,
    stopSpeaking,
    speak,
    saveResults,
  } = useInterview()

  // Local state
  const [jobTitle, setJobTitle] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState("")
  const [speechSupported, setSpeechSupported] = useState(true)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [showChatInput, setShowChatInput] = useState(false)
  const [chatText, setChatText] = useState("")
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)
  const [imgError, setImgError] = useState(false)

  const hasStarted = useRef(false)
  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prevStatusRef = useRef(status)

  // Read from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return
    const title = localStorage.getItem("hiredfast_interview_job_title") || "Interview"
    const company = localStorage.getItem("hiredfast_interview_company") || ""
    const hasResume = localStorage.getItem("hiredfast_interview_resume_text")
    const hasJD = localStorage.getItem("hiredfast_interview_job_description")

    setJobTitle(title)
    setCompanyName(company)

    if (!hasResume && !hasJD) {
      router.replace("/")
      return
    }

    // Check speech recognition support
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) setSpeechSupported(false)
  }, [router])

  // Start interview once
  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true
      startInterview()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-speak AI messages when TTS is enabled
  useEffect(() => {
    if (!ttsEnabled) return
    const last = messages[messages.length - 1]
    if (last && last.role === "ai") {
      speak(last.content)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, ttsEnabled])

  // Navigate to results when complete
  useEffect(() => {
    if (status === "completed" && performanceData) {
      saveResults(performanceData)
      const t = setTimeout(() => router.push("/interview/results"), 1500)
      return () => clearTimeout(t)
    }
  }, [status, performanceData, router, saveResults])

  // Detect error (status went from generating to active without new message)
  useEffect(() => {
    if (prevStatusRef.current === "generating" && status === "active") {
      // Could be error — only show banner briefly
    }
    prevStatusRef.current = status
  }, [status])

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeaking()
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // beforeunload warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (status === "active" || status === "generating") {
        e.preventDefault()
      }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [status])

  // ---------- Voice Input ----------
  const startRecording = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (event: any) => {
      let interim = ""
      let final = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript
        } else {
          interim += transcript
        }
      }
      if (final) {
        setInterimTranscript("")
        setIsRecording(false)
        submitAnswer(final)
      } else {
        setInterimTranscript(interim)
      }
    }

    recognition.onerror = () => {
      setIsRecording(false)
      setInterimTranscript("")
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
    setInterimTranscript("")
  }, [submitAnswer])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
    }
    setIsRecording(false)
    setInterimTranscript("")
  }, [])

  const toggleRecording = () => {
    if (isRecording) stopRecording()
    else startRecording()
  }

  const handleSendChat = () => {
    if (!chatText.trim()) return
    submitAnswer(chatText.trim())
    setChatText("")
    setShowChatInput(false)
  }

  const handleSkip = () => {
    submitAnswer("[Skipped]")
  }

  const handleEndInterview = () => {
    setShowEndConfirm(false)
    stopSpeaking()
    router.push("/")
  }

  const progressValue = ((currentQuestionNumber - 1) / totalQuestions) * 100

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      {/* Error Banner */}
      {errorBanner && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-center text-sm text-red-400">
          {errorBanner}
          <button onClick={() => setErrorBanner(null)} className="ml-3 text-red-300 hover:text-white">
            <X className="h-3 w-3 inline" />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <button
          onClick={() => setShowEndConfirm(true)}
          className="h-10 w-10 rounded-xl bg-purple-600/20 flex items-center justify-center text-purple-400 hover:bg-purple-600/30 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="text-center flex-1">
          <h1 className="text-sm font-bold text-white">{jobTitle || "Interview"}</h1>
          {companyName && <p className="text-xs text-slate-500">{companyName}</p>}
          <div className="flex items-center justify-center gap-3 mt-1.5">
            <span className="text-[10px] text-slate-400 font-medium">
              Part {Math.min(currentQuestionNumber, totalQuestions)} of {totalQuestions}
            </span>
            <Progress
              value={progressValue}
              className="w-24 h-1.5 bg-slate-800 [&>[data-slot=progress-indicator]]:bg-blue-500"
            />
          </div>
        </div>

        <div className="w-10" /> {/* spacer */}
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Status badge */}
        <div className="flex justify-center py-3">
          <div className={cn(
            "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium",
            status === "generating" || isSpeaking
              ? "bg-blue-900/60 text-blue-300"
              : "bg-slate-800 text-slate-400"
          )}>
            {(status === "generating" || isSpeaking) ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Speaking with Interviewer
              </>
            ) : (
              "Your Turn"
            )}
          </div>
        </div>

        {/* Video cards */}
        <div className="px-4 grid grid-cols-2 gap-3 shrink-0">
          {/* You card */}
          <div className={cn(
            "rounded-2xl border bg-slate-800/50 p-4 flex flex-col items-center justify-center min-h-[180px] transition-all",
            isRecording
              ? "border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
              : "border-slate-700/30"
          )}>
            <div className={cn(
              "h-16 w-16 rounded-full overflow-hidden bg-slate-700 mb-3 ring-2 transition-all",
              isRecording ? "ring-green-500 ring-offset-2 ring-offset-slate-800" : "ring-transparent"
            )}>
              <img src={USER_AVATAR} alt="You" className="h-full w-full object-cover" />
            </div>
            <p className="text-sm font-semibold text-white">You</p>
            <p className="text-[10px] text-slate-500">Interview Candidate</p>
          </div>

          {/* Emilia card */}
          <div className="rounded-2xl border border-slate-700/30 bg-slate-800/50 p-4 flex flex-col items-center justify-center min-h-[180px] relative">
            {(status === "generating" || isSpeaking) && (
              <span className="absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                Active
              </span>
            )}
            <div className="h-16 w-16 rounded-full overflow-hidden bg-slate-700 mb-3 ring-2 ring-transparent flex items-center justify-center">
              {imgError ? (
                <span className="text-lg font-bold text-slate-400">EZ</span>
              ) : (
                <img
                  src={INTERVIEWER_AVATAR}
                  alt={INTERVIEWER_NAME}
                  className="h-full w-full object-cover"
                  onError={() => setImgError(true)}
                />
              )}
              {status === "generating" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full border-2 border-blue-500/30 animate-ping" />
                </div>
              )}
            </div>
            <p className="text-sm font-semibold text-white">{INTERVIEWER_NAME}</p>
            <p className="text-[10px] text-slate-500">{jobTitle || "Interviewer"}</p>

            {/* Card action buttons */}
            <div className="absolute bottom-3 left-3 right-3 flex justify-between">
              <button
                onClick={() => setErrorBanner("Regenerating question...")}
                className="h-7 w-7 rounded-lg bg-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-600 transition-colors"
                title="Regenerate"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
              <button
                onClick={() => {
                  setTtsEnabled(!ttsEnabled)
                  if (ttsEnabled) stopSpeaking()
                }}
                className="h-7 w-7 rounded-lg bg-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-600 transition-colors"
                title={ttsEnabled ? "Mute TTS" : "Enable TTS"}
              >
                {ttsEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* Chat transcript */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col max-w-[85%]",
                msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <span className="text-[10px] text-slate-500 mb-1 px-1">
                {msg.role === "ai" ? "Emilia" : "You"}
              </span>
              <div
                className={cn(
                  "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                  msg.role === "ai"
                    ? "bg-slate-800 text-slate-200 rounded-tl-md"
                    : "bg-blue-600/20 text-blue-100 rounded-tr-md"
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {status === "generating" && (
            <div className="flex flex-col max-w-[85%] mr-auto items-start">
              <span className="text-[10px] text-slate-500 mb-1 px-1">Emilia</span>
              <div className="px-4 py-3 rounded-2xl bg-slate-800 rounded-tl-md">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-slate-500 animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 rounded-full bg-slate-500 animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-slate-500 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Interim transcript bubble */}
        {interimTranscript && (
          <div className="px-4 pb-2">
            <div className="mx-auto max-w-sm bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-300 text-center">
              {interimTranscript}...
            </div>
          </div>
        )}

        {/* Chat input panel */}
        {showChatInput && (
          <div className="border-t border-slate-800 bg-slate-900 p-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex gap-2">
              <Textarea
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Type your answer..."
                rows={2}
                className="resize-none bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500/50 flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendChat()
                  }
                }}
              />
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleSendChat}
                  disabled={!chatText.trim() || status !== "active"}
                  className="bg-blue-600 hover:bg-blue-700 h-full px-4"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom toolbar */}
      <div className="border-t border-slate-800 bg-[#0d1117] px-4 py-3">
        <div className="flex items-center justify-center gap-3">
          {/* More */}
          <button className="h-12 w-12 rounded-full bg-slate-700 flex items-center justify-center text-white hover:bg-slate-600 transition-colors">
            <MoreHorizontal className="h-5 w-5" />
          </button>

          {/* Microphone */}
          {speechSupported ? (
            <button
              onClick={toggleRecording}
              disabled={status !== "active"}
              className={cn(
                "h-14 w-14 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-40",
                isRecording
                  ? "bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse"
                  : "bg-red-500 hover:bg-red-600"
              )}
            >
              {isRecording ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
            </button>
          ) : (
            <div className="text-xs text-slate-500 px-3">Use chat to type</div>
          )}

          {/* Pause */}
          <button className="h-12 w-12 rounded-full bg-amber-700 flex items-center justify-center text-white hover:bg-amber-600 transition-colors">
            <Pause className="h-5 w-5" />
          </button>

          {/* Chat */}
          <button
            onClick={() => setShowChatInput(!showChatInput)}
            className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center text-white transition-colors",
              showChatInput ? "bg-purple-500" : "bg-purple-600 hover:bg-purple-500"
            )}
          >
            <MessageSquare className="h-5 w-5" />
          </button>

          {/* Skip */}
          <button
            onClick={handleSkip}
            disabled={status !== "active"}
            className="h-12 w-12 rounded-full bg-slate-700 flex items-center justify-center text-white hover:bg-slate-600 transition-colors disabled:opacity-40"
          >
            <SkipForward className="h-5 w-5" />
          </button>

          {/* End call */}
          <button
            onClick={() => setShowEndConfirm(true)}
            className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors"
          >
            <PhoneOff className="h-5 w-5" />
          </button>
        </div>

        <p className="text-[10px] text-slate-600 text-center mt-2">
          {messages.length} message{messages.length !== 1 ? "s" : ""} • Part{" "}
          {Math.min(currentQuestionNumber, totalQuestions)} of {totalQuestions}
        </p>
      </div>

      {/* End interview confirmation */}
      <Dialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
        <DialogContent className="bg-slate-900 border-slate-700 sm:max-w-sm">
          <DialogTitle className="text-white">End interview?</DialogTitle>
          <p className="text-sm text-slate-400">Your progress will be saved.</p>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowEndConfirm(false)}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEndInterview}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              End Interview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
