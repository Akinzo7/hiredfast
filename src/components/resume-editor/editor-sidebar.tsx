"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Camera,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Pencil,
  Plus,
  Sparkles,
  X,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getUserProfile } from "@/lib/firestore"
import { useResumeBuilder } from "@/hooks/use-resume-builder"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "./rich-text-editor"
import { cn } from "@/lib/utils"

type DragPosition = "before" | "after"

type SectionMeta = {
  id: string
  title: string
}

const STANDARD_SECTIONS: SectionMeta[] = [
  { id: "personalDetails", title: "Personal Details" },
  { id: "summary", title: "Professional Summary" },
  { id: "coreCompetencies", title: "Core Competencies" },
  { id: "experience", title: "Professional Experience" },
  { id: "education", title: "Education" },
  { id: "skills", title: "Technical Skills" },
  { id: "achievements", title: "Achievements" },
  { id: "projects", title: "Projects" },
  { id: "languages", title: "Languages" },
  { id: "certifications", title: "Certifications" },
  { id: "associations", title: "Associations" },
]

const DEFAULT_SECTION_ORDER = STANDARD_SECTIONS.map((section) => section.id)

const stripHtmlToPlain = (value: string) => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()

type PersonalFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
}

function PersonalField({ label, value, onChange }: PersonalFieldProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-28 shrink-0 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        {label}
      </div>
      <div className="relative flex-1">
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(value ? "border-blue-500" : "border-border", "pr-8")}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={`Clear ${label}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

export function EditorSidebar() {
  const { user } = useAuth()
  const {
    resumeData,
    updatePersonalInfo,
    setSummary,
    setCoreCompetencies,
    setWorkExperienceRich,
    setEducationRich,
    setSkillsRich,
    setAchievements,
    setProjects,
    setLanguages,
    setCertifications,
    setAssociations,
    setCustomSections,
  } = useResumeBuilder()

  const [expandedSections, setExpandedSections] = useState<string[]>(["personalDetails"])
  const [sectionOrder, setSectionOrder] = useState<string[]>(DEFAULT_SECTION_ORDER)
  const { hiddenSections, setHiddenSections } = useResumeBuilder()
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false)
  const [customSectionTitle, setCustomSectionTitle] = useState("")
  const [useSavedDetails, setUseSavedDetails] = useState(false)
  const [isRegeneratingSection, setIsRegeneratingSection] = useState("")
  const [dragIndicator, setDragIndicator] = useState<{ sectionId: string; position: DragPosition } | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const draggedSectionRef = useRef<string>("")

  const allSections = useMemo(() => {
    const custom = resumeData.customSections.map((section) => ({ id: section.id, title: section.title }))
    return [...STANDARD_SECTIONS, ...custom]
  }, [resumeData.customSections])

  const sectionMetaMap = useMemo(() => {
    return allSections.reduce<Record<string, SectionMeta>>((acc, section) => {
      acc[section.id] = section
      return acc
    }, {})
  }, [allSections])

  const visibleSectionIds = useMemo(() => {
    return sectionOrder.filter((id) => sectionMetaMap[id] && !hiddenSections.includes(id))
  }, [hiddenSections, sectionMetaMap, sectionOrder])

  const hiddenSectionMeta = useMemo(() => {
    return hiddenSections
      .map((id) => sectionMetaMap[id])
      .filter((section): section is SectionMeta => Boolean(section))
  }, [hiddenSections, sectionMetaMap])

  useEffect(() => {
    try {
      const savedOrder = localStorage.getItem("hiredfast_section_order")
      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder)
        if (Array.isArray(parsedOrder)) {
          setSectionOrder(parsedOrder.filter((id): id is string => typeof id === "string"))
        }
      }
    } catch {
      setSectionOrder(DEFAULT_SECTION_ORDER)
    }
  }, [])

  useEffect(() => {
    const allIds = [...DEFAULT_SECTION_ORDER, ...resumeData.customSections.map((section) => section.id)]

    setSectionOrder((current) => {
      const filteredCurrent = current.filter((id) => allIds.includes(id))
      const missing = allIds.filter((id) => !filteredCurrent.includes(id))
      return [...filteredCurrent, ...missing]
    })
  }, [resumeData.customSections])

  useEffect(() => {
    try {
      localStorage.setItem("hiredfast_section_order", JSON.stringify(sectionOrder))
    } catch {
      // Ignore storage failures
    }
  }, [sectionOrder])

  const handleExpandAll = () => setExpandedSections(visibleSectionIds)
  const handleCollapseAll = () => setExpandedSections([])

  const toggleSection = (sectionId: string) => {
    setExpandedSections((current) =>
      current.includes(sectionId)
        ? current.filter((id) => id !== sectionId)
        : [...current, sectionId]
    )
  }

  const handleRemoveSection = (sectionId: string) => {
    if (!hiddenSections.includes(sectionId)) {
      setHiddenSections([...hiddenSections, sectionId])
    }
    setExpandedSections((current) => current.filter((id) => id !== sectionId))
  }

  const handleReAddSection = (sectionId: string) => {
    setHiddenSections(hiddenSections.filter((id) => id !== sectionId))
    setExpandedSections((current) => (current.includes(sectionId) ? current : [...current, sectionId]))
  }

  const handleAddCustomSection = () => {
    const title = customSectionTitle.trim()
    if (!title) return

    const newSectionId = crypto.randomUUID()
    setCustomSections([...resumeData.customSections, { id: newSectionId, title, content: "" }])
    setSectionOrder((current) => [...current, newSectionId])
    setExpandedSections((current) => [...current, newSectionId])
    setCustomSectionTitle("")
    setIsAddSectionOpen(false)
  }

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = typeof reader.result === "string" ? reader.result : ""
      updatePersonalInfo({ photo: base64 })
    }
    reader.readAsDataURL(file)
  }

  const handleSavedDetailsToggle = async () => {
    if (!user) return

    const shouldUseSavedDetails = !useSavedDetails
    setUseSavedDetails(shouldUseSavedDetails)

    if (!shouldUseSavedDetails) return

    try {
      const profile = await getUserProfile(user.uid)
      if (!profile) return

      updatePersonalInfo({
        fullName: profile.name ?? resumeData.personalInfo.fullName,
        phone: profile.phone ?? resumeData.personalInfo.phone,
        address: profile.city ?? resumeData.personalInfo.address,
        linkedin: profile.linkedin ?? resumeData.personalInfo.linkedin,
      })
    } catch (error) {
      console.error("Failed to fetch saved details:", error)
    }
  }

  const reorderSections = (targetId: string, position: DragPosition) => {
    const draggedId = draggedSectionRef.current
    if (!draggedId || draggedId === targetId) return

    setSectionOrder((current) => {
      const sourceIndex = current.indexOf(draggedId)
      const targetIndex = current.indexOf(targetId)
      if (sourceIndex < 0 || targetIndex < 0) return current

      const reordered = [...current]
      reordered.splice(sourceIndex, 1)

      let insertAt = targetIndex
      if (position === "after") insertAt += 1
      if (sourceIndex < targetIndex) insertAt -= 1

      reordered.splice(insertAt, 0, draggedId)
      return reordered
    })
  }

  const getRegenerationConfig = (sectionId: string): {
    title: string
    content: string
    onApply: (content: string) => void
  } | null => {
    const customSection = resumeData.customSections.find((section) => section.id === sectionId)
    if (customSection) {
      return {
        title: customSection.title,
        content: customSection.content,
        onApply: (content) => {
          setCustomSections(
            resumeData.customSections.map((section) =>
              section.id === customSection.id ? { ...section, content } : section
            )
          )
        },
      }
    }

    if (sectionId === "summary") {
      return { title: "Professional Summary", content: resumeData.summary, onApply: setSummary }
    }
    if (sectionId === "coreCompetencies") {
      return { title: "Core Competencies", content: resumeData.coreCompetencies, onApply: setCoreCompetencies }
    }
    if (sectionId === "experience") {
      return { title: "Professional Experience", content: resumeData.workExperienceRich, onApply: setWorkExperienceRich }
    }
    if (sectionId === "education") {
      return { title: "Education", content: resumeData.educationRich, onApply: setEducationRich }
    }
    if (sectionId === "skills") {
      return { title: "Technical Skills", content: resumeData.skillsRich, onApply: setSkillsRich }
    }
    if (sectionId === "achievements") {
      return { title: "Achievements", content: resumeData.achievements, onApply: setAchievements }
    }

    return null
  }

  const handleRegenerate = async (sectionId: string) => {
    const config = getRegenerationConfig(sectionId)
    if (!config || isRegeneratingSection) return

    setIsRegeneratingSection(sectionId)

    try {
      const response = await fetch("/api/generate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionTitle: config.title,
          currentContent: config.content,
          resumeContext: JSON.stringify({
            personalInfo: resumeData.personalInfo,
            summary: stripHtmlToPlain(resumeData.summary),
            coreCompetencies: stripHtmlToPlain(resumeData.coreCompetencies),
            workExperienceRich: stripHtmlToPlain(resumeData.workExperienceRich),
            educationRich: stripHtmlToPlain(resumeData.educationRich),
            skillsRich: stripHtmlToPlain(resumeData.skillsRich),
            achievements: stripHtmlToPlain(resumeData.achievements),
          }),
        }),
      })

      if (!response.ok) throw new Error("Failed to regenerate section")

      const data = (await response.json()) as { content?: string }
      if (typeof data.content === "string") {
        config.onApply(data.content)
      }
    } catch (error) {
      console.error("Regeneration error:", error)
    } finally {
      setIsRegeneratingSection("")
    }
  }

  const updateCustomSection = (id: string, content: string) => {
    setCustomSections(
      resumeData.customSections.map((section) =>
        section.id === id ? { ...section, content } : section
      )
    )
  }

  const renderSectionContent = (sectionId: string) => {
    if (sectionId === "personalDetails") {
      return (
        <div className="space-y-4">
          <div className="flex flex-col items-center">
            <div className="relative h-32 w-32 rounded-full border-2 border-blue-500 overflow-hidden">
              {resumeData.personalInfo.photo ? (
                <img
                  src={resumeData.personalInfo.photo}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-muted/40 flex items-center justify-center text-muted-foreground text-xs">
                  No Photo
                </div>
              )}

              {resumeData.personalInfo.photo && (
                <button
                  type="button"
                  onClick={() => updatePersonalInfo({ photo: "" })}
                  className="absolute right-0 top-0 rounded-full bg-red-500 p-1 text-white"
                  aria-label="Remove photo"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <Button
              type="button"
              className="mt-3 gap-2"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-4 w-4" /> Change Photo
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          {user && (
            <div className="flex items-center justify-between rounded-lg border border-blue-500/50 px-3 py-2">
              <span className="text-sm font-medium">Use saved details</span>
              <button
                type="button"
                onClick={() => {
                  void handleSavedDetailsToggle()
                }}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  useSavedDetails ? "bg-blue-500" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
                    useSavedDetails ? "translate-x-5" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          )}

          <div className="space-y-2">
            <PersonalField label="Full Name" value={resumeData.personalInfo.fullName} onChange={(value) => updatePersonalInfo({ fullName: value })} />
            <PersonalField label="Functional Title" value={resumeData.personalInfo.functionalTitle} onChange={(value) => updatePersonalInfo({ functionalTitle: value })} />
            <PersonalField label="Industry Title" value={resumeData.personalInfo.industryTitle} onChange={(value) => updatePersonalInfo({ industryTitle: value })} />
            <PersonalField label="City" value={resumeData.personalInfo.address} onChange={(value) => updatePersonalInfo({ address: value })} />
            <PersonalField label="Phone Number" value={resumeData.personalInfo.phone} onChange={(value) => updatePersonalInfo({ phone: value })} />
            <PersonalField label="Email" value={resumeData.personalInfo.email} onChange={(value) => updatePersonalInfo({ email: value })} />
            <PersonalField label="LinkedIn" value={resumeData.personalInfo.linkedin} onChange={(value) => updatePersonalInfo({ linkedin: value })} />
            <PersonalField label="Portfolio" value={resumeData.personalInfo.portfolio} onChange={(value) => updatePersonalInfo({ portfolio: value })} />
          </div>
        </div>
      )
    }

    if (sectionId === "summary") {
      return <RichTextEditor value={resumeData.summary} onChange={setSummary} placeholder="Write a compelling professional summary..." />
    }

    if (sectionId === "coreCompetencies") {
      return <RichTextEditor value={resumeData.coreCompetencies} onChange={setCoreCompetencies} placeholder="List your core competencies and key skills..." />
    }

    if (sectionId === "experience") {
      return <RichTextEditor value={resumeData.workExperienceRich} onChange={setWorkExperienceRich} placeholder="Add your work experience with job titles, companies, dates, and key achievements..." />
    }

    if (sectionId === "education") {
      return <RichTextEditor value={resumeData.educationRich} onChange={setEducationRich} placeholder="Add your education, degrees, institutions, and relevant coursework..." />
    }

    if (sectionId === "skills") {
      return <RichTextEditor value={resumeData.skillsRich} onChange={setSkillsRich} placeholder="List your technical skills, tools, and technologies..." />
    }

    if (sectionId === "achievements") {
      return <RichTextEditor value={resumeData.achievements} onChange={setAchievements} placeholder="List your key achievements and accomplishments..." />
    }

    if (sectionId === "projects") {
      const updateProject = (id: string, field: keyof (typeof resumeData.projects)[number], value: string) => {
        setProjects(
          resumeData.projects.map((project) =>
            project.id === id ? { ...project, [field]: value } : project
          )
        )
      }

      const addProject = () => {
        setProjects([
          ...resumeData.projects,
          { id: crypto.randomUUID(), title: "", description: "", link: "", startDate: "", endDate: "" },
        ])
      }

      return (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={addProject} className="gap-2">
              <Plus className="h-4 w-4" /> Add Project
            </Button>
          </div>
          {resumeData.projects.map((project) => (
            <div key={project.id} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm">Project</Label>
                <button
                  type="button"
                  onClick={() => setProjects(resumeData.projects.filter((item) => item.id !== project.id))}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Input value={project.title} onChange={(event) => updateProject(project.id, "title", event.target.value)} placeholder="Project title" />
              <Input value={project.link} onChange={(event) => updateProject(project.id, "link", event.target.value)} placeholder="Project link" />
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={project.startDate} onChange={(event) => updateProject(project.id, "startDate", event.target.value)} />
                <Input type="date" value={project.endDate} onChange={(event) => updateProject(project.id, "endDate", event.target.value)} />
              </div>
              <RichTextEditor value={project.description} onChange={(value) => updateProject(project.id, "description", value)} placeholder="Project description" />
            </div>
          ))}
        </div>
      )
    }

    if (sectionId === "languages") {
      const addLanguage = () => {
        setLanguages([...resumeData.languages, { id: crypto.randomUUID(), name: "", proficiency: "" }])
      }

      const updateLanguage = (id: string, field: "name" | "proficiency", value: string) => {
        setLanguages(
          resumeData.languages.map((language) =>
            language.id === id ? { ...language, [field]: value } : language
          )
        )
      }

      return (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={addLanguage} className="gap-2">
              <Plus className="h-4 w-4" /> Add Language
            </Button>
          </div>
          {resumeData.languages.map((language) => (
            <div key={language.id} className="flex items-center gap-2">
              <Input value={language.name} onChange={(event) => updateLanguage(language.id, "name", event.target.value)} placeholder="Language" />
              <Input value={language.proficiency} onChange={(event) => updateLanguage(language.id, "proficiency", event.target.value)} placeholder="Proficiency" />
              <button
                type="button"
                onClick={() => setLanguages(resumeData.languages.filter((item) => item.id !== language.id))}
                className="text-red-400 hover:text-red-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )
    }

    if (sectionId === "certifications") {
      const addCertification = () => {
        setCertifications([...resumeData.certifications, { id: crypto.randomUUID(), name: "", issuer: "", year: "" }])
      }

      const updateCertification = (id: string, field: "name" | "issuer" | "year", value: string) => {
        setCertifications(
          resumeData.certifications.map((certification) =>
            certification.id === id ? { ...certification, [field]: value } : certification
          )
        )
      }

      return (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={addCertification} className="gap-2">
              <Plus className="h-4 w-4" /> Add Certification
            </Button>
          </div>
          {resumeData.certifications.map((certification) => (
            <div key={certification.id} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setCertifications(resumeData.certifications.filter((item) => item.id !== certification.id))}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Input value={certification.name} onChange={(event) => updateCertification(certification.id, "name", event.target.value)} placeholder="Certification name" />
              <Input value={certification.issuer} onChange={(event) => updateCertification(certification.id, "issuer", event.target.value)} placeholder="Issuer" />
              <Input value={certification.year} onChange={(event) => updateCertification(certification.id, "year", event.target.value)} placeholder="Year" />
            </div>
          ))}
        </div>
      )
    }

    if (sectionId === "associations") {
      const addAssociation = () => {
        setAssociations([...resumeData.associations, { id: crypto.randomUUID(), name: "", role: "" }])
      }

      const updateAssociation = (id: string, field: "name" | "role", value: string) => {
        setAssociations(
          resumeData.associations.map((association) =>
            association.id === id ? { ...association, [field]: value } : association
          )
        )
      }

      return (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={addAssociation} className="gap-2">
              <Plus className="h-4 w-4" /> Add Association
            </Button>
          </div>
          {resumeData.associations.map((association) => (
            <div key={association.id} className="flex items-center gap-2">
              <Input value={association.name} onChange={(event) => updateAssociation(association.id, "name", event.target.value)} placeholder="Association" />
              <Input value={association.role} onChange={(event) => updateAssociation(association.id, "role", event.target.value)} placeholder="Role" />
              <button
                type="button"
                onClick={() => setAssociations(resumeData.associations.filter((item) => item.id !== association.id))}
                className="text-red-400 hover:text-red-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )
    }

    const customSection = resumeData.customSections.find((section) => section.id === sectionId)
    if (customSection) {
      return (
        <RichTextEditor
          value={customSection.content}
          onChange={(value) => updateCustomSection(customSection.id, value)}
          placeholder={`Write content for ${customSection.title}...`}
        />
      )
    }

    return null
  }

  return (
    <div className="flex h-full flex-col">
      <Dialog open={isAddSectionOpen} onOpenChange={setIsAddSectionOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>Add Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Re-add hidden sections</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {hiddenSectionMeta.length === 0 && <p className="text-sm text-muted-foreground">No hidden sections.</p>}
                {hiddenSectionMeta.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => {
                      handleReAddSection(section.id)
                      setIsAddSectionOpen(false)
                    }}
                    className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
                  >
                    {section.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-section-title">New custom section title</Label>
              <Input id="custom-section-title" value={customSectionTitle} onChange={(event) => setCustomSectionTitle(event.target.value)} placeholder="e.g. Volunteer Experience" />
              <Button type="button" onClick={handleAddCustomSection} className="w-full">Add Custom Section</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="sticky top-0 z-10 border-b bg-background px-4 py-3 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <Button type="button" className="gap-2" onClick={() => setIsAddSectionOpen(true)}>
            <Plus className="h-4 w-4" /> Add Section
          </Button>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleExpandAll}>Expand All</Button>
            <Button type="button" variant="outline" size="sm" onClick={handleCollapseAll}>Collapse All</Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {visibleSectionIds.map((sectionId) => {
          const section = sectionMetaMap[sectionId]
          if (!section) return null

          const isExpanded = expandedSections.includes(sectionId)
          const regenerateConfig = getRegenerationConfig(sectionId)
          const isRegenerating = isRegeneratingSection === sectionId

          return (
            <div
              key={sectionId}
              className="relative rounded-xl border border-border bg-muted/40 overflow-hidden"
              onDragOver={(event) => {
                if (!draggedSectionRef.current || draggedSectionRef.current === sectionId) return
                event.preventDefault()
                const rect = event.currentTarget.getBoundingClientRect()
                const position: DragPosition = event.clientY - rect.top < rect.height / 2 ? "before" : "after"
                setDragIndicator({ sectionId, position })
              }}
              onDrop={(event) => {
                event.preventDefault()
                if (!dragIndicator || dragIndicator.sectionId !== sectionId) return
                reorderSections(sectionId, dragIndicator.position)
                draggedSectionRef.current = ""
                setDragIndicator(null)
              }}
              onDragLeave={() => {
                if (dragIndicator?.sectionId === sectionId) {
                  setDragIndicator(null)
                }
              }}
            >
              {dragIndicator?.sectionId === sectionId && (
                <div
                  className={cn(
                    "absolute left-2 right-2 h-0.5 bg-blue-500 z-20",
                    dragIndicator.position === "before" ? "top-0" : "bottom-0"
                  )}
                />
              )}

              <div className="flex items-center gap-3 px-3 py-3 cursor-pointer" onClick={() => toggleSection(sectionId)}>
                <button
                  type="button"
                  draggable
                  onClick={(event) => event.stopPropagation()}
                  onDragStart={(event) => {
                    draggedSectionRef.current = sectionId
                    event.dataTransfer.effectAllowed = "move"
                  }}
                  onDragEnd={() => {
                    draggedSectionRef.current = ""
                    setDragIndicator(null)
                  }}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Drag section"
                >
                  <GripVertical className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="truncate font-medium">{section.title}</span>
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </div>

                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>

              {isExpanded && (
                <div className="border-t border-border bg-background px-3 pb-3 pt-3 space-y-4">
                  {renderSectionContent(sectionId)}

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(sectionId)}
                      className="text-sm text-red-500 hover:text-red-400"
                    >
                      Remove Section
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        void handleRegenerate(sectionId)
                      }}
                      disabled={!regenerateConfig || isRegenerating}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-white",
                        "bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {isRegenerating ? "Regenerating..." : "Regenerate"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

