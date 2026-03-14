"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FileText, Plus, Trash2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getResumes, deleteResume } from "@/lib/firestore"
import { Timestamp } from "firebase/firestore"

export default function ResumesPage() {
  const { user } = useAuth()
  const [resumes, setResumes] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getResumes(user.uid).then((data) => {
      setResumes(data)
      setLoaded(true)
    })
  }, [user])

  const formatDate = (ts: Timestamp | undefined) =>
    ts ? ts.toDate().toLocaleDateString() : ""

  const handleDelete = async (resumeId: string, resumeTitle: string) => {
    if (!user) return
    const confirmed = window.confirm(
      `Are you sure you want to delete "${resumeTitle}"? This action cannot be undone.`
    )
    if (!confirmed) return

    setDeletingId(resumeId)
    try {
      await deleteResume(user.uid, resumeId)
      setResumes((prev) => prev.filter((r) => r.id !== resumeId))
    } catch (error) {
      console.error("Failed to delete resume:", error)
      alert("Failed to delete resume. Please try again.")
    } finally {
      setDeletingId(null)
    }
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
              <div className="mt-3 flex items-center gap-2">
                <Link
                  href={`/resume/editor?id=${resume.id}`}
                  className="flex-1 flex items-center justify-center h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(resume.id, resume.title)}
                  disabled={deletingId === resume.id}
                  className="flex items-center justify-center h-8 w-8 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:hover:bg-red-950 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  aria-label={`Delete ${resume.title}`}
                >
                  {deletingId === resume.id ? (
                    <svg
                      className="animate-spin h-3.5 w-3.5"
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
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
