"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FileText, Plus } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getResumes } from "@/lib/firestore"
import { Timestamp } from "firebase/firestore"

export default function ResumesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [resumes, setResumes] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getResumes(user.uid).then((data) => {
      setResumes(data)
      setLoaded(true)
    })
  }, [user])

  const formatDate = (ts: Timestamp | undefined) =>
    ts ? ts.toDate().toLocaleDateString() : ""

  const handleEdit = (resume: typeof resumes[0]) => {
    setEditError(null)
    if (resume.data) {
      try {
        localStorage.setItem(
          "hiredfast_resume_data",
          JSON.stringify(resume.data)
        )
      } catch (err) {
        console.error("Failed to write resume to localStorage:", err)
        setEditingId(null)
        setEditError("Unable to open this resume — browser storage is full or unavailable.")
        return
      }
    }
    setEditingId(resume.id)
    router.push("/resume/editor")
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Resumes</h1>
        <Link href="/resume/editor"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" /> New Resume
        </Link>
      </div>

      {editError && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
          {editError}
        </div>
      )}

      {loaded && resumes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-2xl">
          <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium">No resumes yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first resume to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {resumes.map((resume) => (
            <div key={resume.id}
              className="rounded-xl border bg-card p-4">
              <div className="h-32 rounded-lg bg-muted mb-3 flex items-center justify-center">
                <FileText className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="font-medium text-sm truncate">
                {resume.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDate(resume.updatedAt)}
              </p>
              <button
                onClick={() => handleEdit(resume)}
                disabled={editingId === resume.id}
                className="mt-3 flex items-center justify-center h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors w-full disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {editingId === resume.id ? (
                  <span className="flex items-center gap-1.5">
                    <svg
                      className="animate-spin h-3 w-3 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12" cy="12" r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Opening...
                  </span>
                ) : (
                  "Edit"
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
