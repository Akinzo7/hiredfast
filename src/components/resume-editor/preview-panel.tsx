"use client"

import { useState, useRef } from "react"
import { useResumeBuilder, ResumeData } from "@/hooks/use-resume-builder"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, ZoomIn, ZoomOut, Type, Palette, Maximize, RotateCcw, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

import { TemplateSelectionModal } from "./template-selection-modal"

export function PreviewPanel() {
  const { resumeData } = useResumeBuilder()
  const [scale, setScale] = useState(0.8)
  const [font, setFont] = useState("inter")
  const [template, setTemplate] = useState("modern")
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const resumeRef = useRef<HTMLDivElement | null>(null)

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

  // Score Calculation Mock
  const calculateScore = (data: ResumeData) => {
      let score = 0
      if (data.personalInfo.fullName) score += 10
      if (data.personalInfo.email) score += 10
      if (data.workExperience.length > 0) score += 30
      if (data.education.length > 0) score += 20
      if (data.skills.technical || data.skills.soft) score += 20
      if (data.projects.length > 0) score += 10
      return Math.min(score, 100)
  }
  
  const score = calculateScore(resumeData)

  return (
    <div className="flex flex-col h-full">
      <TemplateSelectionModal 
        open={isTemplateModalOpen} 
        onOpenChange={setIsTemplateModalOpen}
        selectedTemplateId={template}
        onSelectTemplate={setTemplate}
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
             
             <Button variant="ghost" size="icon" className="h-9 w-9 bg-muted rounded-lg text-foreground">
                <Palette className="h-4 w-4" />
             </Button>
         </div>

         <div className="flex items-center gap-2">
             <div className="flex items-center bg-muted rounded-lg p-1">
                 <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale(s => Math.max(0.4, s - 0.1))}>
                     <ZoomOut className="h-3.5 w-3.5" />
                 </Button>
                 <span className="text-xs font-medium w-8 text-center">{Math.round(scale * 100)}%</span>
                 <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale(s => Math.min(1.5, s + 0.1))}>
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
          <div className="absolute top-6 right-6 z-10 w-64 bg-card rounded-xl shadow-lg border p-4 animate-in fade-in slide-in-from-right-4">
              <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-sm text-foreground">Resume Score</h3>
                  <div className="text-xs font-bold text-green-600 bg-green-500/15 px-2 py-0.5 rounded-full">{score}/100</div>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                        "absolute top-0 left-0 h-full transition-all duration-500 rounded-full",
                        score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    )}
                    style={{ width: `${score}%` }} 
                  />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                  {score >= 80 ? "Ready to apply!" : "Add more details to improve your score."}
              </p>
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
             {renderLayout(template, resumeData)}
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
        } catch (e) {
            return dateString
        }
    }
    return dateString
}

function renderLayout(templateId: string, data: ResumeData) {
    // 1. Sidebar Layouts (Modern, Spotlight, Tech)
    if (['modern', 'spotlight', 'tech', 'startup', 'dynamic'].includes(templateId)) {
        return (
            <div className="flex h-full min-h-[297mm]">
                {/* Left Sidebar */}
                <div className={cn(
                    "w-[35%] p-8 text-white space-y-8",
                    templateId === 'modern' && "bg-slate-900",
                    templateId === 'spotlight' && "bg-blue-900",
                    templateId === 'tech' && "bg-zinc-900 font-mono",
                    templateId === 'startup' && "bg-purple-900",
                    templateId === 'dynamic' && "bg-indigo-700"
                )}>
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
                        <h1 className={cn(
                            "text-4xl font-extrabold uppercase tracking-tight",
                            templateId === 'modern' && "text-slate-900",
                            templateId === 'spotlight' && "text-blue-900",
                             templateId === 'dynamic' && "text-indigo-700"
                        )}>{data.personalInfo.fullName}</h1>
                        <p className="text-xl font-medium text-slate-500">{data.workExperience[0]?.role}</p>
                    </header>

                    {/* Summary */}
                    {data.summary && (
                        <div className="text-sm leading-relaxed mb-8 opacity-90 whitespace-pre-wrap">
                            {data.summary}
                        </div>
                    )}

                    <section>
                         <h3 className={cn(
                             "text-sm font-bold uppercase tracking-widest border-b-2 pb-2 mb-4",
                             templateId === 'modern' ? "border-slate-900 text-slate-900" : "border-slate-200 text-slate-500"
                         )}>Professional Experience</h3>
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
                         <h3 className={cn(
                             "text-sm font-bold uppercase tracking-widest border-b-2 pb-2 mb-4",
                             templateId === 'modern' ? "border-slate-900 text-slate-900" : "border-slate-200 text-slate-500"
                         )}>Projects</h3>
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
                             <h3 className={cn(
                                 "text-sm font-bold uppercase tracking-widest border-b-2 pb-2 mb-4",
                                 templateId === 'modern' ? "border-slate-900 text-slate-900" : "border-slate-200 text-slate-500"
                             )}>{section.title}</h3>
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
                <header className="text-center border-b-2 border-slate-900 pb-8 mb-8">
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
                         <h3 className="text-sm font-bold uppercase tracking-widest bg-slate-100 p-1 pl-2 mb-4 border-l-4 border-slate-800">Experience</h3>
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
                         <h3 className="text-sm font-bold uppercase tracking-widest bg-slate-100 p-1 pl-2 mb-4 border-l-4 border-slate-800">Projects</h3>
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
                         <h3 className="text-sm font-bold uppercase tracking-widest bg-slate-100 p-1 pl-2 mb-4 border-l-4 border-slate-800">Education</h3>
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
                                    <h3 className="text-sm font-bold uppercase tracking-widest bg-slate-100 p-1 pl-2 mb-4 border-l-4 border-slate-800">Certifications</h3>
                                    <ul className="text-sm space-y-1">
                                        {data.certifications.map((cert, i) => (
                                            <li key={i}>{cert.name} - <span className="text-slate-500">{cert.year}</span></li>
                                        ))}
                                    </ul>
                                 </div>
                             )}
                             {data.languages.length > 0 && (
                                 <div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest bg-slate-100 p-1 pl-2 mb-4 border-l-4 border-slate-800">Languages</h3>
                                    <ul className="text-sm space-y-1">
                                        {data.languages.map((lang, i) => (
                                            <li key={i}>{lang.name} - <span className="text-slate-500">{lang.proficiency}</span></li>
                                        ))}
                                    </ul>
                                 </div>
                             )}
                             {data.associations.length > 0 && (
                                 <div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest bg-slate-100 p-1 pl-2 mb-4 border-l-4 border-slate-800">Associations</h3>
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
                             <h3 className="text-sm font-bold uppercase tracking-widest bg-slate-100 p-1 pl-2 mb-4 border-l-4 border-slate-800">{section.title}</h3>
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
                 <header className={cn(
                     "p-12 flex justify-between items-center text-white",
                     templateId === 'vibrant' ? "bg-rose-600" : "bg-cyan-700"
                 )}>
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
                                 <h3 className={cn("text-xl font-bold mb-4", templateId === 'vibrant' ? "text-rose-600" : "text-cyan-700")}>Profile</h3>
                                 <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.summary}</p>
                             </section>
                          )}

                          <section>
                              <h3 className={cn("text-xl font-bold mb-4", templateId === 'vibrant' ? "text-rose-600" : "text-cyan-700")}>Experience</h3>
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
                                <h3 className={cn("text-xl font-bold mb-4", templateId === 'vibrant' ? "text-rose-600" : "text-cyan-700")}>Projects</h3>
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
                                 <h3 className={cn("text-xl font-bold mb-4", templateId === 'vibrant' ? "text-rose-600" : "text-cyan-700")}>{section.title}</h3>
                                 <p className="text-sm leading-relaxed whitespace-pre-wrap">{section.content}</p>
                             </section>
                          ))}
                      </div>

                      <div className="col-span-1 space-y-8">
                          <section className="bg-slate-50 p-6 rounded-xl">
                              <h3 className={cn("font-bold mb-4", templateId === 'vibrant' ? "text-rose-600" : "text-cyan-700")}>Education</h3>
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
                                <h3 className={cn("font-bold mb-4", templateId === 'vibrant' ? "text-rose-600" : "text-cyan-700")}>Languages</h3>
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
                                <h3 className={cn("font-bold mb-4", templateId === 'vibrant' ? "text-rose-600" : "text-cyan-700")}>Certifications</h3>
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
                                <h3 className={cn("font-bold mb-4", templateId === 'vibrant' ? "text-rose-600" : "text-cyan-700")}>Associations</h3>
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
                           <h3 className="font-bold uppercase tracking-wider text-xs border-b pb-1">Education</h3>
                           {data.education.map((edu, i) => (
                                <div key={i}>
                                    <div className="font-semibold">{edu.school}</div>
                                    <div className="text-slate-500">{edu.degree}</div>
                                    <div className="text-slate-400 text-xs">{edu.graduationYear}</div>
                                </div>
                           ))}
                      </div>
                      <div className="space-y-4">
                           <h3 className="font-bold uppercase tracking-wider text-xs border-b pb-1">Skills</h3>
                           <p className="leading-relaxed">{data.skills.technical}</p>
                      </div>

                      {data.languages.length > 0 && (
                          <div className="space-y-4">
                               <h3 className="font-bold uppercase tracking-wider text-xs border-b pb-1">Languages</h3>
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
                               <h3 className="font-bold uppercase tracking-wider text-xs border-b pb-1">Certifications</h3>
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
                               <h3 className="font-bold uppercase tracking-wider text-xs border-b pb-1">Associations</h3>
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
                           <h3 className="font-bold uppercase tracking-wider text-xs border-b pb-1">Experience</h3>
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
                               <h3 className="font-bold uppercase tracking-wider text-xs border-b pb-1">Projects</h3>
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
                               <h3 className="font-bold uppercase tracking-wider text-xs border-b pb-1">{section.title}</h3>
                               <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">{section.content}</p>
                          </div>
                      ))}
                 </div>
             </div>
        </div>
    )
}
