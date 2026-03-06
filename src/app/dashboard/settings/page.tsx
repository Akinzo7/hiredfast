"use client"

import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getUserProfile, updateUserProfile } from "@/lib/firestore"
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "@/lib/firebase"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Loader2,
  CheckCircle2,
  X,
  Camera,
  Linkedin,
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const { user } = useAuth()

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [city, setCity] = useState("")
  const [linkedin, setLinkedin] = useState("")

  const [photoURL, setPhotoURL] = useState("")
  const [localPhotoPreview, setLocalPhotoPreview] = useState("")

  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    getUserProfile(user.uid)
      .then((profile) => {
        setFullName(profile?.name || user.displayName || "")
        setPhone(profile?.phone || "")
        setCity(profile?.city || "")
        setLinkedin(profile?.linkedin || "")
        // Support both old base64 field and new URL field during migration
        setPhotoURL(profile?.photoURL || profile?.photoBase64 || "")
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [user])

  const avatarSrc = localPhotoPreview || photoURL || user?.photoURL || null
  const showRemoveButton = !!(localPhotoPreview || photoURL)
  const initials = (fullName || user?.displayName || "U").trim().charAt(0).toUpperCase()

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setSaveError("Please select an image file.")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setSaveError("Image must be under 5MB.")
      return
    }

    setSaveError(null)

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file)
    setLocalPhotoPreview(objectUrl)

    try {
      if (!user) return
      const fileRef = storageRef(storage, `profile-photos/${user.uid}`)
      await uploadBytes(fileRef, file, { contentType: file.type })
      const downloadURL = await getDownloadURL(fileRef)
      setPhotoURL(downloadURL)
      URL.revokeObjectURL(objectUrl)
      setLocalPhotoPreview("") // Clear preview, use the real URL now
    } catch (err) {
      setSaveError("Failed to upload photo. Please try again.")
      URL.revokeObjectURL(objectUrl)
      setLocalPhotoPreview("")
    }
  }

  const handleSave = async () => {
    if (!user) return
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      await updateUserProfile(user.uid, {
        name: fullName,
        phone,
        city,
        linkedin,
        photoURL,
      })

      try {
        const existingData = localStorage.getItem("hiredfast_resume_data")
        if (existingData) {
          const parsed = JSON.parse(existingData)
          parsed.personalInfo = {
            ...parsed.personalInfo,
            fullName,
            phone,
            address: city,
            linkedin,
          }
          localStorage.setItem("hiredfast_resume_data", JSON.stringify(parsed))
        }
      } catch {}

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch {
      setSaveError("Failed to save settings. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 flex justify-center">
      <div className="w-full max-w-sm rounded-2xl border border-slate-700/50 bg-slate-900/80 p-5 sm:p-6">
        <p className="text-sm text-slate-400 text-center mb-6 leading-relaxed">
          Update your default profile information used across resumes and cover letters.
        </p>

        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="Profile"
                className="h-[120px] w-[120px] rounded-full object-cover border border-slate-700/50"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-[120px] w-[120px] rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border border-slate-700/50">
                <span className="text-4xl font-bold text-white">{initials}</span>
              </div>
            )}

            {showRemoveButton && (
              <button
                type="button"
                onClick={() => {
                  setLocalPhotoPreview("")
                  setPhotoURL("")
                  if (fileInputRef.current) fileInputRef.current.value = ""
                }}
                className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center absolute -top-1 -right-1 cursor-pointer hover:bg-red-600 transition-colors z-10"
                aria-label="Remove uploaded photo"
              >
                <X className="h-3.5 w-3.5 text-white" />
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            <Camera className="h-4 w-4" />
            Change Photo
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <div className="relative flex items-center bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3.5 focus-within:border-blue-500/50 transition-colors">
            <User className="h-5 w-5 text-slate-400 shrink-0 mr-3" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name"
              className="flex-1 bg-transparent text-white placeholder:text-slate-500 text-sm outline-none min-w-0"
            />
            {fullName && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 ml-2" />}
          </div>

          <div className="relative flex items-center bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3.5 focus-within:border-blue-500/50 transition-colors">
            <Mail className="h-5 w-5 text-slate-400 shrink-0 mr-3" />
            <input
              type="text"
              value={user?.email || ""}
              placeholder="Email Address"
              disabled
              className="flex-1 bg-transparent text-slate-400 placeholder:text-slate-500 text-sm outline-none min-w-0"
            />
            {(user?.email || "") && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 ml-2" />}
          </div>

          <div className="relative flex items-center bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3.5 focus-within:border-blue-500/50 transition-colors">
            <Phone className="h-5 w-5 text-slate-400 shrink-0 mr-3" />
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone Number"
              className="flex-1 bg-transparent text-white placeholder:text-slate-500 text-sm outline-none min-w-0"
            />
            {phone && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 ml-2" />}
          </div>

          <div className="relative flex items-center bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3.5 focus-within:border-blue-500/50 transition-colors">
            <MapPin className="h-5 w-5 text-slate-400 shrink-0 mr-3" />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="flex-1 bg-transparent text-white placeholder:text-slate-500 text-sm outline-none min-w-0"
            />
            {city && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 ml-2" />}
          </div>

          <div className="relative flex items-center bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3.5 focus-within:border-blue-500/50 transition-colors">
            <Linkedin className="h-5 w-5 text-slate-400 shrink-0 mr-3" />
            <input
              type="text"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="LinkedIn URL"
              className="flex-1 bg-transparent text-white placeholder:text-slate-500 text-sm outline-none min-w-0"
            />
            {linkedin && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 ml-2" />}
          </div>
        </div>

        {saveError && (
          <p className="text-sm text-red-400 text-center mb-4">
            {saveError}
          </p>
        )}
        {saveSuccess && (
          <p className={cn("text-sm text-center mb-4", "text-green-400")}>
            Settings saved successfully.
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-5 w-5" />
          )}
          {isSaving ? "Saving..." : "Save Settings"}
        </button>

        <p className="text-xs text-slate-500 text-center mt-4 leading-relaxed">
          These details will be used as defaults when creating new resumes and cover letters.
        </p>
      </div>
    </div>
  )
}
