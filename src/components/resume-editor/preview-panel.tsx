"use client"

import { useEffect, useRef, useState } from "react"
import { useResumeBuilder, ResumeData } from "@/hooks/use-resume-builder"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, ZoomIn, ZoomOut, Type, Palette, ChevronDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { useDebounce } from "use-debounce"

import { TemplateSelectionModal } from "./template-selection-modal"

type ScoreCategory = {
  name: string
  score: number
  maxScore: number
  feedback: string[]
}

const serializeResumeToText = (data: ResumeData): string => {
  const workExperienceText = data.workExperience
    .map((exp) => [
      `Role: ${exp.role} at ${exp.company}`,
      `Period: ${exp.startDate} - ${exp.current ? "Present" : exp.endDate}`,
      exp.achievements,
    ].filter(Boolean).join("\n"))
    .join("\n\n")

  const educationText = data.education
    .map((edu) => `${edu.school} - ${edu.degree} (${edu.graduationYear})`)
    .join("\n")

  const projectsText = data.projects
    .map((project) => `${project.title}: ${project.description}`)
    .join("\n")

  const languagesText = data.languages
    .map((lang) => `${lang.name} - ${lang.proficiency}`)
    .join("\n")

  const certificationsText = data.certifications
    .map((cert) => `${cert.name} by ${cert.issuer} (${cert.year})`)
    .join("\n")

  const associationsText = data.associations
    .map((assoc) => `${assoc.name} - ${assoc.role}`)
    .join("\n")

  const customSectionsText = data.customSections
    .map((section) => `${section.title}: ${section.content}`)
    .join("\n")

  return [
    "[PERSONAL INFO]",
    `Name: ${data.personalInfo.fullName}`,
    `Email: ${data.personalInfo.email}`,
    `Phone: ${data.personalInfo.phone}`,
    `LinkedIn: ${data.personalInfo.linkedin}`,
    `Portfolio: ${data.personalInfo.portfolio}`,
    `Address: ${data.personalInfo.address}`,
    "",
    "[SUMMARY]",
    data.summary,
    "",
    "[WORK EXPERIENCE]",
    workExperienceText,
    "",
    "[EDUCATION]",
    educationText,
    "",
    "[SKILLS]",
    `Technical: ${data.skills.technical}`,
    `Soft: ${data.skills.soft}`,
    "",
    "[PROJECTS]",
    projectsText,
    "",
    "[LANGUAGES]",
    languagesText,
    "",
    "[CERTIFICATIONS]",
    certificationsText,
    "",
    "[ASSOCIATIONS]",
    associationsText,
    "",
    "[CUSTOM SECTIONS]",
    customSectionsText,
  ].join("\n")
}

export function PreviewPanel() {
  const { resumeData } = useResumeBuilder()
  const [scale, setScale] = useState(
    typeof window !== "undefined" && window.innerWidth < 768 ? 0.4 : 0.8
  )
  const [font, setFont] = useState("inter")
  const [template, setTemplate] = useState("modern")
  const [accentColor, setAccentColor] = useState("#2563eb")
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [aiScore, setAiScore] = useState<number | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [scoreCategories, setScoreCategories] = useState<ScoreCategory[]>([])
  const [showCategories, setShowCategories] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [preferencesLoaded, setPreferencesLoaded] = useState(false)
  const [debouncedResumeData] = useDebounce(resumeData, 3000)
  const resumeRef = useRef<HTMLDivElement | null>(null)
  const colorInputRef = useRef<HTMLInputElement>(null)
  const colorPickerRef = useRef<HTMLDivElement>(null)
  const userAdjustedScale = useRef(false)

  const handleDownload = async () => {
    if (!resumeRef.current) return;
    try {
      const canvas = await html2canvas(resumeRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save('resume.pdf');
    } catch (error) {
      console.error('PDF generation failed:', error);
    }
  }

  // Mapping template ID to display name for the button
  const getTemplateName = (id: string) => {
    const names: Record<string, string> = {
      modern: "Bold Template",
      classic: "Professional",
      minimal: "Clean",
      spotlight: "Spotlight",
      dynamic: "Dynamic",
      horizon: "Horizon",
      vibrant: "Vibrant",
      tech: "Tech",
      startup: "Startup",
      creative: "Creative",
      standard: "Standard",
      corporate: "Corporate",
      executive: "Executive",
      simple: "Simple"
    }
    return names[id] || "Select Template"
  }

  useEffect(() => {
    const controller = new AbortController()
    const analyzeResume = async () => {
      const resumeText = serializeResumeToText(debouncedResumeData)
      if (resumeText.length < 100) {
        setIsAnalyzing(false)
        return
      }

      setIsAnalyzing(true)
      try {
        const response = await fetch("/api/analyze-resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeText }),
          signal: controller.signal,
        })

        if (!response.ok) throw new Error("Failed to analyze resume")

        const data: { totalScore: number; categories: ScoreCategory[] } = await response.json()
        setAiScore(data.totalScore)
        setScoreCategories(data.categories)
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
      } finally {
        if (!controller.signal.aborted) {
          setIsAnalyzing(false)
        }
      }
    }

    void analyzeResume()

    return () => {
      controller.abort()
    }
  }, [debouncedResumeData])

  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem("hiredfast_resume_preferences")
      if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences) as {
          template?: string
          font?: string
          accentColor?: string
        }

        if (typeof preferences.template === "string") {
          setTemplate(preferences.template)
        }
        if (typeof preferences.font === "string") {
          setFont(preferences.font)
        }
        if (
          typeof preferences.accentColor === "string" &&
          /^#[0-9A-Fa-f]{6}$/.test(preferences.accentColor)
        ) {
          setAccentColor(preferences.accentColor)
        }
      }
    } catch {
      // Ignore malformed localStorage payloads
    } finally {
      setPreferencesLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!preferencesLoaded) return

    try {
      localStorage.setItem(
        "hiredfast_resume_preferences",
        JSON.stringify({ template, font, accentColor })
      )
    } catch {
      // Ignore localStorage write failures
    }
  }, [template, font, accentColor, preferencesLoaded])

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        setShowColorPicker(false)
      }
    }

    if (showColorPicker) {
      document.addEventListener("mousedown", onMouseDown)
    }

    return () => {
      document.removeEventListener("mousedown", onMouseDown)
    }
  }, [showColorPicker])

  useEffect(() => {
    const handleResize = () => {
      if (userAdjustedScale.current) return
      if (window.innerWidth < 640) {
        setScale(0.35)
      } else if (window.innerWidth < 768) {
        setScale(0.45)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const scoreValue = aiScore ?? 0
  const scoreBadgeClass = aiScore === null
    ? "text-muted-foreground bg-muted"
    : aiScore >= 80
      ? "text-green-600 bg-green-500/15"
      : aiScore >= 60
        ? "text-yellow-600 bg-yellow-500/15"
        : "text-red-600 bg-red-500/15"
  const scoreBarClass = aiScore === null
    ? "bg-muted-foreground/25"
    : aiScore >= 80
      ? "bg-green-500"
      : aiScore >= 60
        ? "bg-yellow-500"
        : "bg-red-500"
  const scoreMessage = isAnalyzing
    ? "Analyzing your resume..."
    : aiScore === null
      ? "Fill in your resume to get your AI score"
      : aiScore >= 80
        ? "Ready to apply!"
        : aiScore >= 60
          ? "Good - a few improvements could help."
          : "Add more details to improve your score."

  return (
    <div className="flex flex-col h-full">
      <TemplateSelectionModal 
        open={isTemplateModalOpen} 
        onOpenChange={setIsTemplateModalOpen}
        selectedTemplateId={template}
        onSelectTemplate={setTemplate}
        accentColor={accentColor}
      />

      {/* Toolbar */}
      <div className="h-14 px-4 border-b bg-background flex items-center justify-between shrink-0 z-20">
         <div className="flex items-center gap-3">
             <Button 
                variant="outline" 
                onClick={() => setIsTemplateModalOpen(true)}
                className="w-[180px] justify-between bg-muted border-border hover:bg-accent hover:border-border transition-all shadow-sm"
             >
                <span className="font-medium truncate mr-2">{getTemplateName(template)}</span>
                <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
             </Button>
             
             <div className="relative" ref={colorPickerRef}>
                <button
                  type="button"
                  onClick={() => setShowColorPicker((prev) => !prev)}
                  className="h-9 w-9 rounded-lg flex items-center justify-center bg-slate-100 hover:bg-slate-200 transition-colors relative overflow-hidden border-2 border-slate-200"
                  title="Accent Color"
                  style={{ borderColor: accentColor }}
                >
                  <Palette className="h-4 w-4 text-slate-700" />
                  <div
                    className="absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full border border-white"
                    style={{ backgroundColor: accentColor }}
                  />
                </button>

                <input
                  ref={colorInputRef}
                  type="color"
                  value={accentColor}
                  onChange={(event) => {
                    setAccentColor(event.target.value)
                    setShowColorPicker(false)
                  }}
                  className="sr-only"
                />

                {showColorPicker && (
                  <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-4 w-52">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                      Accent Color
                    </p>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[
                        "#2563eb",
                        "#7c3aed",
                        "#059669",
                        "#dc2626",
                        "#d97706",
                        "#0891b2",
                        "#db2777",
                        "#1e293b",
                      ].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            setAccentColor(color)
                            setShowColorPicker(false)
                          }}
                          className="h-8 w-8 rounded-lg border-2 transition-all hover:scale-110"
                          style={{
                            backgroundColor: color,
                            borderColor: accentColor === color ? "#000" : "transparent",
                          }}
                          title={color}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => colorInputRef.current?.click()}
                      className="w-full h-9 rounded-lg border-2 border-dashed border-slate-300 text-xs text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Palette className="h-3.5 w-3.5" />
                      Custom color
                    </button>
                  </div>
                )}
             </div>
         </div>

         <div className="flex items-center gap-2">
             <div className="flex items-center bg-muted rounded-lg p-1">
                 <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                   userAdjustedScale.current = true
                   setScale(s => Math.max(0.4, s - 0.1))
                 }}>
                     <ZoomOut className="h-3.5 w-3.5" />
                 </Button>
                 <span className="text-xs font-medium w-8 text-center">{Math.round(scale * 100)}%</span>
                 <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                   userAdjustedScale.current = true
                   setScale(s => Math.min(1.5, s + 0.1))
                 }}>
                     <ZoomIn className="h-3.5 w-3.5" />
                 </Button>
             </div>
         </div>

         <div className="flex items-center gap-3">
             <Select value={font} onValueChange={setFont}>
                 <SelectTrigger className="w-[110px] bg-muted border-none h-9">
                     <Type className="h-3.5 w-3.5 mr-2 opacity-50" />
                     <SelectValue placeholder="Font" />
                 </SelectTrigger>
                 <SelectContent>
                     <SelectItem value="inter">Inter</SelectItem>
                     <SelectItem value="bitter">Bitter</SelectItem>
                     <SelectItem value="roboto">Roboto</SelectItem>
                 </SelectContent>
             </Select>

             <Button className="gap-2 h-9 px-4" onClick={handleDownload}>
                 <Download className="h-4 w-4" /> Download
             </Button>
         </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto bg-muted/50 relative flex items-start justify-center p-8 md:p-12">
          
          {/* Resume Score Floating Widget */}
          <div className="absolute top-2 right-2 z-10 w-48 sm:w-64 sm:top-6 sm:right-6 bg-white rounded-xl shadow-lg border p-3 sm:p-4 animate-in fade-in slide-in-from-right-4">
              <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    Resume Score
                    {isAnalyzing && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                  </h3>
                  <div className={cn("text-xs font-bold px-2 py-0.5 rounded-full", scoreBadgeClass)}>
                    {aiScore === null ? "—" : aiScore}/100
                  </div>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                        "absolute top-0 left-0 h-full transition-all duration-500 rounded-full",
                        scoreBarClass,
                        isAnalyzing && "opacity-70"
                    )}
                    style={{ width: `${scoreValue}%` }} 
                  />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                  {scoreMessage}
              </p>
              {aiScore !== null && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setShowCategories((prev) => !prev)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    {showCategories ? "Hide" : "See details"}
                  </button>
                  {showCategories && (
                    <div className="mt-2 space-y-2">
                      {scoreCategories.map((category) => {
                        const categoryPercent = category.maxScore > 0
                          ? Math.min((category.score / category.maxScore) * 100, 100)
                          : 0
                        return (
                          <div key={category.name}>
                            <div className="flex items-center justify-between text-[11px] text-slate-600">
                              <span className="truncate pr-2">{category.name}</span>
                              <span>{category.score}/{category.maxScore}</span>
                            </div>
                            <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  categoryPercent >= 80 ? "bg-green-500" : categoryPercent >= 60 ? "bg-yellow-500" : "bg-red-500"
                                )}
                                style={{ width: `${categoryPercent}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
          </div>

          {/* Resume Page Container */}
          <div 
             ref={resumeRef}
             className="bg-white shadow-2xl transition-transform origin-top duration-200 ease-out min-h-[297mm]"
             style={{ 
                 width: '210mm',
                 transform: `scale(${scale})`,
                 fontFamily: font === 'bitter' ? 'Georgia, serif' : font === 'roboto' ? 'Arial, sans-serif' : 'inherit'
             }}
          >
             {renderLayout(template, resumeData, accentColor)}
          </div>
      </div>
    </div>
  )
}

const formatDate = (dateString: string) => {
    if (!dateString) return ""
    if (dateString === "Present") return "Present"
    // Check if it matches YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        try {
            const date = new Date(dateString)
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        } catch {
            return dateString
        }
    }
    return dateString
}

function renderLayout(templateId: string, data: ResumeData, accentColor: string = "#2563eb") {
    // 1. Sidebar Layouts (Modern, Spotlight, Tech)
    if (['modern', 'spotlight', 'tech', 'startup', 'dynamic'].includes(templateId)) {
        return (
            <div className="flex h-full min-h-[297mm]">
                {/* Left Sidebar */}
                <div
                    className={cn(
                        "w-[35%] p-8 text-white space-y-8",
                        templateId === 'tech' && "font-mono"
                    )}
                    style={{ backgroundColor: accentColor }}
                >
                    {/* Photo area could go here */}
                    
                    {/* Contact */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest opacity-70 border-b border-white/20 pb-2">Contact</h3>
                        <div className="text-sm space-y-2 opacity-90">
                            <div className="break-words">{data.personalInfo.email}</div>
                            <div>{data.personalInfo.phone}</div>
                            <div>{data.personalInfo.address}</div>
                            {data.personalInfo.portfolio && <div className="break-words text-xs underline">{data.personalInfo.portfolio}</div>}
                            <div className="break-words text-xs">{data.personalInfo.linkedin}</div>
                        </div>
                    </div>

                    {/* Skills */}
                    {(data.skills.technical || data.skills.soft) && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest opacity-70 border-b border-white/20 pb-2">Skills</h3>
                            <div className="text-sm opacity-90 space-y-3">
                                {data.skills.technical && <div><span className="font-semibold block mb-1">Technical:</span>{data.skills.technical}</div>}
                                {data.skills.soft && <div><span className="font-semibold block mb-1">Soft:</span>{data.skills.soft}</div>}
                            </div>
                        </div>
                    )}

                    {/* Languages */}
                    {(data.languages.length > 0) && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest opacity-70 border-b border-white/20 pb-2">Languages</h3>
                            <div className="text-sm opacity-90 space-y-1">
                                {data.languages.map((lang, i) => (
                                    <div key={i} className="flex justify-between">
                                        <span>{lang.name}</span>
                                        <span className="opacity-75">{lang.proficiency}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Certifications - Sidebar style */}
                     {(data.certifications.length > 0) && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest opacity-70 border-b border-white/20 pb-2">Certifications</h3>
                            <div className="text-sm opacity-90 space-y-2">
                                {data.certifications.map((cert, i) => (
                                    <div key={i}>
                                        <div className="font-semibold">{cert.name}</div>
                                        <div className="text-xs opacity-75">{cert.issuer} ({cert.year})</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Associations */}
                    {(data.associations.length > 0) && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest opacity-70 border-b border-white/20 pb-2">Associations</h3>
                            <div className="text-sm opacity-90 space-y-2">
                                {data.associations.map((assoc, i) => (
                                    <div key={i}>
                                        <div className="font-semibold">{assoc.name}</div>
                                        <div className="text-xs opacity-75">{assoc.role}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Education (Sidebar style) */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest opacity-70 border-b border-white/20 pb-2">Education</h3>
                        <div className="space-y-4">
                            {data.education.map((edu, i) => (
                                <div key={i} className="text-sm">
                                    <div className="font-bold">{edu.school}</div>
                                    <div className="opacity-80">{edu.degree}</div>
                                    <div className="opacity-60 text-xs">{edu.graduationYear}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-8 space-y-8 bg-white text-slate-800">
                    <header className="space-y-2 mb-8">
                        <h1
                            className="text-4xl font-extrabold uppercase tracking-tight"
                            style={{ color: accentColor }}
                        >
                            {data.personalInfo.fullName}
                        </h1>
                        <p className="text-xl font-medium text-slate-500">{data.workExperience[0]?.role}</p>
                    </header>

                    {/* Summary */}
                    {data.summary && (
                        <div className="text-sm leading-relaxed mb-8 opacity-90 whitespace-pre-wrap">
                            {data.summary}
                        </div>
                    )}

                    <section>
                         <h3
                             className="text-sm font-bold uppercase tracking-widest border-b-2 pb-2 mb-4"
                             style={{ borderColor: accentColor, color: accentColor }}
                         >
                            Professional Experience
                        </h3>
                         <div className="space-y-6">
                            {data.workExperience.map((exp, i) => (
                                <div key={i} className="relative pl-4 border-l-2 border-slate-100">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h4 className="font-bold text-lg">{exp.role}</h4>
                                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">{formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}</span>
                                    </div>
                                    <div className="text-sm font-medium text-slate-600 mb-2">{exp.company}</div>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{exp.achievements}</p>
                                </div>
                            ))}
                         </div>
                    </section>

                    {/* Projects */}
                    {(data.projects.length > 0) && (
                    <section>
                         <h3
                             className="text-sm font-bold uppercase tracking-widest border-b-2 pb-2 mb-4"
                             style={{ borderColor: accentColor, color: accentColor }}
                         >
                            Projects
                        </h3>
                         <div className="space-y-6">
                            {data.projects.map((project, i) => (
                                <div key={i} className="relative pl-4 border-l-2 border-slate-100">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h4 className="font-bold text-lg">{project.title}</h4>
                                        {project.link && <a href={project.link} target="_blank" className="text-xs font-semibold text-blue-600 hover:underline">{project.link.replace(/^https?:\/\//, '')}</a>}
                                    </div>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{project.description}</p>
                                </div>
                            ))}
                         </div>
                    </section>
                    )}

                    {/* Custom Sections */}
                    {data.customSections.map((section) => (
                        <section key={section.id}>
                             <h3
                                 className="text-sm font-bold uppercase tracking-widest border-b-2 pb-2 mb-4"
                                 style={{ borderColor: accentColor, color: accentColor }}
                             >
                                {section.title}
                            </h3>
                             <p className="text-sm leading-relaxed whitespace-pre-wrap">{section.content}</p>
                        </section>
                    ))}
                </div>
            </div>
        )
    }

    // 2. Classic/Professional Layouts (Standard, Corporate, Executive)
    if (['classic', 'corporate', 'executive', 'standard', 'academic'].includes(templateId)) {
        return (
            <div className="p-12 h-full text-slate-900">
                <header className="text-center border-b-2 pb-8 mb-8" style={{ borderColor: accentColor }}>
                    <h1 className="text-3xl font-serif font-bold tracking-wide mb-2">{data.personalInfo.fullName.toUpperCase()}</h1>
                    <div className="flex justify-center flex-wrap gap-4 text-sm font-medium text-slate-600">
                         <span>{data.personalInfo.address}</span>
                         <span className="text-slate-300">•</span>
                         <span>{data.personalInfo.email}</span>
                         <span className="text-slate-300">•</span>
                         <span>{data.personalInfo.phone}</span>
                         {data.personalInfo.portfolio && (
                            <>
                                <span className="text-slate-300">•</span>
                                <span>{data.personalInfo.portfolio}</span>
                            </>
                         )}
                         {data.personalInfo.linkedin && (
                            <>
                                <span className="text-slate-300">•</span>
                                <span>{data.personalInfo.linkedin}</span>
                            </>
                         )}
                    </div>
                </header>

                <div className="space-y-6">
                    {data.summary && (
                         <div className="text-sm leading-relaxed mb-6 whitespace-pre-wrap">
                            {data.summary}
                         </div>
                    )}

                    <section>
                         <h3
                            className="text-sm font-bold uppercase tracking-widest bg-slate-100 p-1 pl-2 mb-4 border-l-4"
                            style={{ borderColor: accentColor }}
                         >
                            Experience
                        </h3>
                         <div className="space-y-5">
                            {data.workExperience.map((exp, i) => (
                                <div key={i} className="text-sm">
                                    <div className="flex justify-between font-bold text-base">
                                        <span>{exp.company}</span>
                                        <span>{formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}</span>
                                    </div>
                                    <div className="italic text-sm mb-2">{exp.role}</div>
                                    <ul className="list-disc list-outside ml-4 text-sm space-y-1">
                                        {exp.achievements.split('\n').map((line, k) => (
                                            <li key={k}>{line.replace(/^•\s*/, '')}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                         </div>
                    </section>

                    <section>
                         <h3
                            className="text-sm font-bold uppercase tracking-widest bg-slate-100 p-1 pl-2 mb-4 border-l-4"
                            style={{ borderColor: accentColor }}
                         >
                            Projects
                        </h3>
                         <div className="space-y-4">
                            {data.projects.map((project, i) => (
                                <div key={i}>
                                    <div className="flex justify-between font-bold text-base">
                                        <span>{project.title}</span>
                                        {project.link && <a href={project.link} className="text-xs text-blue-600 font-normal">{project.link.replace(/^https?:\/\//, '')}</a>}
                                    </div>
                                    <p className="text-sm mt-1">{project.description}</p>
                                </div>
                            ))}
                         </div>
                    </section>

                    <section>
                         <h3
                            className="text-sm font-bold uppercase tracking-widest bg-slate-100 p-1 pl-2 mb-4 border-l-4"
                            style={{ borderColor: accentColor }}
                         >
                            Education
                        </h3>
                         <div className="space-y-3">
                            {data.education.map((edu, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                    <div>
                                        <div className="font-bold">{edu.school}</div>
                                        <div>{edu.degree}</div>
                                    </div>
                                    <div className="font-bold">{edu.graduationYear}</div>
                                </div>
                            ))}
                         </div>
                    </section>

                    {(data.certifications.length > 0 || data.languages.length > 0 || data.associations.length > 0) && (
                        <section className="grid grid-cols-2 gap-8">
                             {data.certifications.length > 0 && (
                                 <div>
                                    <h3
                                        className="text-sm font-bold uppercase tracking-widest bg-slate-100 p-1 pl-2 mb-4 border-l-4"
                                        style={{ borderColor: accentColor }}
                                    >
                                        Certifications
                                    </h3>
                                    <ul className="text-sm space-y-1">
                                        {data.certifications.map((cert, i) => (
                                            <li key={i}>{cert.name} - <span className="text-slate-500">{cert.year}</span></li>
                                        ))}
                                    </ul>
                                 </div>
                             )}
                             {data.languages.length > 0 && (
                                 <div>
                                    <h3
                                        className="text-sm font-bold uppercase tracking-widest bg-slate-100 p-1 pl-2 mb-4 border-l-4"
                                        style={{ borderColor: accentColor }}
                                    >
                                        Languages
                                    </h3>
                                    <ul className="text-sm space-y-1">
                                        {data.languages.map((lang, i) => (
                                            <li key={i}>{lang.name} - <span className="text-slate-500">{lang.proficiency}</span></li>
                                        ))}
                                    </ul>
                                 </div>
                             )}
                             {data.associations.length > 0 && (
                                 <div>
                                    <h3
                                        className="text-sm font-bold uppercase tracking-widest bg-slate-100 p-1 pl-2 mb-4 border-l-4"
                                        style={{ borderColor: accentColor }}
                                    >
                                        Associations
                                    </h3>
                                    <ul className="text-sm space-y-1">
                                        {data.associations.map((assoc, i) => (
                                            <li key={i}>{assoc.name} - <span className="text-slate-500">{assoc.role}</span></li>
                                        ))}
                                    </ul>
                                 </div>
                             )}
                        </section>
                    )}

                    {/* Custom Sections */}
                    {data.customSections.map((section) => (
                        <section key={section.id}>
                             <h3
                                className="text-sm font-bold uppercase tracking-widest bg-slate-100 p-1 pl-2 mb-4 border-l-4"
                                style={{ borderColor: accentColor }}
                             >
                                {section.title}
                            </h3>
                             <p className="text-sm leading-relaxed whitespace-pre-wrap">{section.content}</p>
                        </section>
                    ))}
                </div>
            </div>
        )
    }

    // 3. Creative/Header Layout (Horizon, Vibrant)
    if (['horizon', 'vibrant', 'creative'].includes(templateId)) {
        return (
             <div className="h-full bg-white">
                 <header
                    className="p-12 flex justify-between items-center text-white"
                    style={{ backgroundColor: accentColor }}
                 >
                      <div>
                          <h1 className="text-5xl font-black tracking-tighter mb-2">{data.personalInfo.fullName}</h1>
                          <p className="text-xl opacity-90">{data.workExperience[0]?.role}</p>
                      </div>
                      <div className="text-right text-sm space-y-1 opacity-90 font-medium">
                          <div>{data.personalInfo.email}</div>
                          <div>{data.personalInfo.phone}</div>
                          {data.personalInfo.portfolio && <div>{data.personalInfo.portfolio}</div>}
                          <div>{data.personalInfo.linkedin}</div>
                      </div>
                 </header>

                  <div className="p-12 grid grid-cols-3 gap-12">
                      <div className="col-span-2 space-y-8">
                          {data.summary && (
                             <section>
                                 <h3 className="text-xl font-bold mb-4" style={{ color: accentColor }}>Profile</h3>
                                 <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.summary}</p>
                             </section>
                          )}

                          <section>
                              <h3 className="text-xl font-bold mb-4" style={{ color: accentColor }}>Experience</h3>
                              <div className="space-y-8">
                                  {data.workExperience.map((exp, i) => (
                                      <div key={i}>
                                          <h4 className="text-lg font-bold">{exp.role}</h4>
                                          <div className="text-sm text-slate-500 mb-2">{exp.company} | {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}</div>
                                          <p className="text-sm leading-relaxed">{exp.achievements}</p>
                                      </div>
                                  ))}
                              </div>
                          </section>

                          {data.projects.length > 0 && (
                            <section>
                                <h3 className="text-xl font-bold mb-4" style={{ color: accentColor }}>Projects</h3>
                                <div className="space-y-6">
                                    {data.projects.map((project, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h4 className="font-bold text-lg">{project.title}</h4>
                                                {project.link && <span className="text-xs text-slate-400">{project.link.replace(/^https?:\/\//, '')}</span>}
                                            </div>
                                            <p className="text-sm leading-relaxed">{project.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                          )}

                          {data.customSections.map((section) => (
                             <section key={section.id}>
                                 <h3 className="text-xl font-bold mb-4" style={{ color: accentColor }}>{section.title}</h3>
                                 <p className="text-sm leading-relaxed whitespace-pre-wrap">{section.content}</p>
                             </section>
                          ))}
                      </div>

                      <div className="col-span-1 space-y-8">
                          <section className="bg-slate-50 p-6 rounded-xl">
                              <h3 className="font-bold mb-4" style={{ color: accentColor }}>Education</h3>
                              {data.education.map((edu, i) => (
                                  <div key={i} className="mb-4 last:mb-0">
                                      <div className="font-bold text-sm">{edu.school}</div>
                                      <div className="text-xs text-slate-500">{edu.degree}</div>
                                      <div className="text-xs text-slate-400">{edu.graduationYear}</div>
                                  </div>
                              ))}
                          </section>

                          {data.languages.length > 0 && (
                             <section className="bg-slate-50 p-6 rounded-xl">
                                <h3 className="font-bold mb-4" style={{ color: accentColor }}>Languages</h3>
                                {data.languages.map((lang, i) => (
                                    <div key={i} className="flex justify-between text-sm mb-2">
                                        <span>{lang.name}</span>
                                        <span className="text-slate-500">{lang.proficiency}</span>
                                    </div>
                                ))}
                             </section>
                          )}

                          {data.certifications.length > 0 && (
                             <section className="bg-slate-50 p-6 rounded-xl">
                                <h3 className="font-bold mb-4" style={{ color: accentColor }}>Certifications</h3>
                                {data.certifications.map((cert, i) => (
                                    <div key={i} className="mb-2 last:mb-0">
                                        <div className="font-semibold text-sm">{cert.name}</div>
                                        <div className="text-xs text-slate-500">{cert.issuer}, {cert.year}</div>
                                    </div>
                                ))}
                             </section>
                          )}

                          {data.associations.length > 0 && (
                             <section className="bg-slate-50 p-6 rounded-xl">
                                <h3 className="font-bold mb-4" style={{ color: accentColor }}>Associations</h3>
                                {data.associations.map((assoc, i) => (
                                    <div key={i} className="mb-2 last:mb-0">
                                        <div className="font-semibold text-sm">{assoc.name}</div>
                                        <div className="text-xs text-slate-500">{assoc.role}</div>
                                    </div>
                                ))}
                             </section>
                          )}
                      </div>
                 </div>
             </div>
        )
    }

    // Default / Minimal Layout (Minimal, Clean, Air, Focus, Simple, etc)
    return (
        <div className="p-12 h-full text-slate-800">
             <header className="mb-12">
                 <h1 className="text-4xl font-light tracking-tight mb-2">{data.personalInfo.fullName}</h1>
                 <div className="flex gap-4 text-sm text-slate-500 flex-wrap">
                      <span>{data.personalInfo.email}</span>
                      <span>{data.personalInfo.phone}</span>
                      <span>{data.personalInfo.address}</span>
                      {data.personalInfo.portfolio && <span>{data.personalInfo.portfolio}</span>}
                 </div>
                 {data.summary && (
                     <p className="mt-8 text-sm leading-relaxed text-slate-600 max-w-4xl whitespace-pre-wrap">
                        {data.summary}
                     </p>
                 )}
             </header>

             <div className="grid grid-cols-12 gap-8">
                 <div className="col-span-3 space-y-8 text-sm">
                      <div className="space-y-4">
                           <h3 className="font-bold uppercase tracking-wider text-xs border-b pb-1" style={{ borderColor: accentColor }}>Education</h3>
                           {data.education.map((edu, i) => (
                                <div key={i}>
                                    <div className="font-semibold">{edu.school}</div>
                                    <div className="text-slate-500">{edu.degree}</div>
                                    <div className="text-slate-400 text-xs">{edu.graduationYear}</div>
                                </div>
                           ))}
                      </div>
                      <div className="space-y-4">
                            <h3 className="font-bold uppercase tracking-wider text-xs border-b pb-1" style={{ borderColor: accentColor }}>Skills</h3>
                           <p className="leading-relaxed">{data.skills.technical}</p>
                      </div>

                      {data.languages.length > 0 && (
                          <div className="space-y-4">
                               <h3 className="font-bold uppercase tracking-wider text-xs border-b pb-1" style={{ borderColor: accentColor }}>Languages</h3>
                               {data.languages.map((lang, i) => (
                                   <div key={i}>
                                       <span className="font-semibold">{lang.name}</span>
                                       <span className="text-slate-500 text-xs ml-2">{lang.proficiency}</span>
                                   </div>
                               ))}
                          </div>
                      )}

                      {data.certifications.length > 0 && (
                          <div className="space-y-4">
                               <h3 className="font-bold uppercase tracking-wider text-xs border-b pb-1" style={{ borderColor: accentColor }}>Certifications</h3>
                               {data.certifications.map((cert, i) => (
                                   <div key={i} className="mb-2">
                                       <div className="font-semibold">{cert.name}</div>
                                       <div className="text-slate-500 text-xs">{cert.year}</div>
                                   </div>
                               ))}
                          </div>
                      )}

                      {data.associations.length > 0 && (
                          <div className="space-y-4">
                               <h3 className="font-bold uppercase tracking-wider text-xs border-b pb-1" style={{ borderColor: accentColor }}>Associations</h3>
                               {data.associations.map((assoc, i) => (
                                   <div key={i} className="mb-2">
                                       <div className="font-semibold">{assoc.name}</div>
                                       <div className="text-slate-500 text-xs">{assoc.role}</div>
                                   </div>
                               ))}
                          </div>
                      )}
                 </div>

                 <div className="col-span-9 space-y-8">
                      <div className="space-y-6">
                           <h3 className="font-bold uppercase tracking-wider text-xs border-b pb-1" style={{ borderColor: accentColor }}>Experience</h3>
                           {data.workExperience.map((exp, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-baseline">
                                        <h4 className="font-bold text-base">{exp.role} at {exp.company}</h4>
                                        <span className="text-xs text-slate-400 font-mono">{formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}</span>
                                    </div>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">{exp.achievements}</p>
                                </div>
                            ))}
                      </div>

                      {data.projects.length > 0 && (
                          <div className="space-y-6">
                               <h3 className="font-bold uppercase tracking-wider text-xs border-b pb-1" style={{ borderColor: accentColor }}>Projects</h3>
                               {data.projects.map((project, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between items-baseline">
                                            <h4 className="font-bold text-base">{project.title}</h4>
                                            {project.link && <span className="text-xs text-blue-600">{project.link.replace(/^https?:\/\//, '')}</span>}
                                        </div>
                                        <p className="mt-1 text-sm leading-relaxed text-slate-600">{project.description}</p>
                                    </div>
                                ))}
                          </div>
                      )}

                      {/* Custom Sections */}
                      {data.customSections.map((section) => (
                          <div key={section.id} className="space-y-6">
                               <h3 className="font-bold uppercase tracking-wider text-xs border-b pb-1" style={{ borderColor: accentColor }}>{section.title}</h3>
                               <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">{section.content}</p>
                          </div>
                      ))}
                 </div>
             </div>
        </div>
    )
}
