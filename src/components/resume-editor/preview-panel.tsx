"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import {
  AlignJustify,
  ChevronDown,
  ChevronRight,
  Download,
  Loader2,
  Palette,
  Type,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ResumeData, useResumeBuilder } from "@/hooks/use-resume-builder"
import { TEMPLATE_OPTIONS, renderLayout } from "./render-layout"
import { TemplateSelectionModal } from "./template-selection-modal"

type ScoreCategory = {
  name: string
  score: number
  maxScore: number
  feedback: string[]
}

const FONT_OPTIONS = [
  "Roboto",
  "Merriweather",
  "Montserrat",
  "PT Sans",
  "Raleway",
  "IBM Plex Sans",
  "Alegreya",
  "Karla",
  "Bitter",
  "DM Sans",
  "EB Garamond",
] as const

const FONT_FAMILY_MAP: Record<(typeof FONT_OPTIONS)[number], string> = {
  Roboto: "'Roboto', sans-serif",
  Merriweather: "'Merriweather', serif",
  Montserrat: "'Montserrat', sans-serif",
  "PT Sans": "'PT Sans', sans-serif",
  Raleway: "'Raleway', sans-serif",
  "IBM Plex Sans": "'IBM Plex Sans', sans-serif",
  Alegreya: "'Alegreya', serif",
  Karla: "'Karla', sans-serif",
  Bitter: "'Bitter', serif",
  "DM Sans": "'DM Sans', sans-serif",
  "EB Garamond": "'EB Garamond', serif",
}

const lineSpacingOptions = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]
const fontSizeOptions = Array.from({ length: 13 }, (_, index) => 8 + index * 0.5)

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()

const serializeResumeToText = (data: ResumeData): string => {
  const workExperienceText = data.workExperienceRich
    ? stripHtml(data.workExperienceRich)
    : data.workExperience
        .map((experience) =>
          [
            `${experience.role} at ${experience.company}`,
            `${experience.startDate} - ${experience.current ? "Present" : experience.endDate}`,
            stripHtml(experience.achievements),
          ]
            .filter(Boolean)
            .join("\n")
        )
        .join("\n\n")

  const educationText = data.educationRich
    ? stripHtml(data.educationRich)
    : data.education
        .map((education) =>
          [
            `${education.degree} - ${education.school}`,
            `${education.admissionYear} - ${education.graduationYear}`,
            stripHtml(education.description),
          ]
            .filter(Boolean)
            .join("\n")
        )
        .join("\n\n")

  const skillsText = data.skillsRich || data.skills.technical || data.skills.soft

  return [
    "[PERSONAL INFO]",
    `Name: ${data.personalInfo.fullName}`,
    `Functional Title: ${data.personalInfo.functionalTitle}`,
    `Industry Title: ${data.personalInfo.industryTitle}`,
    `Email: ${data.personalInfo.email}`,
    `Phone: ${data.personalInfo.phone}`,
    `Address: ${data.personalInfo.address}`,
    `LinkedIn: ${data.personalInfo.linkedin}`,
    `Portfolio: ${data.personalInfo.portfolio}`,
    "",
    "[SUMMARY]",
    stripHtml(data.summary),
    "",
    "[CORE COMPETENCIES]",
    stripHtml(data.coreCompetencies),
    "",
    "[PROFESSIONAL EXPERIENCE]",
    workExperienceText,
    "",
    "[EDUCATION]",
    educationText,
    "",
    "[TECHNICAL SKILLS]",
    stripHtml(skillsText),
    "",
    "[ACHIEVEMENTS]",
    stripHtml(data.achievements),
    "",
    "[PROJECTS]",
    data.projects.map((project) => `${project.title}: ${project.description}`).join("\n"),
    "",
    "[LANGUAGES]",
    data.languages.map((language) => `${language.name} - ${language.proficiency}`).join("\n"),
    "",
    "[CERTIFICATIONS]",
    data.certifications.map((certification) => `${certification.name} - ${certification.issuer}`).join("\n"),
    "",
    "[ASSOCIATIONS]",
    data.associations.map((association) => `${association.name} - ${association.role}`).join("\n"),
    "",
    "[CUSTOM SECTIONS]",
    data.customSections.map((section) => `${section.title}: ${stripHtml(section.content)}`).join("\n"),
  ].join("\n")
}

const getScoreRingColor = (score: number | null) => {
  if (score === null) return "#64748b"
  if (score >= 80) return "#15803d"
  if (score >= 60) return "#92400e"
  return "#ef4444"
}

const getScoreStatus = (score: number | null) => {
  if (score === null) return { label: "Needs Data", className: "text-slate-400" }
  if (score >= 80) return { label: "Ready to Apply", className: "text-green-700" }
  if (score >= 60) return { label: "Almost There", className: "text-amber-800" }
  return { label: "Needs Work", className: "text-red-500" }
}

const ACCENT_COLORS = [
  "#64748b", "#6b7280", "#57534e", "#78716c", "#44403c",
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#2563eb", "#4f46e5", "#7c3aed", "#9333ea", "#db2777",
  "#e11d48", "#dc2626",
]

export function PreviewPanel() {
  const { resumeData, hiddenSections } = useResumeBuilder()

  const [scale, setScale] = useState(typeof window !== "undefined" && window.innerWidth < 768 ? 0.4 : 0.8)
  const [templateId, setTemplateId] = useState("modern")
  const [accentColor, setAccentColor] = useState("#2563eb")
  const [lineSpacing, setLineSpacing] = useState(2.5)
  const [fontSize, setFontSize] = useState(11.5)
  const [font, setFont] = useState<(typeof FONT_OPTIONS)[number]>("Bitter")
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<"lineSpacing" | "fontSize" | "font" | "">("")
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [preferencesLoaded, setPreferencesLoaded] = useState(false)
  const [showScorePanel, setShowScorePanel] = useState(false)
  const [expandedCategoryName, setExpandedCategoryName] = useState("")
  const [analysisRefreshToken, setAnalysisRefreshToken] = useState(0)

  const [aiScore, setAiScore] = useState<number | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [scoreCategories, setScoreCategories] = useState<ScoreCategory[]>([])


  const resumeRef = useRef<HTMLDivElement | null>(null)
  const colorPickerRef = useRef<HTMLDivElement | null>(null)
  const toolbarRef = useRef<HTMLDivElement | null>(null)
  const userAdjustedScale = useRef(false)
  const previewContainerRef = useRef<HTMLDivElement | null>(null)

  const currentTemplateName =
    TEMPLATE_OPTIONS.find((template) => template.id === templateId)?.name ?? "Select Template"

  const handleDownload = async () => {
    if (!resumeRef.current) return

    try {
      const canvas = await html2canvas(resumeRef.current, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgHeight = (canvas.height * pdfWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight)
      heightLeft -= pdfHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight)
        heightLeft -= pdfHeight
      }

      pdf.save("resume.pdf")
    } catch (error) {
      console.error("PDF generation failed:", error)
    }
  }

  useEffect(() => {
    const fontsLinkId = "hiredfast-google-fonts"
    if (document.getElementById(fontsLinkId)) return

    const link = document.createElement("link")
    link.id = fontsLinkId
    link.rel = "stylesheet"
    link.href =
      "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Merriweather:wght@400;700&family=Montserrat:wght@400;700&family=PT+Sans:wght@400;700&family=Raleway:wght@400;700&family=IBM+Plex+Sans:wght@400;700&family=Alegreya:wght@400;700&family=Karla:wght@400;700&family=Bitter:wght@400;700&family=DM+Sans:wght@400;700&family=EB+Garamond:wght@400;700&display=swap"

    document.head.appendChild(link)
  }, [])

  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem("hiredfast_resume_preferences")
      if (savedPreferences) {
        const parsed = JSON.parse(savedPreferences) as {
          templateId?: string
          template?: string
          accentColor?: string
          lineSpacing?: number
          fontSize?: number
          font?: (typeof FONT_OPTIONS)[number]
        }

        if (typeof parsed.templateId === "string") {
          setTemplateId(parsed.templateId)
        } else if (typeof parsed.template === "string") {
          setTemplateId(parsed.template)
        }

        if (typeof parsed.accentColor === "string" && /^#[0-9A-Fa-f]{6}$/.test(parsed.accentColor)) {
          setAccentColor(parsed.accentColor)
        }

        if (typeof parsed.lineSpacing === "number" && lineSpacingOptions.includes(parsed.lineSpacing)) {
          setLineSpacing(parsed.lineSpacing)
        }

        if (typeof parsed.fontSize === "number" && fontSizeOptions.includes(parsed.fontSize)) {
          setFontSize(parsed.fontSize)
        }

        if (typeof parsed.font === "string" && FONT_OPTIONS.includes(parsed.font as (typeof FONT_OPTIONS)[number])) {
          setFont(parsed.font as (typeof FONT_OPTIONS)[number])
        }
      }
    } catch {
      // Ignore malformed preference payload
    } finally {
      setPreferencesLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!preferencesLoaded) return

    try {
      localStorage.setItem(
        "hiredfast_resume_preferences",
        JSON.stringify({ templateId, accentColor, lineSpacing, fontSize, font })
      )
    } catch {
      // Ignore localStorage write failures
    }
  }, [templateId, accentColor, lineSpacing, fontSize, font, preferencesLoaded])

  useEffect(() => {
    if (analysisRefreshToken === 0) return // Don't auto-run on mount

    const controller = new AbortController()
    let isMounted = true

    const runAnalysis = async () => {
      const resumeText = serializeResumeToText(resumeData)
      if (resumeText.length < 100) {
        if (isMounted) {
          setAiScore(null)
          setScoreCategories([])
          setIsAnalyzing(false)
        }
        return
      }

      if (isMounted) setIsAnalyzing(true)

      try {
        const response = await fetch("/api/analyze-resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeText }),
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error("Failed to analyze resume")
        }

        const result = (await response.json()) as { totalScore: number; categories: ScoreCategory[] }

        if (isMounted) {
          setAiScore(result.totalScore)
          setScoreCategories(result.categories)
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
        if (isMounted) setIsAnalyzing(false)
      } finally {
        if (!controller.signal.aborted && isMounted) {
          setIsAnalyzing(false)
        }
      }
    }

    void runAnalysis()

    return () => {
      isMounted = false
      controller.abort()
      setIsAnalyzing(false)
    }
  }, [analysisRefreshToken]) // ONLY re-run when user clicks Recalculate

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (toolbarRef.current && !toolbarRef.current.contains(target)) {
        setActiveDropdown("")
      }

      if (colorPickerRef.current && !colorPickerRef.current.contains(target)) {
        setShowColorPicker(false)
      }
    }

    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [])

  useEffect(() => {
    if (!previewContainerRef.current) return
    const observer = new ResizeObserver(([entry]) => {
      if (userAdjustedScale.current) return
      const containerWidth = entry.contentRect.width
      if (containerWidth > 0) {
        // 794px = 210mm at 96dpi
        const padding = 96 // account for p-12 (3rem * 2 sides)
        const availableWidth = containerWidth - padding
        setScale(Math.min(1, availableWidth / 794))
      }
    })
    observer.observe(previewContainerRef.current)
    return () => observer.disconnect()
  }, [])

  const scoreColor = getScoreRingColor(aiScore)
  const scoreStatus = getScoreStatus(aiScore)

  const scorePillBorderClass =
    aiScore === null
      ? "border-slate-500"
      : aiScore >= 80
        ? "border-green-700"
        : aiScore >= 60
          ? "border-amber-800"
          : "border-red-500"

  const toggleDropdown = (name: "lineSpacing" | "fontSize" | "font") => {
    setActiveDropdown((current) => (current === name ? "" : name))
  }

  const progress = aiScore ?? 0
  const circumference = 2 * Math.PI * 42
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const renderedLayout = useMemo(
    () => renderLayout(templateId, resumeData, accentColor, hiddenSections),
    [templateId, resumeData, accentColor, hiddenSections]
  )

  const resumeStyles = useMemo(
    () => ({
      width: "794px",
      minHeight: "1123px",
      transform: `scale(${scale})`,
      transformOrigin: "top center",
      fontFamily: FONT_FAMILY_MAP[font],
      fontSize: `${fontSize}pt`,
      lineHeight: lineSpacing,
    }),
    [scale, font, fontSize, lineSpacing]
  )

  return (
    <div className="flex h-full flex-col relative">
      <TemplateSelectionModal
        open={isTemplateModalOpen}
        onOpenChange={setIsTemplateModalOpen}
        selectedTemplateId={templateId}
        onSelectTemplate={setTemplateId}
        accentColor={accentColor}
      />

      <div className="border-b bg-background px-4 shrink-0">
        {/* Row 1: Template + Color */}
        <div className="flex flex-wrap gap-2 py-2 items-center">
          <div className="min-w-0 flex-shrink-0">
          <Button
            variant="outline"
            className="min-w-[190px] justify-between bg-muted border-border"
            onClick={() => setIsTemplateModalOpen(true)}
          >
            <span className="truncate">{currentTemplateName}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
          </div>

          <div className="min-w-0 flex-shrink-0 relative" ref={colorPickerRef}>
            <button
              type="button"
              onClick={() => setShowColorPicker((current) => !current)}
              className="h-10 w-10 rounded-lg border border-border bg-muted inline-flex items-center justify-center"
              aria-label="Accent color"
            >
              <Palette className="h-4 w-4" />
            </button>

            {showColorPicker && (
              <div className="absolute left-0 top-full z-40 mt-2 rounded-xl border border-border bg-popover p-0 shadow-xl">
                <div className="grid grid-cols-5 gap-2.5 p-4 min-w-[240px]">
                  {ACCENT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setAccentColor(color)
                        setShowColorPicker(false)
                      }}
                      className="relative h-9 w-9 rounded-full border-2 transition-all"
                      style={{
                        backgroundColor: color,
                        borderColor: accentColor === color ? "#ffffff" : "transparent",
                      }}
                    >
                      {accentColor === color && (
                        <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Spacing + Font + Download */}
        <div className="flex flex-wrap gap-2 pb-2 items-center">
          <div className="min-w-0 flex-shrink-0 relative">
            <button
              type="button"
              onClick={() => toggleDropdown("lineSpacing")}
              className="h-10 rounded-lg border border-border bg-muted px-3 text-sm inline-flex items-center gap-2"
            >
              <AlignJustify className="h-4 w-4" />
              <span>{lineSpacing}</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {activeDropdown === "lineSpacing" && (
              <div className="absolute left-0 top-full mt-2 max-h-64 overflow-auto rounded-lg border border-border bg-popover p-1 shadow-xl z-40 min-w-[110px]">
                {lineSpacingOptions.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setLineSpacing(value)
                      setActiveDropdown("")
                    }}
                    className={cn(
                      "w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted",
                      lineSpacing === value && "bg-muted"
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-shrink-0 relative">
            <button
              type="button"
              onClick={() => toggleDropdown("fontSize")}
              className="h-10 rounded-lg border border-border bg-muted px-3 text-sm inline-flex items-center gap-2"
            >
              <span className="font-semibold">Aa</span>
              <span>{fontSize}</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {activeDropdown === "fontSize" && (
              <div className="absolute left-0 top-full mt-2 max-h-64 overflow-auto rounded-lg border border-border bg-popover p-1 shadow-xl z-40 min-w-[110px]">
                {fontSizeOptions.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setFontSize(value)
                      setActiveDropdown("")
                    }}
                    className={cn(
                      "w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted",
                      fontSize === value && "bg-muted"
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-shrink-0 relative">
            <button
              type="button"
              onClick={() => toggleDropdown("font")}
              className="h-10 rounded-lg border border-border bg-muted px-3 text-sm inline-flex items-center gap-2"
            >
              <Type className="h-4 w-4" />
              <span>{font}</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {activeDropdown === "font" && (
              <div className="absolute right-0 top-full mt-2 max-h-64 overflow-auto rounded-lg border border-border bg-popover p-1 shadow-xl z-40 min-w-[180px]">
                {FONT_OPTIONS.map((fontName) => (
                  <button
                    key={fontName}
                    type="button"
                    onClick={() => {
                      setFont(fontName)
                      setActiveDropdown("")
                    }}
                    className={cn(
                      "w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted",
                      font === fontName && "bg-muted"
                    )}
                    style={{ fontFamily: FONT_FAMILY_MAP[fontName] }}
                  >
                    {fontName}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="ml-auto flex-shrink-0">
          <Button className="h-10 gap-2" onClick={handleDownload}>
            <Download className="h-4 w-4" /> Download
          </Button>
          </div>
        </div>
      </div>

      <div ref={previewContainerRef} className="relative flex-1 overflow-auto overflow-x-hidden bg-muted/50 p-8 md:p-12 flex items-start justify-center">
        {!showScorePanel ? (
          <button
            type="button"
            onClick={() => setShowScorePanel(true)}
            className={cn(
              "absolute top-6 right-6 z-20 rounded-xl border bg-background px-4 py-3 text-left shadow-lg flex items-center gap-3",
              scorePillBorderClass
            )}
          >
            <div>
              <p className="text-sm font-semibold">Resume Score</p>
              <p className="text-sm font-bold">
                {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : `${aiScore ?? 0}/100`}
              </p>
            </div>
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <div className="absolute top-6 right-6 z-20 w-80 rounded-xl border border-border bg-background p-4 shadow-xl">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowScorePanel(false)}
                className="rounded-md p-1 hover:bg-muted"
                aria-label="Collapse resume score"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col items-center">
              <svg viewBox="0 0 100 100" className="h-28 w-28">
                <circle cx="50" cy="50" r="42" stroke="#1f2937" strokeWidth="8" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke={scoreColor}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
                <text x="50" y="54" textAnchor="middle" className="fill-current text-lg font-bold text-foreground">
                  {isAnalyzing ? "..." : aiScore ?? 0}
                </text>
              </svg>
              <p className={cn("text-sm font-semibold", scoreStatus.className)}>{scoreStatus.label}</p>

              <button
                type="button"
                onClick={() => setAnalysisRefreshToken((current) => current + 1)}
                disabled={isAnalyzing}
                className="mt-3 rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                ? Recalculate Score
              </button>
            </div>

            <div className="mt-4">
              <p className="text-sm font-semibold mb-2">Score Breakdown</p>
              <div className="space-y-2">
                {scoreCategories.map((category) => {
                  const categoryProgress = category.maxScore
                    ? Math.min(100, (category.score / category.maxScore) * 100)
                    : 0
                  const categoryColor =
                    categoryProgress >= 80 ? "bg-green-500" : categoryProgress >= 60 ? "bg-yellow-500" : "bg-red-500"
                  const isExpanded = expandedCategoryName === category.name

                  return (
                    <div key={category.name} className="rounded-lg border border-border">
                      <button
                        type="button"
                        onClick={() => setExpandedCategoryName((current) => (current === category.name ? "" : category.name))}
                        className="w-full p-2 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium w-28 truncate">{category.name}</span>
                          <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                            <div
                              role="progressbar"
                              aria-valuenow={category.score}
                              aria-valuemin={0}
                              aria-valuemax={category.maxScore}
                              aria-label={`${category.name} score: ${category.score} out of ${category.maxScore}`}
                              className={cn("h-full", categoryColor)} style={{ width: `${categoryProgress}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{category.score}/{category.maxScore}</span>
                          <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                        </div>
                      </button>

                      {isExpanded && (
                        <ul className="px-4 pb-3 text-xs text-muted-foreground list-disc space-y-1">
                          {category.feedback.map((item, index) => (
                            <li key={`${category.name}-${index}`}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        <div
          className="w-full overflow-x-hidden flex justify-center"
          style={{ height: `${scale * 1123}px` }}
        >
          <div ref={resumeRef} className="bg-white shadow-2xl transition-transform duration-200" style={resumeStyles}>
            {renderedLayout}
          </div>
        </div>
      </div>

      <div className="absolute bottom-20 right-8 z-30 flex items-center rounded-full border border-border bg-background px-2 py-2 shadow-lg shrink-0">
        <button
          type="button"
          onClick={() => {
            userAdjustedScale.current = true
            setScale((current) => Math.max(0.4, current - 0.1))
          }}
          className="h-10 w-10 rounded-full inline-flex items-center justify-center hover:bg-muted"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-5 w-5" />
        </button>
        <div className="px-2 text-xs font-semibold text-muted-foreground min-w-12 text-center">
          {Math.round(scale * 100)}%
        </div>
        <button
          type="button"
          onClick={() => {
            userAdjustedScale.current = true
            setScale((current) => Math.min(1.5, current + 0.1))
          }}
          className="h-10 w-10 rounded-full inline-flex items-center justify-center hover:bg-muted"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

