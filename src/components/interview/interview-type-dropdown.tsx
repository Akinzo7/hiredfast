"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

const INTERVIEW_TYPES = [
  { value: "portfolio", label: "Portfolio Review", pro: false },
  { value: "technical", label: "Technical Skills Assessment", pro: true },
  { value: "cultural", label: "Cultural Fit and Collaboration", pro: true },
]

interface InterviewTypeDropdownProps {
  value: string
  onChange: (value: string) => void
}

export function InterviewTypeDropdown({ value, onChange }: InterviewTypeDropdownProps) {
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const selectedLabel = INTERVIEW_TYPES.find((t) => t.value === value)?.label || "Portfolio Review"

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 border border-slate-700/50 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
      >
        {selectedLabel}
        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 bg-slate-800 border border-slate-700/50 rounded-xl shadow-2xl z-50 overflow-hidden">
          {INTERVIEW_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => {
                onChange(type.value)
                setOpen(false)
                if (type.pro) {
                  setToast("Coming soon for Pro users")
                }
              }}
              className={cn(
                "flex items-center justify-between w-full px-4 py-3 text-sm transition-colors hover:bg-slate-700/50",
                value === type.value ? "text-blue-400" : "text-white"
              )}
            >
              <span className="flex items-center gap-2">
                {type.label}
                {type.pro && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white uppercase tracking-wider">
                    PRO
                  </span>
                )}
              </span>
              {value === type.value && <Check className="h-4 w-4 text-blue-400" />}
            </button>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          {toast}
        </div>
      )}
    </div>
  )
}
