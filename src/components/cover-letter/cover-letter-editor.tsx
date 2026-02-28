"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import {
  ChevronDown,
  ChevronUp,
  Download,
  Maximize2,
  Minus,
  Palette,
  Plus,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RichTextEditor } from "@/components/resume-editor/rich-text-editor"
import {
  renderCoverLetter,
  COVER_LETTER_TEMPLATES,
  COVER_LETTER_FONTS,
  FONT_FAMILY_MAP,
  type CoverLetterContact,
  type CoverLetterRecipient,
  type CoverLetterTemplate,
  type CoverLetterTemplateCategory,
} from "./cover-letter-templates"

// ---- Accent Colors ----

const ACCENT_COLORS = [
  "#1e3a5f", "#2563eb", "#1d4ed8", "#0ea5e9",
  "#059669", "#16a34a", "#65a30d", "#ca8a04",
  "#ea580c", "#dc2626", "#e11d48", "#9333ea",
  "#7c3aed", "#4f46e5", "#0891b2", "#334155",
]

// ---- Template Modal Filter ----

type FilterCategory = "All" | CoverLetterTemplateCategory

const FILTER_CATEGORIES: FilterCategory[] = [
  "All",
  "Eye-Catchers",
  "No-Nonsense",
  "Tried & True",
  "Clean & Simple",
  "Cool & Quirky",
  "Story Tellers",
]

// ---- Font size options ----
const FONT_SIZE_OPTIONS = Array.from({ length: 9 }, (_, i) => 8 + i)

// ---- Default field configs ----
const DEFAULT_CONTACT_FIELDS = [
  { key: "fullName", label: "Full Name" },
  { key: "functionalTitle", label: "Functional Title" },
  { key: "industryTitle", label: "Industry Title" },
  { key: "city", label: "City" },
  { key: "phone", label: "Phone Number" },
  { key: "email", label: "Email" },
  { key: "linkedin", label: "LinkedIn" },
]

const DEFAULT_RECIPIENT_FIELDS = [
  { key: "fullName", label: "Full Name" },
  { key: "position", label: "Position" },
  { key: "addressLine1", label: "Address Line 1" },
  { key: "addressLine2", label: "Address Line 2" },
  { key: "city", label: "City" },
]

// ---- Component ----

export function CoverLetterEditor() {
  const router = useRouter()
  const previewRef = useRef<HTMLDivElement>(null)
  const previewContainerRef = useRef<HTMLDivElement>(null)

  // Editor state
  const [contact, setContact] = useState<CoverLetterContact>({
    fullName: "John Doe",
    functionalTitle: "Photographer",
    industryTitle: "Visual Arts",
    city: "Los Angeles",
    phone: "123-456-7890",
    email: "johndoe@example.com",
    linkedin: "linkedin.com/in/johndoe",
  })

  const [recipient, setRecipient] = useState<CoverLetterRecipient>({
    fullName: "Jane Smith",
    position: "Hiring Manager",
    addressLine1: "123 Creative Lane",
    addressLine2: "Suite 100",
    city: "Los Angeles",
  })

  const [letterContent, setLetterContent] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("bold")
  const [accentColor, setAccentColor] = useState("#1e3a5f")
  const [fontSize, setFontSize] = useState(10)
  const [fontFamily, setFontFamily] = useState<string>("Bitter")
  const [zoom, setZoom] = useState(1)

  // Accordion state
  const [contactOpen, setContactOpen] = useState(true)
  const [recipientOpen, setRecipientOpen] = useState(false)
  const [contentOpen, setContentOpen] = useState(false)

  // Custom fields
  const [contactFields, setContactFields] = useState(DEFAULT_CONTACT_FIELDS)
  const [recipientFields, setRecipientFields] = useState(DEFAULT_RECIPIENT_FIELDS)

  // Dropdowns
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false)
  const [showFontDropdown, setShowFontDropdown] = useState(false)
  const [showPageDropdown, setShowPageDropdown] = useState(false)

  // Filter state for template modal
  const [templateFilter, setTemplateFilter] = useState<FilterCategory>("All")

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("hiredfast_cover_letter_draft")
      if (!raw) return
      const data = JSON.parse(raw)
      if (data.letterContent) setLetterContent(data.letterContent)
    } catch {
      // ignore
    }
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest("[data-dropdown]")) {
        setShowColorPicker(false)
        setShowFontSizeDropdown(false)
        setShowFontDropdown(false)
        setShowPageDropdown(false)
      }
    }
    document.addEventListener("click", handler)
    return () => document.removeEventListener("click", handler)
  }, [])

  // ---- Handlers ----

  const updateContact = (key: string, value: string) => {
    setContact((prev) => ({ ...prev, [key]: value }))
  }

  const updateRecipient = (key: string, value: string) => {
    setRecipient((prev) => ({ ...prev, [key]: value }))
  }

  const removeContactField = (key: string) => {
    setContactFields((prev) => prev.filter((f) => f.key !== key))
    setContact((prev) => {
      const copy = { ...prev }
      delete copy[key]
      return copy
    })
  }

  const removeRecipientField = (key: string) => {
    setRecipientFields((prev) => prev.filter((f) => f.key !== key))
    setRecipient((prev) => {
      const copy = { ...prev }
      delete copy[key]
      return copy
    })
  }

  const addContactField = () => {
    const id = `custom_${Date.now()}`
    setContactFields((prev) => [...prev, { key: id, label: "New Field" }])
    setContact((prev) => ({ ...prev, [id]: "" }))
  }

  const addRecipientField = () => {
    const id = `custom_${Date.now()}`
    setRecipientFields((prev) => [...prev, { key: id, label: "New Field" }])
    setRecipient((prev) => ({ ...prev, [id]: "" }))
  }

  const handleExpandAll = () => {
    setContactOpen(true)
    setRecipientOpen(true)
    setContentOpen(true)
  }

  const handleCollapseAll = () => {
    setContactOpen(false)
    setRecipientOpen(false)
    setContentOpen(false)
  }

  const handleDownload = async () => {
    if (!previewRef.current) return
    try {
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgHeight = (canvas.height * pdfWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight)
      heightLeft -= pdfHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight)
        heightLeft -= pdfHeight
      }

      pdf.save("cover-letter.pdf")
    } catch (err) {
      console.error("PDF generation failed:", err)
    }
  }

  const handleFullscreen = () => {
    if (previewContainerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        previewContainerRef.current.requestFullscreen()
      }
    }
  }

  // ---- Preview HTML ----
  const previewHtml = useMemo(() => {
    return renderCoverLetter({
      contact,
      recipient,
      content: letterContent,
      templateId: selectedTemplate,
      accentColor,
      fontSize,
      fontFamily,
    })
  }, [contact, recipient, letterContent, selectedTemplate, accentColor, fontSize, fontFamily])

  // ---- Filtered templates ----
  const filteredTemplates = useMemo(() => {
    if (templateFilter === "All") return COVER_LETTER_TEMPLATES
    return COVER_LETTER_TEMPLATES.filter((t) => t.category === templateFilter)
  }, [templateFilter])

  const selectedTemplateName = COVER_LETTER_TEMPLATES.find((t) => t.id === selectedTemplate)?.name || "Bold Template"

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* ====== LEFT PANEL - Editor ====== */}
        <aside className="w-full md:w-[35%] md:min-w-[320px] md:max-w-[420px] border-r bg-background flex flex-col">
          {/* Expand/Collapse buttons */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExpandAll}
              className="gap-1.5 text-xs"
            >
              <ChevronDown className="h-3.5 w-3.5" /> Expand All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCollapseAll}
              className="gap-1.5 text-xs"
            >
              <ChevronUp className="h-3.5 w-3.5" /> Collapse All
            </Button>
          </div>

          {/* Scrollable sections */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Contact Details */}
            <div className="rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setContactOpen(!contactOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <span className="font-semibold text-sm text-foreground">Contact Details</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    contactOpen && "rotate-180"
                  )}
                />
              </button>
              {contactOpen && (
                <div className="p-4 space-y-3">
                  {contactFields.map((field) => (
                    <div key={field.key} className="flex items-center gap-2">
                      <span className="shrink-0 text-[11px] font-medium text-muted-foreground bg-muted px-2 py-1 rounded w-[90px] truncate">
                        {field.label}
                      </span>
                      <Input
                        value={contact[field.key] || ""}
                        onChange={(e) => updateContact(field.key, e.target.value)}
                        className="h-8 text-sm flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeContactField(field.key)}
                        className="h-6 w-6 shrink-0 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addContactField}
                    className="text-xs text-green-500 hover:text-green-400 font-medium flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Field
                  </button>
                </div>
              )}
            </div>

            {/* Recipient Details */}
            <div className="rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setRecipientOpen(!recipientOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <span className="font-semibold text-sm text-foreground">Recipient Details</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    recipientOpen && "rotate-180"
                  )}
                />
              </button>
              {recipientOpen && (
                <div className="p-4 space-y-3">
                  {recipientFields.map((field) => (
                    <div key={field.key} className="flex items-center gap-2">
                      <span className="shrink-0 text-[11px] font-medium text-muted-foreground bg-muted px-2 py-1 rounded w-[90px] truncate">
                        {field.label}
                      </span>
                      <Input
                        value={recipient[field.key] || ""}
                        onChange={(e) => updateRecipient(field.key, e.target.value)}
                        className="h-8 text-sm flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeRecipientField(field.key)}
                        className="h-6 w-6 shrink-0 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addRecipientField}
                    className="text-xs text-green-500 hover:text-green-400 font-medium flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Field
                  </button>
                </div>
              )}
            </div>

            {/* Cover Letter Content */}
            <div className="rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setContentOpen(!contentOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <span className="font-semibold text-sm text-foreground">Cover Letter Content</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    contentOpen && "rotate-180"
                  )}
                />
              </button>
              {contentOpen && (
                <div className="p-4">
                  <RichTextEditor
                    value={letterContent}
                    onChange={setLetterContent}
                    placeholder="Your cover letter content..."
                  />
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ====== RIGHT PANEL - Preview ====== */}
        <section
          ref={previewContainerRef}
          className="flex-1 bg-muted/30 flex flex-col overflow-hidden relative min-h-[400px] md:min-h-0"
        >
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background shrink-0 flex-wrap gap-2">
            {/* Left controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Template selector */}
              <div className="relative" data-dropdown>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTemplateModal(true)}
                  className="gap-1.5 text-xs"
                >
                  {selectedTemplateName} <ChevronDown className="h-3 w-3" />
                </Button>
              </div>

              {/* Color picker */}
              <div className="relative" data-dropdown>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowColorPicker(!showColorPicker)
                  }}
                  className="h-8 w-8 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Palette className="h-4 w-4 text-muted-foreground" />
                </button>
                {showColorPicker && (
                  <div className="absolute top-10 left-0 z-50 bg-popover border border-border rounded-lg p-3 shadow-xl grid grid-cols-4 gap-1.5 w-[140px]">
                    {ACCENT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setAccentColor(color)
                          setShowColorPicker(false)
                        }}
                        className={cn(
                          "h-6 w-6 rounded-full border-2 transition-all",
                          accentColor === color
                            ? "border-white ring-2 ring-blue-500"
                            : "border-transparent hover:scale-110"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Page count */}
              <div className="relative" data-dropdown>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowPageDropdown(!showPageDropdown)
                  }}
                  className="gap-1.5 text-xs"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="2" width="16" height="20" rx="2" />
                    <line x1="8" y1="6" x2="16" y2="6" />
                    <line x1="8" y1="10" x2="16" y2="10" />
                    <line x1="8" y1="14" x2="12" y2="14" />
                  </svg>
                  1 <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Font size */}
              <div className="relative" data-dropdown>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowFontSizeDropdown(!showFontSizeDropdown)
                  }}
                  className="gap-1 text-xs"
                >
                  Aa {fontSize} <ChevronDown className="h-3 w-3" />
                </Button>
                {showFontSizeDropdown && (
                  <div className="absolute top-10 right-0 z-50 bg-popover border border-border rounded-lg shadow-xl py-1 max-h-[200px] overflow-y-auto w-[80px]">
                    {FONT_SIZE_OPTIONS.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          setFontSize(size)
                          setShowFontSizeDropdown(false)
                        }}
                        className={cn(
                          "w-full px-3 py-1.5 text-xs text-left hover:bg-muted transition-colors",
                          fontSize === size && "bg-muted font-semibold"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Font family */}
              <div className="relative" data-dropdown>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowFontDropdown(!showFontDropdown)
                  }}
                  className="gap-1 text-xs w-[100px]"
                >
                  <span className="truncate">T {fontFamily}</span>
                  <ChevronDown className="h-3 w-3 shrink-0" />
                </Button>
                {showFontDropdown && (
                  <div className="absolute top-10 right-0 z-50 bg-popover border border-border rounded-lg shadow-xl py-1 max-h-[250px] overflow-y-auto w-[160px]">
                    {COVER_LETTER_FONTS.map((font) => (
                      <button
                        key={font}
                        type="button"
                        onClick={() => {
                          setFontFamily(font)
                          setShowFontDropdown(false)
                        }}
                        className={cn(
                          "w-full px-3 py-1.5 text-xs text-left hover:bg-muted transition-colors",
                          fontFamily === font && "bg-muted font-semibold"
                        )}
                        style={{ fontFamily: FONT_FAMILY_MAP[font] }}
                      >
                        {font}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button
                type="button"
                onClick={handleFullscreen}
                className="h-8 w-8 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
              >
                <Maximize2 className="h-4 w-4" />
              </button>

              {/* Download */}
              <Button
                size="sm"
                onClick={handleDownload}
                className="bg-green-600 hover:bg-green-700 text-white gap-1.5 text-xs"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
            </div>
          </div>

          {/* Preview area */}
          <div className="flex-1 overflow-auto p-6 flex justify-center items-start">
            <div
              ref={previewRef}
              className="bg-white shadow-2xl w-full max-w-[650px] origin-top transition-transform"
              style={{
                aspectRatio: "1/1.414",
                transform: `scale(${zoom})`,
                fontFamily: FONT_FAMILY_MAP[fontFamily],
              }}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>

          {/* Zoom controls */}
          <div className="absolute bottom-6 right-6 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              className="h-10 w-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors text-foreground"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
              className="h-10 w-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors text-foreground"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </section>
      </main>

      {/* ====== Template Selection Modal ====== */}
      {showTemplateModal && (
        <div
          className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowTemplateModal(false)}
        >
          <div
            className="bg-popover rounded-2xl w-[95vw] sm:max-w-5xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h3 className="text-xl font-bold text-foreground">Select a Template</h3>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter tabs */}
            <div className="px-6 py-3 border-b border-border flex flex-wrap gap-2 shrink-0">
              {FILTER_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setTemplateFilter(cat)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm transition-colors border",
                    templateFilter === cat
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-transparent border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Template grid */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => {
                      setSelectedTemplate(template.id)
                      setShowTemplateModal(false)
                    }}
                    className={cn(
                      "text-left rounded-xl overflow-hidden border-2 transition-all hover:shadow-lg",
                      selectedTemplate === template.id
                        ? "border-blue-500 ring-2 ring-blue-400"
                        : "border-transparent hover:border-border"
                    )}
                  >
                    {/* Mini preview */}
                    <div
                      className="relative bg-white overflow-hidden"
                      style={{ aspectRatio: "0.707" }}
                    >
                      <div
                        className="w-full h-full origin-top-left"
                        style={{ transform: "scale(0.25)", transformOrigin: "top left", width: "400%", height: "400%" }}
                        dangerouslySetInnerHTML={{
                          __html: renderCoverLetter({
                            contact,
                            recipient,
                            content: letterContent.slice(0, 200) || "Dear Hiring Manager,\n\nI am writing to express my interest in the position...",
                            templateId: template.id,
                            accentColor,
                            fontSize: 10,
                            fontFamily,
                          }),
                        }}
                      />
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-sm text-foreground">{template.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                        {template.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
