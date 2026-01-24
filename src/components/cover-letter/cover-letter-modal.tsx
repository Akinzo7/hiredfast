"use client"

import { useState, useRef } from "react"
import { useDebouncedCallback } from 'use-debounce';
import { useResumeBuilder } from "@/hooks/use-resume-builder"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, FileUp, Database, FileText, X, CheckCircle2, ChevronDown, Download, RefreshCw, Palette } from "lucide-react"
import { cn } from "@/lib/utils"
import { extractTextFromFile } from "@/lib/file-parser"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

// Types
interface SenderDetails {
  fullName: string
  title: string
  city: string
  phone: string
  email: string
  linkedin: string
}

interface RecipientDetails {
  fullName: string
  position: string
  company: string
  addressLine1: string
  addressLine2: string
  city: string
}

type TemplateType = 'modern' | 'classic' | 'minimal'
type FontType = 'inter' | 'georgia' | 'times' | 'arial'

const FONTS: Record<FontType, string> = {
  inter: "'Inter', sans-serif",
  georgia: "'Georgia', serif",
  times: "'Times New Roman', serif",
  arial: "'Arial', sans-serif"
}

const FONT_OPTIONS = [
  { value: 'inter', label: 'Inter' },
  { value: 'georgia', label: 'Georgia' },
  { value: 'times', label: 'Times New Roman' },
  { value: 'arial', label: 'Arial' },
]

interface CoverLetterModalProps {
  children: React.ReactNode
}

export function CoverLetterModal({ children }: CoverLetterModalProps) {
  const { resumeData } = useResumeBuilder()
  const [open, setOpen] = useState(false)
  const [jobDescription, setJobDescription] = useState("")
  const [jobDescriptionInput, setJobDescriptionInput] = useState("")
  const [resumeSource, setResumeSource] = useState("current")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedText, setUploadedText] = useState<string>("")
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Editor state
  const [isLetterGenerated, setIsLetterGenerated] = useState(false)
  const [letterContent, setLetterContent] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('modern')
  const [selectedFont, setSelectedFont] = useState<FontType>('inter')
  const [senderDetails, setSenderDetails] = useState<SenderDetails>({
    fullName: 'Your Name Here',
    title: 'Your Title',
    city: 'Your City',
    phone: 'Your Phone',
    email: 'your.email@example.com',
    linkedin: 'linkedin.com/in/yourprofile'
  })
  const [recipientDetails, setRecipientDetails] = useState<RecipientDetails>({
    fullName: 'Hiring Manager',
    position: 'Position',
    company: 'Company Name',
    addressLine1: '123 Company St',
    addressLine2: 'Suite 456',
    city: 'City, State'
  })
  
  // Collapsible states
  const [contactOpen, setContactOpen] = useState(false)
  const [recipientOpen, setRecipientOpen] = useState(false)
  const [contentOpen, setContentOpen] = useState(true)
  
  // Template modal
  const [showTemplates, setShowTemplates] = useState(false)
  
  const debouncedSetJobDescription = useDebouncedCallback(
    (value: string) => setJobDescription(value),
    300 // 300ms delay
  );

  const handleJobDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setJobDescriptionInput(value);
    debouncedSetJobDescription(value);
  }
  
  const previewRef = useRef<HTMLDivElement>(null)
  
  const charCount = jobDescriptionInput.length
  const isGenerateDisabled = charCount < 50 || isGenerating

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    // Always clear input value to allow re-uploading same file if failed
    if (event.target) {
        event.target.value = ""; 
    }

    if (!file) return;
    
    // Prevent concurrent processing
    if (isProcessingFile) {
      setFileError("Please wait, currently processing a file.");
      return;
    }

    // Validate File Type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const validExtensions = ['.pdf', '.docx'];
    const isValidType = validTypes.includes(file.type) || validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!isValidType) {
        setFileError("Invalid file type. Please upload PDF or DOCX.");
        setResumeSource("current");
        return;
    }

    // Validate File Size (10MB)
    if (file.size > 10 * 1024 * 1024) {
        setFileError("File too large. Maximum size is 10MB.");
        setResumeSource("current");
        return;
    }
    
    setIsProcessingFile(true);
    setFileError(null);
    setUploadedFile(null);
    
    try {
      const text = await extractTextFromFile(file);
      
      if (!text || text.trim().length < 50) {
          throw new Error("Could not extract enough text from file. The document might be scanned/image-based.");
      }

      setUploadedFile(file);
      setUploadedText(text);
      setResumeSource("upload");
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Failed to process file");
      setUploadedFile(null);
      setUploadedText("");
      setResumeSource("current");
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setUploadedText("")
    setFileError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    setResumeSource("current")
  }

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault()
    fileInputRef.current?.click()
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      let resumeContent = resumeSource === "current" ? resumeData : uploadedText

      const response = await fetch("/api/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, resumeData: resumeContent, source: resumeSource }),
      })

      if (!response.ok) throw new Error("Failed to generate cover letter")

      const data = await response.json()
      setLetterContent(data.letter)
      
      // Pre-fill sender details from resume if available
      if (resumeData?.personalInfo) {
        setSenderDetails(prev => ({
          ...prev,
          fullName: resumeData.personalInfo.fullName || prev.fullName,
          email: resumeData.personalInfo.email || prev.email,
          phone: resumeData.personalInfo.phone || prev.phone,
          linkedin: resumeData.personalInfo.linkedin || prev.linkedin
        }))
      }
      
      setIsLetterGenerated(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsGenerating(false)
    }
  }
  
  const handleRegenerate = () => {
    setIsLetterGenerated(false)
    setLetterContent("")
  }
  
  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    
    try {
      const canvas = await html2canvas(previewRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('cover-letter.pdf');
    } catch (err) {
      console.error('PDF generation failed:', err);
      // Add user-visible error
      alert('Failed to generate PDF. Please try again or contact support if the issue persists.');
    }
  }

  const updateSender = (field: keyof SenderDetails, value: string) => {
    setSenderDetails(prev => ({ ...prev, [field]: value }))
  }
  
  const updateRecipient = (field: keyof RecipientDetails, value: string) => {
    setRecipientDetails(prev => ({ ...prev, [field]: value }))
  }

  // Template styles
  const getTemplateStyles = () => {
    const base = {
      fontFamily: FONTS[selectedFont],
    }
    
    switch (selectedTemplate) {
      case 'modern':
        return { ...base, headerBg: 'bg-blue-700', headerText: 'text-white', bodyPadding: 'p-8' }
      case 'classic':
        return { ...base, headerBg: 'bg-slate-100', headerText: 'text-slate-800', bodyPadding: 'p-10' }
      case 'minimal':
        return { ...base, headerBg: 'bg-white', headerText: 'text-slate-900', bodyPadding: 'p-6' }
      default:
        return { ...base, headerBg: 'bg-blue-700', headerText: 'text-white', bodyPadding: 'p-8' }
    }
  }
  
  const templateStyles = getTemplateStyles()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className={cn(
        "p-0 gap-0 h-[90vh] flex flex-col overflow-hidden",
        isLetterGenerated ? "sm:max-w-[95vw]" : "sm:max-w-[800px]"
      )} style={{ maxWidth: isLetterGenerated ? '95vw' : undefined }}>
        
        {!isLetterGenerated ? (
          // INPUT FORM VIEW
          <div className="flex flex-col h-full overflow-hidden">
            <div className="px-6 py-4 border-b shrink-0 bg-white z-10">
              <h2 className="text-xl font-semibold">Generate Cover Letter</h2>
              <p className="text-sm text-muted-foreground">Tailor your application using AI analysis.</p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0 bg-slate-50/30">
              <div className="space-y-8 max-w-2xl mx-auto">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="jd" className="text-base font-semibold">
                      Job Description <span className="text-red-500">*</span>
                    </Label>
                    <span className={cn(
                      "text-xs font-medium px-2 py-1 rounded-full",
                      charCount >= 50 ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                    )}>
                      {charCount} / 50 characters min
                    </span>
                  </div>
                  <Textarea
                    id="jd"
                    placeholder="Paste the job description here..."
                    rows={12}
                    className="resize-none overflow-y-auto focus-visible:ring-blue-600 bg-white"
                    value={jobDescriptionInput}
                    onChange={handleJobDescriptionChange}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Choose your Resume</Label>
                  <RadioGroup value={resumeSource} onValueChange={setResumeSource} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Label htmlFor="current" className={cn(
                      "flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-white p-4 hover:bg-accent cursor-pointer transition-all",
                      resumeSource === "current" && "border-blue-600 bg-blue-50/50"
                    )}>
                      <RadioGroupItem value="current" id="current" className="sr-only" />
                      <Database className="mb-3 h-6 w-6 text-blue-600" />
                      <span className="text-sm font-medium">Use Current Data</span>
                    </Label>

                    <div>
                      <input 
                        ref={fileInputRef} 
                        type="file" 
                        accept=".pdf,.docx" 
                        onChange={handleFileSelect} 
                        className="hidden" 
                        aria-label="Upload resume file"
                      />
                      <Label htmlFor="upload" onClick={handleUploadClick} className={cn(
                        "flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-white p-4 hover:bg-accent cursor-pointer transition-all w-full",
                        resumeSource === "upload" && "border-purple-600 bg-purple-50/50"
                      )}>
                        <RadioGroupItem value="upload" id="upload" className="sr-only" />
                        {isProcessingFile ? <Loader2 className="mb-3 h-6 w-6 text-purple-600 animate-spin" /> : <FileUp className="mb-3 h-6 w-6 text-purple-600" />}
                        <span className="text-sm font-medium">Upload CV</span>
                      </Label>
                    </div>

                    <Label htmlFor="saved" className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-white p-4 opacity-50 cursor-not-allowed">
                      <RadioGroupItem value="saved" id="saved" className="sr-only" disabled />
                      <FileText className="mb-3 h-6 w-6 text-orange-600" />
                      <span className="text-sm font-medium">Select Saved CV</span>
                      <span className="text-[10px] text-muted-foreground text-center">(Login required)</span>
                    </Label>
                  </RadioGroup>

                  {uploadedFile && (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700 truncate">File Uploaded: {uploadedFile.name}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleRemoveFile} className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {fileError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg"><span className="text-sm text-red-700">{fileError}</span></div>}
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-white flex justify-between items-center shrink-0 z-10">
              <div className="max-w-[60%]">
                {isGenerating && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-blue-600" />AI is analyzing requirements...</div>}
                {error && <span className="text-sm text-red-500 line-clamp-1">{error}</span>}
              </div>
              <Button onClick={handleGenerate} disabled={isGenerateDisabled} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-8">
                {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
                Generate Letter
              </Button>
            </div>
          </div>
        ) : (
          // EDITOR VIEW
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b shrink-0 flex items-center justify-between bg-slate-50 z-10">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => setShowTemplates(true)} className="gap-2">
                  <Palette className="h-4 w-4" />
                  {selectedTemplate.charAt(0).toUpperCase() + selectedTemplate.slice(1)} Template
                </Button>
                <Select value={selectedFont} onValueChange={(v) => setSelectedFont(v as FontType)}>
                  <SelectTrigger className="w-40 bg-white">
                    <SelectValue placeholder="Font" />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map(f => <SelectItem key={f.value} value={f.value} style={{ fontFamily: FONTS[f.value as FontType] }}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleRegenerate} className="gap-2">
                  <RefreshCw className="h-4 w-4" />Regenerate
                </Button>
                <Button onClick={handleDownloadPDF} className="bg-blue-600 hover:bg-blue-700 gap-2">
                  <Download className="h-4 w-4" />Download
                </Button>
              </div>
            </div>

            {/* Split Panel */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden bg-slate-200/50">
              {/* Left Panel - Editor */}
              <div className="w-full md:w-[400px] border-r overflow-y-auto bg-white shrink-0">
                <div className="p-4 space-y-4">
                  {/* Contact Details */}
                  <Collapsible open={contactOpen} onOpenChange={setContactOpen}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-slate-50 rounded-lg border hover:bg-slate-100 transition-colors">
                      <span className="font-semibold text-sm">SENDER DETAILS</span>
                      <ChevronDown className={cn("h-4 w-4 transition-transform text-muted-foreground", contactOpen && "rotate-180")} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3 space-y-4 px-1">
                      {Object.entries(senderDetails).map(([key, value]) => (
                        <div key={key} className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1')}</Label>
                          <Input value={value} onChange={(e) => updateSender(key as keyof SenderDetails, e.target.value)} className="h-9 text-sm" />
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Recipient Details */}
                  <Collapsible open={recipientOpen} onOpenChange={setRecipientOpen}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-slate-50 rounded-lg border hover:bg-slate-100 transition-colors">
                      <span className="font-semibold text-sm">RECIPIENT DETAILS</span>
                      <ChevronDown className={cn("h-4 w-4 transition-transform text-muted-foreground", recipientOpen && "rotate-180")} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3 space-y-4 px-1">
                      {Object.entries(recipientDetails).map(([key, value]) => (
                        <div key={key} className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1')}</Label>
                          <Input value={value} onChange={(e) => updateRecipient(key as keyof RecipientDetails, e.target.value)} className="h-9 text-sm" />
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Cover Letter Content */}
                  <Collapsible open={contentOpen} onOpenChange={setContentOpen}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-slate-50 rounded-lg border hover:bg-slate-100 transition-colors">
                      <span className="font-semibold text-sm">LETTER CONTENT</span>
                      <ChevronDown className={cn("h-4 w-4 transition-transform text-muted-foreground", contentOpen && "rotate-180")} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3 px-1">
                      <Textarea
                        value={letterContent}
                        onChange={(e) => setLetterContent(e.target.value)}
                        className="min-h-[400px] text-sm leading-relaxed"
                        placeholder="Your cover letter content..."
                      />
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </div>

              {/* Right Panel - Preview */}
              <div className="flex-1 overflow-auto bg-slate-200 p-8 flex justify-center items-start">
                <div 
                  id="pdf-preview"
                  ref={previewRef}
                  className="bg-white shadow-2xl w-full max-w-[650px] transform origin-top transition-all"
                  style={{ 
                    aspectRatio: '1/1.414', 
                    fontFamily: FONTS[selectedFont],
                  }}
                >
                  {/* Header */}
                  <div className={cn("p-10", templateStyles.headerBg, templateStyles.headerText)}>
                    <h1 className="text-3xl font-black tracking-tighter">{senderDetails.fullName.toUpperCase()}</h1>
                    <p className="text-base font-medium opacity-90 border-t border-current/20 mt-1 pt-1">{senderDetails.title}</p>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-[10px] font-bold uppercase tracking-widest opacity-80">
                      <span className="flex items-center gap-1.5">{senderDetails.city}</span>
                      <span className="flex items-center gap-1.5">{senderDetails.phone}</span>
                      <span className="flex items-center gap-1.5">{senderDetails.email}</span>
                      <span className="flex items-center gap-1.5">{senderDetails.linkedin}</span>
                    </div>
                  </div>
                  
                  {/* Recipient */}
                  <div className={cn("pt-10 px-10 text-sm", selectedTemplate === 'minimal' && 'border-t mx-10 px-0')}>
                    <p className="font-bold">{recipientDetails.fullName}</p>
                    <p className="text-muted-foreground">{recipientDetails.position}</p>
                    <p className="text-muted-foreground">{recipientDetails.company}</p>
                    <p className="text-muted-foreground">{recipientDetails.addressLine1}</p>
                    <p className="text-muted-foreground">{recipientDetails.addressLine2}</p>
                    <p className="text-muted-foreground">{recipientDetails.city}</p>
                  </div>
                  
                  {/* Body */}
                  <div className={cn("px-10 py-6 text-sm leading-relaxed whitespace-pre-wrap text-slate-800", templateStyles.bodyPadding)}>
                    {letterContent}
                  </div>
                </div>
              </div>
            </div>

            {/* Template Selection Modal */}
            {showTemplates && (
              <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowTemplates(false)}>
                <div className="bg-white rounded-2xl p-8 max-w-4xl w-full shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-2xl font-bold tracking-tight">Select a Professional Template</h3>
                      <p className="text-muted-foreground text-sm">Choose a style that matches your career goal.</p>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setShowTemplates(false)}><X className="h-5 w-5" /></Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(['modern', 'classic', 'minimal'] as TemplateType[]).map(template => (
                      <button
                        key={template}
                        onClick={() => { setSelectedTemplate(template); setShowTemplates(false) }}
                        className={cn(
                          "group relative flex flex-col items-start text-left p-2 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl",
                          selectedTemplate === template ? "border-blue-600 bg-blue-50/30 ring-4 ring-blue-600/10" : "border-transparent bg-slate-50 hover:bg-white hover:border-slate-200"
                        )}
                        aria-label={`Select ${template} template`}
                        aria-pressed={selectedTemplate === template}
                      >
                        <div className={cn(
                          "w-full aspect-[1/1.3] rounded-xl overflow-hidden mb-4 shadow-sm group-hover:shadow-md transition-shadow",
                          template === 'modern' && "bg-blue-700",
                          template === 'classic' && "bg-slate-100",
                          template === 'minimal' && "bg-white border-2"
                        )}>
                           <div className="w-full h-1/4 opacity-50 bg-gradient-to-b from-black/20 to-transparent" />
                        </div>
                        <div className="px-3 pb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-lg capitalize tracking-tight group-hover:text-blue-600 transition-colors">{template}</p>
                            {selectedTemplate === template && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {template === 'modern' && 'Bold header with striking contrast and clean typography.'}
                            {template === 'classic' && 'Traditional professional layout optimized for enterprise roles.'}
                            {template === 'minimal' && 'Elegant and simple formatting for a modern creative look.'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
