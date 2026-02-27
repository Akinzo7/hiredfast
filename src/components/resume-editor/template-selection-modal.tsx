"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type TemplateCategory = "All" | "Eye-Catchers" | "No-Nonsense" | "Tried & True" | "Clean & Simple" | "Cool & Quirky" | "Story Tellers"

export interface TemplateOption {
  id: string
  name: string
  description: string
  category: TemplateCategory
  thumbnailBg: string // Tailwind class for placeholder
}

const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  "All", "Eye-Catchers", "No-Nonsense", "Tried & True", "Clean & Simple", "Cool & Quirky", "Story Tellers"
]

const TEMPLATES: TemplateOption[] = [
  // Eye-Catchers
  { id: "modern", name: "Bold", description: "Make a strong first impression with striking headers.", category: "Eye-Catchers", thumbnailBg: "bg-blue-50" },
  { id: "spotlight", name: "Spotlight", description: "Highlights key information with a modular layout.", category: "Eye-Catchers", thumbnailBg: "bg-indigo-50" },
  { id: "dynamic", name: "Dynamic", description: "Modern and energetic design to showcase your achievements.", category: "Eye-Catchers", thumbnailBg: "bg-sky-50" },
  { id: "horizon", name: "Horizon", description: "Streamlined design with prominent headers.", category: "Eye-Catchers", thumbnailBg: "bg-cyan-50" },
  { id: "vibrant", name: "Vibrant", description: "Uses color accents to guide the reader's eye.", category: "Eye-Catchers", thumbnailBg: "bg-rose-50" },
  
  // No-Nonsense
  { id: "classic", name: "Professional", description: "Traditional layout widely accepted by major corporations.", category: "No-Nonsense", thumbnailBg: "bg-slate-50" },
  { id: "executive", name: "Executive", description: "Clean, authoritative design for senior roles.", category: "No-Nonsense", thumbnailBg: "bg-gray-50" },
  { id: "simple", name: "Simple", description: "Focuses purely on content with zero distractions.", category: "No-Nonsense", thumbnailBg: "bg-neutral-50" },
  { id: "functional", name: "Functional", description: "Optimized for readability and ATS systems.", category: "No-Nonsense", thumbnailBg: "bg-stone-50" },

  // Tried & True
  { id: "standard", name: "Standard", description: "The industry standard for decades.", category: "Tried & True", thumbnailBg: "bg-zinc-50" },
  { id: "corporate", name: "Corporate", description: "Tailored for banking, law, and enterprise.", category: "Tried & True", thumbnailBg: "bg-slate-100" },
  { id: "academic", name: "Academic", description: "Detailed layout suitable for CVs and research.", category: "Tried & True", thumbnailBg: "bg-white border" },

  // Clean & Simple
  { id: "minimal", name: "Clean", description: "Maximizes whitespace for excellent readability.", category: "Clean & Simple", thumbnailBg: "bg-white border" },
  { id: "air", name: "Air", description: "Open layout that feels light and approachable.", category: "Clean & Simple", thumbnailBg: "bg-blue-50/30" },
  { id: "focus", name: "Focus", description: "Draws attention to experience with subtle formatting.", category: "Clean & Simple", thumbnailBg: "bg-gray-50/50" },
  { id: "compact", name: "Compact", description: "Fits more information onto a single page.", category: "Clean & Simple", thumbnailBg: "bg-white border-dashed" },

  // Cool & Quirky
  { id: "tech", name: "Tech", description: "Monospace accents for developer roles.", category: "Cool & Quirky", thumbnailBg: "bg-emerald-50" },
  { id: "startup", name: "Startup", description: "Fresh, youthful vibe for modern companies.", category: "Cool & Quirky", thumbnailBg: "bg-purple-50" },
  { id: "creative", name: "Creative", description: "Unique grid system for designers.", category: "Cool & Quirky", thumbnailBg: "bg-pink-50" },

  // Story Tellers
  { id: "narrative", name: "Narrative", description: "Emphasizes the summary and bio sections.", category: "Story Tellers", thumbnailBg: "bg-amber-50" },
  { id: "journey", name: "Journey", description: "Visual timeline of your career path.", category: "Story Tellers", thumbnailBg: "bg-orange-50" },
]

interface TemplateSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedTemplateId: string
  onSelectTemplate: (id: string) => void
  accentColor: string
}

export function TemplateSelectionModal({
  open,
  onOpenChange,
  selectedTemplateId,
  onSelectTemplate,
  accentColor,
}: TemplateSelectionModalProps) {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>("All")

  const filteredTemplates = activeCategory === "All" 
    ? TEMPLATES 
    : TEMPLATES.filter(t => t.category === activeCategory)

  // Group templates by category for "All" view or just show list
  // The design shows a specific category header "Eye-Catchers" enabled. 
  // Let's implement a simple filtered list first, but if All is selected, maybe we show all?
  // The image implies we filter by clicking pills.

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[95vw] !w-[95vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-2xl bg-background border-border">
        <DialogHeader className="px-6 py-4 border-b shrink-0 bg-background z-10">
          <DialogTitle className="text-xl font-semibold">Select a Template</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 bg-muted/20">
          {/* Category Pills */}
          <div className="px-6 py-4 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 bg-background border-b">
            {TEMPLATE_CATEGORIES.map(category => (
              <Button
                key={category}
                variant="ghost"
                size="sm"
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "rounded-full px-4 h-8 text-sm font-medium transition-all",
                  activeCategory === category 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Templates Grid - Native Scroll */}
          <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
             <div className="space-y-8">
                {activeCategory !== "All" ? (
                   <div>
                      <h2 className="text-2xl font-bold mb-6 text-foreground">{activeCategory}</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredTemplates.map(template => (
                           <TemplateCard 
                              key={template.id} 
                              template={template} 
                              isSelected={selectedTemplateId === template.id} 
                              accentColor={accentColor}
                              onSelect={() => {
                                onSelectTemplate(template.id)
                                onOpenChange(false)
                              }}
                           />
                        ))}
                      </div>
                   </div>
                ) : (
                    // For "All", we could list all categories or just a big grid. 
                    // Let's show a big grid for now for simplicity, or we can iterate categories.
                    // Let's iterate categories to match the likely expected behavior of "browsing all" if not specified.
                    // Actually, typically "All" just dumps everything in a grid.
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {TEMPLATES.map(template => (
                           <TemplateCard 
                              key={template.id} 
                              template={template} 
                              isSelected={selectedTemplateId === template.id} 
                              accentColor={accentColor}
                              onSelect={() => {
                                onSelectTemplate(template.id)
                                onOpenChange(false)
                              }}
                           />
                        ))}
                    </div>
                )}
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface TemplateCardProps {
  template: TemplateOption
  isSelected: boolean
  onSelect: () => void
  accentColor: string
}

function TemplateCard({ template, isSelected, onSelect, accentColor }: TemplateCardProps) {
  return (
    <div 
      onClick={onSelect}
      className={cn(
        "group relative cursor-pointer rounded-xl bg-card transition-all duration-200 overflow-hidden border-2 flex flex-col h-full",
        isSelected 
          ? "border-primary ring-4 ring-primary/10 shadow-lg scale-[1.02]" 
          : "border-border shadow-sm hover:shadow-xl hover:border-primary/50 hover:-translate-y-1"
      )}
    >
       <div className="relative overflow-hidden w-full" style={{ height: "138px" }}>
          <div
            style={{
              transform: "scale(0.35)",
              transformOrigin: "top left",
              width: "280px",
              pointerEvents: "none",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          >
            <TemplateThumbnail templateId={template.id} accentColor={accentColor} />
          </div>

          {/* Selected Overlay */}
          {isSelected && (
            <div className="absolute inset-0 bg-blue-900/10 flex items-center justify-center backdrop-blur-[1px]">
               <div className="bg-white rounded-full p-2 shadow-xl animate-in zoom-in spin-in-90 duration-300">
                 <CheckCircle2 className="h-8 w-8 text-primary fill-primary-foreground/20" />
               </div>
            </div>
          )}
       </div>

       {/* Content */}
       <div className="p-4 flex flex-col flex-1 border-t">
          <div className="flex justify-between items-start mb-2">
            <h3 className={cn("font-bold text-lg", isSelected ? "text-primary" : "text-foreground")}>{template.name}</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{template.description}</p>
       </div>
    </div>
  )
}

interface TemplateThumbnailProps {
  templateId: string
  accentColor: string
}

function TemplateThumbnail({ templateId, accentColor }: TemplateThumbnailProps) {
  const name = "Alex Johnson"
  const role = "Senior Product Designer"
  const company = "Google"
  const skills = "Figma - React - Strategy"
  const summary = "Creative designer with 8+ years of experience building..."
  const achievement = "Led redesign increasing conversion by 40%"

  const isSidebar = ["modern", "spotlight", "tech", "startup", "dynamic"].includes(templateId)
  const isClassic = ["classic", "corporate", "executive", "standard", "academic"].includes(templateId)
  const isHeader = ["horizon", "vibrant", "creative"].includes(templateId)
  const inner = "w-[280px] bg-white overflow-hidden border border-slate-100"

  if (isSidebar) {
    return (
      <div className={inner} style={{ height: "396px" }}>
        <div className="flex h-full">
          <div className="w-[35%] h-full p-4 space-y-3 text-white" style={{ backgroundColor: accentColor }}>
            <div className="w-8 h-8 rounded-full bg-white/20 mb-2" />
            <div className="text-[8px] font-semibold truncate">{name}</div>
            <div className="text-[6px] opacity-80 truncate">{skills}</div>
            <div className="h-px w-full bg-white/20 mt-2 mb-2" />
            <div className="space-y-1">
              <div className="h-1 w-full bg-white/20 rounded" />
              <div className="h-1 w-5/6 bg-white/20 rounded" />
              <div className="h-1 w-4/6 bg-white/20 rounded" />
            </div>
            <div className="h-px w-full bg-white/20 mt-2 mb-2" />
            <div className="space-y-1">
              <div className="h-1 w-full bg-white/20 rounded" />
              <div className="h-1 w-2/3 bg-white/20 rounded" />
            </div>
          </div>
          <div className="flex-1 p-4 space-y-3">
            <div>
              <div className="text-[11px] font-bold truncate mb-1" style={{ color: accentColor }}>
                {name}
              </div>
              <div className="h-2 w-1/2 bg-slate-300 rounded mb-2" />
              <div className="text-[7px] text-slate-400 truncate">{role}</div>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="space-y-1.5">
              <div className="text-[7px] font-semibold uppercase tracking-wide truncate" style={{ color: accentColor }}>
                Experience
              </div>
              <div className="h-2.5 w-3/4 bg-slate-800 rounded opacity-80" />
              <div className="h-1.5 w-1/2 bg-slate-400 rounded" />
              <div className="h-1 w-full bg-slate-200 rounded" />
              <div className="h-1 w-5/6 bg-slate-200 rounded" />
              <div className="text-[6px] text-slate-400 truncate">{achievement}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isClassic) {
    return (
      <div className={inner} style={{ height: "396px" }}>
        <div className="p-5 space-y-3">
          <div className="text-center pb-3 border-b-2" style={{ borderColor: accentColor }}>
            <div className="text-[10px] font-bold text-slate-800 tracking-wide uppercase truncate">{name}</div>
            <div className="text-[7px] text-slate-500 mt-1 truncate">{role}</div>
            <div className="flex justify-center gap-2 mt-1">
              <div className="h-1 w-16 bg-slate-300 rounded" />
              <div className="h-1 w-16 bg-slate-300 rounded" />
            </div>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-2 w-1/3 bg-slate-100 mb-1.5 flex items-center pl-1 border-l-2" style={{ borderColor: accentColor }}>
                <span className="text-[6px] font-semibold uppercase tracking-wide truncate text-slate-500">Section</span>
              </div>
              <div className="space-y-1 ml-1">
                <div className="h-2 w-2/3 bg-slate-700 rounded" />
                <div className="h-1 w-full bg-slate-200 rounded" />
                <div className="h-1 w-5/6 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isHeader) {
    return (
      <div className={inner} style={{ height: "396px" }}>
        <div className="p-5 text-white" style={{ backgroundColor: accentColor }}>
          <div className="text-[10px] font-bold truncate">{name}</div>
          <div className="text-[7px] opacity-80 truncate mt-1">{role}</div>
          <div className="flex gap-2 mt-2">
            <div className="h-1 w-14 bg-white/40 rounded" />
            <div className="h-1 w-14 bg-white/40 rounded" />
          </div>
        </div>
        <div className="flex gap-3 p-4">
          <div className="flex-1 space-y-2">
            <div className="text-[7px] font-semibold uppercase tracking-wide truncate" style={{ color: accentColor }}>
              Experience
            </div>
            <div className="h-1 w-full bg-slate-200 rounded" />
            <div className="h-1 w-5/6 bg-slate-200 rounded" />
            <div className="h-1 w-4/6 bg-slate-200 rounded" />
            <div className="text-[7px] font-semibold uppercase tracking-wide truncate mt-2" style={{ color: accentColor }}>
              Projects
            </div>
            <div className="h-1 w-full bg-slate-200 rounded" />
            <div className="h-1 w-3/4 bg-slate-200 rounded" />
            <div className="text-[6px] text-slate-400 truncate">{company}</div>
          </div>
          <div className="w-16 space-y-2">
            <div className="h-12 rounded-lg bg-slate-100 p-1.5 space-y-1">
              <div className="h-1 w-full bg-slate-300 rounded" />
              <div className="h-1 w-3/4 bg-slate-300 rounded" />
            </div>
            <div className="h-12 rounded-lg bg-slate-100 p-1.5 space-y-1">
              <div className="h-1 w-full bg-slate-300 rounded" />
              <div className="h-1 w-2/3 bg-slate-300 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={inner} style={{ height: "396px" }}>
      <div className="p-5 space-y-3">
        <div className="pb-2">
          <div className="text-[11px] font-semibold text-slate-800 truncate">{name}</div>
          <div className="text-[7px] text-slate-500 truncate mt-1">{summary}</div>
        </div>
        <div className="flex gap-3">
          <div className="w-16 space-y-3">
            <div>
              <div className="h-1 w-full rounded mb-1" style={{ backgroundColor: accentColor, opacity: 0.4 }} />
              <div className="space-y-0.5">
                <div className="h-1 w-full bg-slate-200 rounded" />
                <div className="h-1 w-3/4 bg-slate-200 rounded" />
              </div>
            </div>
            <div>
              <div className="h-1 w-full rounded mb-1" style={{ backgroundColor: accentColor, opacity: 0.4 }} />
              <div className="space-y-0.5">
                <div className="h-1 w-full bg-slate-200 rounded" />
                <div className="h-1 w-2/3 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-1 w-full rounded mb-1" style={{ backgroundColor: accentColor, opacity: 0.4 }} />
            <div className="h-2 w-2/3 bg-slate-700 rounded" />
            <div className="h-1 w-full bg-slate-200 rounded" />
            <div className="h-1 w-5/6 bg-slate-200 rounded" />
            <div className="h-1 w-4/6 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}
