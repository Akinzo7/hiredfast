"use client"

import { useEffect, useMemo, useState } from "react"
import { Check } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { db } from "@/lib/firebase"
import { LOCAL_TEMPLATE_THUMBNAILS } from "@/lib/template-thumbnails"
import { TEMPLATE_OPTIONS, TemplateCategory, type TemplateOption } from "./render-layout"

type FilterCategory = "All" | TemplateCategory

const FILTER_CATEGORIES: FilterCategory[] = [
  "All",
  "Eye-Catchers",
  "No-Nonsense",
  "Tried & True",
  "Clean & Simple",
  "Cool & Quirky",
  "Story Tellers",
]

const CATEGORY_ORDER: TemplateCategory[] = [
  "Eye-Catchers",
  "No-Nonsense",
  "Tried & True",
  "Clean & Simple",
  "Cool & Quirky",
  "Story Tellers",
]

interface TemplateSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedTemplateId: string
  onSelectTemplate: (id: string) => void
  accentColor: string
}

const TemplateCard = ({
  template,
  isSelected,
  onSelect,
  thumbnailUrl,
}: {
  template: TemplateOption
  isSelected: boolean
  onSelect: (templateId: string) => void
  thumbnailUrl: string
}) => {
  const [imgLoaded, setImgLoaded] = useState(false)

  return (
    <div
      onClick={() => onSelect(template.id)}
      className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
        isSelected
          ? "border-blue-500 ring-2 ring-blue-400"
          : "border-transparent hover:border-gray-600"
      }`}
    >
      <div className="relative bg-white overflow-hidden" style={{ aspectRatio: "0.707" }}>
        {!imgLoaded && <div className="absolute inset-0 bg-gray-700 animate-pulse" />}
        <img
          src={thumbnailUrl}
          alt={template.name}
          className="w-full h-full object-cover object-top"
          onLoad={() => setImgLoaded(true)}
          style={{ display: imgLoaded ? "block" : "none" }}
        />
        {isSelected && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-10 flex items-center justify-center">
            <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
              <Check className="w-3 h-3 text-white" />
            </div>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-white text-sm">{template.name}</p>
        <p className="text-gray-400 text-xs mt-0.5 leading-tight">{template.description}</p>
      </div>
    </div>
  )
}

export function TemplateSelectionModal({
  open,
  onOpenChange,
  selectedTemplateId,
  onSelectTemplate,
}: TemplateSelectionModalProps) {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("All")
  const [thumbnailMap, setThumbnailMap] = useState<Record<string, string>>(LOCAL_TEMPLATE_THUMBNAILS)

  useEffect(() => {
    let isMounted = true

    const loadThumbnails = async () => {
      try {
        const docRef = doc(db, "app_config", "template_thumbnails")
        const snap = await getDoc(docRef)

        if (!isMounted) return

        if (snap.exists()) {
          const remoteMap = snap.data() as Record<string, string>
          setThumbnailMap({ ...LOCAL_TEMPLATE_THUMBNAILS, ...remoteMap })
        } else {
          setThumbnailMap(LOCAL_TEMPLATE_THUMBNAILS)
        }
      } catch {
        if (isMounted) {
          setThumbnailMap(LOCAL_TEMPLATE_THUMBNAILS)
        }
      }
    }

    void loadThumbnails()

    return () => {
      isMounted = false
    }
  }, [])

  const groupedTemplates = useMemo(() => {
    return CATEGORY_ORDER.reduce<Record<TemplateCategory, TemplateOption[]>>((acc, category) => {
      acc[category] = TEMPLATE_OPTIONS.filter((template) => template.category === category)
      return acc
    }, {
      "Eye-Catchers": [],
      "No-Nonsense": [],
      "Tried & True": [],
      "Clean & Simple": [],
      "Cool & Quirky": [],
      "Story Tellers": [],
    })
  }, [])

  const filteredTemplates =
    activeCategory === "All"
      ? TEMPLATE_OPTIONS
      : TEMPLATE_OPTIONS.filter((template) => template.category === activeCategory)

  const handleSelect = (templateId: string) => {
    onSelectTemplate(templateId)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 gap-0 border-border bg-background">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="text-xl font-semibold text-white">Select a Template</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 border-b border-border flex flex-wrap gap-2">
          {FILTER_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm transition-colors border",
                activeCategory === category
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-transparent border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {activeCategory === "All" ? (
            <div className="space-y-8">
              {CATEGORY_ORDER.map((categoryName) => {
                const templatesInCategory = groupedTemplates[categoryName]
                if (!templatesInCategory.length) return null

                return (
                  <div key={categoryName}>
                    <h2 className="text-2xl font-bold text-white mb-4">{categoryName}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                      {templatesInCategory.map((template) => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          isSelected={selectedTemplateId === template.id}
                          onSelect={handleSelect}
                          thumbnailUrl={
                            thumbnailMap[template.id] || LOCAL_TEMPLATE_THUMBNAILS[template.id] || ""
                          }
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={selectedTemplateId === template.id}
                  onSelect={handleSelect}
                  thumbnailUrl={thumbnailMap[template.id] || LOCAL_TEMPLATE_THUMBNAILS[template.id] || ""}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

