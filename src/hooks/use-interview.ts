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
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(0)
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [jobDescription, setJobDescription] = useState<string>("")
  const [resumeText, setResumeText] = useState<string>("")
  
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  const totalQuestions = 5

  // Load resume data and job description from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
  
    try {
      // Read interview-specific resume text (from setup flow)
      const interviewResumeText = localStorage.getItem("hiredfast_interview_resume_text")
      if (interviewResumeText) {
        setResumeText(interviewResumeText)
      }

      // Read structured resume data
      const savedResumeData = localStorage.getItem("hiredfast_resume_data")
      if (savedResumeData) {
        try {
          setResumeData(JSON.parse(savedResumeData))
        } catch (e) {
          console.warn("Corrupted resume data in localStorage, clearing.")
          localStorage.removeItem("hiredfast_resume_data")
        }
      }

      // Read job description: prefer interview-specific, fall back to cover letter one
      const interviewJD = localStorage.getItem("hiredfast_interview_job_description")
      const savedJobDescription = localStorage.getItem("hiredfast_job_description")
      if (interviewJD) {
        setJobDescription(interviewJD)
      } else if (savedJobDescription) {
        setJobDescription(savedJobDescription)
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error)
    }
  }, [])

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [])

  useEffect(() => {
    // Cleanup function runs when component unmounts
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  const addMessage = (role: "ai" | "user", content: string) => {
    const newMessage: Message = {
      id: crypto.randomUUID(), // Use browser's crypto API
      role,
      content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, newMessage])
    return newMessage
  }

  const speak = (text: string) => {
    if (!window.speechSynthesis) return

    // Cancel any ongoing speech
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
  }


  const startInterview = async () => {
    setStatus("generating")
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
      })

      if (!response.ok) throw new Error("Failed to start interview")

      const data = await response.json()
      const aiMessage = addMessage("ai", data.message)
      setStatus("active")
      
      // Speak the greeting
      speak(data.message)
    } catch (error) {
      console.error("Error starting interview:", error)
      setStatus("idle")
    }
  }

  const submitAnswer = async (answer: string) => {
    if (!answer.trim() || status !== "active") return

    // Add user message
    addMessage("user", answer)
    setStatus("generating")

    try {
      const nextQuestionNumber = currentQuestionNumber + 1

      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userAnswer: answer,
          resumeData: resumeText || JSON.stringify(resumeData),
          jobDescription,
          questionNumber: nextQuestionNumber,
        }),
      })

      if (!response.ok) throw new Error("Failed to get next question")

      const data = await response.json()

      if (data.isComplete && data.performanceData) {
        // Interview completed
        setPerformanceData(data.performanceData)
        setStatus("completed")
        addMessage("ai", data.message)
        speak(data.message)
      } else {
        // Next question
        addMessage("ai", data.message)
        setCurrentQuestionNumber(nextQuestionNumber)
        setStatus("active")
        speak(data.message)
      }
    } catch (error) {
      console.error("Error submitting answer:", error)
      setStatus("active")
    }
  }

  const resetInterview = () => {
    setStatus("idle")
    setMessages([])
    setCurrentQuestionNumber(0)
    setPerformanceData(null)
    stopSpeaking()
  }

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
