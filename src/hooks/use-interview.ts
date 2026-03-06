"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ResumeData } from "./use-resume-builder"

export type Message = {
  id: string
  role: "ai" | "user"
  content: string
  timestamp: Date
}

export type PerformanceData = {
  score: number
  strengths: string[]
  betterAnswer: {
    originalQuestion: string
    userAnswer: string
    improvedAnswer: string
  }
}

export type InterviewStatus = "idle" | "active" | "generating" | "completed"

export function useInterview() {
  const [status, setStatus] = useState<InterviewStatus>("idle")
  const [messages, setMessages] = useState<Message[]>([])
  // Single source of truth for synchronous API reads
  const messagesRef = useRef<Message[]>([])

  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(0)
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [jobDescription, setJobDescription] = useState<string>("")
  const [resumeText, setResumeText] = useState<string>("")

  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  // Single AbortController for all in-flight fetch requests
  const abortControllerRef = useRef<AbortController | null>(null)

  const totalQuestions = 5

  // Load data from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const interviewResumeText = localStorage.getItem("hiredfast_interview_resume_text")
      if (interviewResumeText) setResumeText(interviewResumeText)

      const savedResumeData = localStorage.getItem("hiredfast_resume_data")
      if (savedResumeData) {
        try {
          setResumeData(JSON.parse(savedResumeData))
        } catch {
          localStorage.removeItem("hiredfast_resume_data")
        }
      }

      const interviewJD = localStorage.getItem("hiredfast_interview_job_description")
      const savedJD = localStorage.getItem("hiredfast_job_description")
      if (interviewJD) setJobDescription(interviewJD)
      else if (savedJD) setJobDescription(savedJD)
    } catch (error) {
      console.error("Failed to load data from localStorage:", error)
    }
  }, [])

  // Cleanup: abort any in-flight request and stop speech on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [])

  /**
   * addMessage — pushes to the ref first (synchronous),
   * then schedules a re-render from the ref's contents.
   * This ensures messagesRef.current is always the ground truth
   * for the next API call, regardless of React batching.
   */
  const addMessage = useCallback((role: "ai" | "user", content: string): Message => {
    const newMessage: Message = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
    }
    messagesRef.current = [...messagesRef.current, newMessage]
    setMessages(messagesRef.current)
    return newMessage
  }, [])

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 1
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    speechSynthesisRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [])

  const startInterview = useCallback(async () => {
    // Abort any previous in-flight request
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    setStatus("generating")
    // Reset ref and state together
    messagesRef.current = []
    setMessages([])
    setCurrentQuestionNumber(1)
    setPerformanceData(null)

    try {
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationHistory: [],
          resumeData: resumeText || JSON.stringify(resumeData),
          jobDescription,
          questionNumber: 1,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) throw new Error("Failed to start interview")

      const data = await response.json()
      addMessage("ai", data.message)
      setStatus("active")
      speak(data.message)
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      console.error("Error starting interview:", error)
      setStatus("idle")
    }
  }, [resumeText, resumeData, jobDescription, addMessage, speak])

  const submitAnswer = useCallback(async (answer: string) => {
    if (!answer.trim() || status !== "active") return

    // Push user message into ref BEFORE the fetch so the history is complete
    addMessage("user", answer)
    setStatus("generating")

    // Abort any previous in-flight request
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    const nextQuestionNumber = currentQuestionNumber + 1

    try {
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Read from ref — always synchronously up-to-date
          conversationHistory: messagesRef.current.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userAnswer: answer,
          resumeData: resumeText || JSON.stringify(resumeData),
          jobDescription,
          questionNumber: nextQuestionNumber,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) throw new Error("Failed to get next question")

      const data = await response.json()

      if (data.isComplete && data.performanceData) {
        setPerformanceData(data.performanceData)
        setStatus("completed")
        addMessage("ai", data.message)
        speak(data.message)
      } else {
        addMessage("ai", data.message)
        setCurrentQuestionNumber(nextQuestionNumber)
        setStatus("active")
        speak(data.message)
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      console.error("Error submitting answer:", error)
      setStatus("active")
    }
  }, [status, currentQuestionNumber, resumeText, resumeData, jobDescription, addMessage, speak])

  const resetInterview = useCallback(() => {
    abortControllerRef.current?.abort()
    messagesRef.current = []
    setStatus("idle")
    setMessages([])
    setCurrentQuestionNumber(0)
    setPerformanceData(null)
    stopSpeaking()
  }, [stopSpeaking])

  const saveResults = useCallback((data: PerformanceData) => {
    try {
      localStorage.setItem("hiredfast_interview_results", JSON.stringify(data))
    } catch (e) {
      console.error("Failed to save results:", e)
    }
  }, [])

  return {
    status,
    messages,
    currentQuestionNumber,
    totalQuestions,
    performanceData,
    isSpeaking,
    resumeText,
    startInterview,
    submitAnswer,
    resetInterview,
    speak,
    stopSpeaking,
    saveResults,
  }
}
