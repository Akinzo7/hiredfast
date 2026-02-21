"use client"

import { useEffect } from "react"

export default function InterviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Hide the global navbar for immersive interview experience
  useEffect(() => {
    const navbar = document.querySelector('header[class*="border-b"]') as HTMLElement
    if (navbar) navbar.style.display = "none"
    return () => {
      if (navbar) navbar.style.display = ""
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-950">
      {children}
    </div>
  )
}
