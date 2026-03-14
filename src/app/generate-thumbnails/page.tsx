"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toPng } from "html-to-image"
import { doc, setDoc } from "firebase/firestore"
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { db, storage } from "@/lib/firebase"
import { SAMPLE_RESUME_DATA, TEMPLATE_OPTIONS, renderLayout } from "@/components/resume-editor/render-layout"

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function GenerateThumbnailsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const previewRef = useRef<HTMLDivElement | null>(null)

  const [isGenerating, setIsGenerating] = useState(false)
  const [currentTemplateId, setCurrentTemplateId] = useState(TEMPLATE_OPTIONS[0]?.id ?? "modern")
  const [progress, setProgress] = useState<string[]>([])

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
  const isAdmin = Boolean(user?.email && adminEmail && user.email === adminEmail)

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/dashboard")
    }
  }, [isAdmin, loading, router])

  const handleGenerateAll = async () => {
    if (isGenerating || !previewRef.current) return

    setIsGenerating(true)
    setProgress([])

    try {
      for (const template of TEMPLATE_OPTIONS) {
        setCurrentTemplateId(template.id)
        setProgress((prev) => [...prev, `Rendering ${template.name}...`])

        await wait(350)

        if (!previewRef.current) {
          throw new Error("Preview container is not available.")
        }

        const dataUrl = await toPng(previewRef.current, {
          pixelRatio: 2,
          backgroundColor: "#ffffff",
          cacheBust: true,
          fontEmbedCSS: "", // Bypasses the failing cssRules check
        })

        const img = new Image()
        img.src = dataUrl
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })

        const cropHeight = Math.max(1, Math.floor(img.height * 0.45))
        const croppedCanvas = document.createElement("canvas")
        croppedCanvas.width = img.width
        croppedCanvas.height = cropHeight

        const context = croppedCanvas.getContext("2d")
        if (!context) {
          throw new Error("Failed to create canvas context.")
        }

        context.drawImage(img, 0, 0, img.width, cropHeight, 0, 0, img.width, cropHeight)

        const blob = await new Promise<Blob | null>((resolve) => {
          croppedCanvas.toBlob(resolve, "image/png")
        })

        if (!blob) {
          throw new Error(`Unable to convert canvas to PNG for ${template.name}.`)
        }

        const fileRef = storageRef(storage, `template-thumbnails/${template.id}.png`)
        await uploadBytes(fileRef, blob, { contentType: "image/png" })
        const downloadURL = await getDownloadURL(fileRef)

        await setDoc(
          doc(db, "app_config", "template_thumbnails"),
          { [template.id]: downloadURL },
          { merge: true }
        )

        setProgress((prev) => [...prev, `Uploaded ${template.name}.`])
      }

      setProgress((prev) => [...prev, "All thumbnails generated successfully."])
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      setProgress((prev) => [...prev, `Failed: ${message}`])
    } finally {
      setIsGenerating(false)
    }
  }

  if (loading || !isAdmin) {
    return <div className="p-6 text-sm text-muted-foreground">Checking access...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Template Thumbnail Generator</h1>
          <p className="text-sm text-muted-foreground">Developer utility for generating template preview thumbnails.</p>
        </div>
        <Button onClick={handleGenerateAll} disabled={isGenerating}>
          {isGenerating ? "Generating..." : "Generate All Thumbnails"}
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-muted/20 p-4 overflow-auto">
        <p className="mb-3 text-sm text-muted-foreground">
          Currently rendering: {TEMPLATE_OPTIONS.find((template) => template.id === currentTemplateId)?.name ?? currentTemplateId}
        </p>
        <div className="flex justify-center">
          <div className="bg-white shadow-lg" style={{ width: "794px", minHeight: "1123px" }} ref={previewRef}>
            {renderLayout(currentTemplateId, SAMPLE_RESUME_DATA, "#B8860B")}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background p-4">
        <h2 className="text-base font-semibold mb-2">Progress</h2>
        <div className="max-h-64 overflow-auto space-y-1 text-sm text-muted-foreground">
          {progress.length === 0 && <p>No runs yet.</p>}
          {progress.map((item, index) => (
            <p key={`${item}-${index}`}>{item}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

