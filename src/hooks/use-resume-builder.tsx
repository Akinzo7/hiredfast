"use client"

import { ReactNode, createContext, useContext, useEffect, useRef, useState } from "react"
import { useDebounce } from "use-debounce"
import { saveResume, updateResume, getResume } from "@/lib/firestore"

export type ResumeData = {
  personalInfo: {
    fullName: string
    functionalTitle: string
    industryTitle: string
    email: string
    phone: string
    linkedin: string
    portfolio: string
    address: string
    photo: string
  }
  summary: string
  coreCompetencies: string
  achievements: string
  workExperienceRich: string
  educationRich: string
  skillsRich: string
  workExperience: Array<{
    id: string
    company: string
    role: string
    startDate: string
    endDate: string
    current: boolean
    achievements: string
  }>
  education: Array<{
    id: string
    school: string
    degree: string
    admissionYear: string
    graduationYear: string
    description: string
  }>
  skills: {
    technical: string
    soft: string
  }
  projects: Array<{
    id: string
    title: string
    description: string
    link: string
    startDate: string
    endDate: string
  }>
  languages: Array<{ id: string; name: string; proficiency: string }>
  certifications: Array<{ id: string; name: string; issuer: string; year: string }>
  associations: Array<{ id: string; name: string; role: string }>
  customSections: Array<{ id: string; title: string; content: string }>
}

export const initialResumeData: ResumeData = {
  personalInfo: {
    fullName: "",
    functionalTitle: "",
    industryTitle: "",
    email: "",
    phone: "",
    linkedin: "",
    portfolio: "",
    address: "",
    photo: "",
  },
  summary: "",
  coreCompetencies: "",
  achievements: "",
  workExperienceRich: "",
  educationRich: "",
  skillsRich: "",
  workExperience: [],
  education: [],
  skills: { technical: "", soft: "" },
  projects: [],
  languages: [],
  certifications: [],
  associations: [],
  customSections: [],
}

interface ResumeBuilderContextType {
  currentStep: number
  totalSteps: number
  resumeData: ResumeData
  resumeId: string | null
  isLoaded: boolean
  hiddenSections: string[]
  setHiddenSections: (sections: string[]) => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  updatePersonalInfo: (data: Partial<ResumeData["personalInfo"]>) => void
  setSummary: (summary: string) => void
  setCoreCompetencies: (coreCompetencies: string) => void
  setAchievements: (achievements: string) => void
  setWorkExperience: (data: ResumeData["workExperience"]) => void
  setWorkExperienceRich: (workExperienceRich: string) => void
  setEducation: (data: ResumeData["education"]) => void
  setEducationRich: (educationRich: string) => void
  setSkills: (data: Partial<ResumeData["skills"]>) => void
  setSkillsRich: (skillsRich: string) => void
  setProjects: (data: ResumeData["projects"]) => void
  setLanguages: (data: ResumeData["languages"]) => void
  setCertifications: (data: ResumeData["certifications"]) => void
  setAssociations: (data: ResumeData["associations"]) => void
  setCustomSections: (data: ResumeData["customSections"]) => void
}

const ResumeBuilderContext = createContext<ResumeBuilderContextType | undefined>(undefined)

const asString = (value: unknown): string => (typeof value === "string" ? value : "")

const mergeResumeData = (value: unknown): ResumeData => {
  if (!value || typeof value !== "object") {
    return initialResumeData
  }

  const parsed = value as Record<string, unknown>
  const parsedPersonal = (parsed.personalInfo as Record<string, unknown> | undefined) ?? {}
  const parsedSkills = (parsed.skills as Record<string, unknown> | undefined) ?? {}
  const parsedWorkExperience = Array.isArray(parsed.workExperience) ? parsed.workExperience : []
  const parsedEducation = Array.isArray(parsed.education) ? parsed.education : []
  const parsedProjects = Array.isArray(parsed.projects) ? parsed.projects : []
  const parsedLanguages = Array.isArray(parsed.languages) ? parsed.languages : []
  const parsedCertifications = Array.isArray(parsed.certifications) ? parsed.certifications : []
  const parsedAssociations = Array.isArray(parsed.associations) ? parsed.associations : []
  const parsedCustomSections = Array.isArray(parsed.customSections) ? parsed.customSections : []

  const skillsRichValue = asString(parsed.skillsRich)

  const technicalSkills = (() => {
    const hasSkilsRich = skillsRichValue.trim().length > 0
    if (hasSkilsRich) {
      return asString(parsedSkills.technical)
    }
    const baseTechnicalSkills = asString(parsedSkills.technical)
    const legacySoftSkills = asString(parsedSkills.soft)
    return [baseTechnicalSkills, legacySoftSkills]
      .filter(Boolean)
      .join(baseTechnicalSkills && legacySoftSkills ? "\n" : "")
  })()

  return {
    personalInfo: {
      fullName: asString(parsedPersonal.fullName),
      functionalTitle: asString(parsedPersonal.functionalTitle),
      industryTitle: asString(parsedPersonal.industryTitle),
      email: asString(parsedPersonal.email),
      phone: asString(parsedPersonal.phone),
      linkedin: asString(parsedPersonal.linkedin),
      portfolio: asString(parsedPersonal.portfolio),
      address: asString(parsedPersonal.address),
      photo: asString(parsedPersonal.photo) || asString(parsedPersonal.photoBase64),
    },
    summary: asString(parsed.summary),
    coreCompetencies: asString(parsed.coreCompetencies),
    achievements: asString(parsed.achievements),
    workExperienceRich: asString(parsed.workExperienceRich),
    educationRich: asString(parsed.educationRich),
    skillsRich: skillsRichValue,
    workExperience: parsedWorkExperience.map((item) => {
      const workItem = (item as Record<string, unknown>) ?? {}
      return {
        id: asString(workItem.id),
        company: asString(workItem.company),
        role: asString(workItem.role),
        startDate: asString(workItem.startDate),
        endDate: asString(workItem.endDate),
        current: Boolean(workItem.current),
        achievements: asString(workItem.achievements),
      }
    }),
    education: parsedEducation.map((item) => {
      const educationItem = (item as Record<string, unknown>) ?? {}
      return {
        id: asString(educationItem.id),
        school: asString(educationItem.school),
        degree: asString(educationItem.degree),
        admissionYear: asString(educationItem.admissionYear),
        graduationYear: asString(educationItem.graduationYear),
        description: asString(educationItem.description),
      }
    }),
    skills: {
      technical: technicalSkills,
      soft: asString(parsedSkills.soft),
    },
    projects: parsedProjects.map((item) => {
      const projectItem = (item as Record<string, unknown>) ?? {}
      return {
        id: asString(projectItem.id),
        title: asString(projectItem.title),
        description: asString(projectItem.description),
        link: asString(projectItem.link),
        startDate: asString(projectItem.startDate),
        endDate: asString(projectItem.endDate),
      }
    }),
    languages: parsedLanguages.map((item) => {
      const languageItem = (item as Record<string, unknown>) ?? {}
      return {
        id: asString(languageItem.id),
        name: asString(languageItem.name),
        proficiency: asString(languageItem.proficiency),
      }
    }),
    certifications: parsedCertifications.map((item) => {
      const certificationItem = (item as Record<string, unknown>) ?? {}
      return {
        id: asString(certificationItem.id),
        name: asString(certificationItem.name),
        issuer: asString(certificationItem.issuer),
        year: asString(certificationItem.year),
      }
    }),
    associations: parsedAssociations.map((item) => {
      const associationItem = (item as Record<string, unknown>) ?? {}
      return {
        id: asString(associationItem.id),
        name: asString(associationItem.name),
        role: asString(associationItem.role),
      }
    }),
    customSections: parsedCustomSections.map((item) => {
      const customItem = (item as Record<string, unknown>) ?? {}
      return {
        id: asString(customItem.id),
        title: asString(customItem.title),
        content: asString(customItem.content),
      }
    }),
  }
}

interface ResumeBuilderProviderProps {
  children: ReactNode
  userId?: string | null
  initialResumeId?: string | null
}

export function ResumeBuilderProvider({ children, userId, initialResumeId }: ResumeBuilderProviderProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData)
  const [debouncedResumeData] = useDebounce(resumeData, 1000)
  const [isLoaded, setIsLoaded] = useState(false)
  const [resumeId, setResumeId] = useState<string | null>(initialResumeId ?? null)
  const [hiddenSections, setHiddenSectionsState] = useState<string[]>([])

  const [, setSaveError] = useState<string | null>(null)
  const hasLoadedCloud = useRef(false)
  const isSaving = useRef(false)

  // Load resume data: from Firestore if resumeId is provided, otherwise from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return

    if (initialResumeId && userId) {
      // Load from Firestore
      hasLoadedCloud.current = false
      getResume(userId, initialResumeId)
        .then((doc) => {
          if (doc?.data) {
            setResumeData(mergeResumeData(doc.data))
          }
          setResumeId(initialResumeId)
          hasLoadedCloud.current = true
          setIsLoaded(true)
        })
        .catch((error) => {
          console.error("Failed to load resume from cloud:", error)
          hasLoadedCloud.current = true
          setIsLoaded(true)
        })
    } else {
      // Load from localStorage (existing behavior)
      try {
        const testKey = "__storage_test__"
        localStorage.setItem(testKey, testKey)
        localStorage.removeItem(testKey)

        const savedData = localStorage.getItem("hiredfast_resume_data")
        if (savedData) {
          const parsed = JSON.parse(savedData)
          setResumeData(mergeResumeData(parsed))
        }

        const savedHiddenSections = localStorage.getItem("hiredfast_hidden_sections")
        if (savedHiddenSections) {
          const parsed = JSON.parse(savedHiddenSections)
          if (Array.isArray(parsed)) {
            setHiddenSectionsState(parsed.filter((id): id is string => typeof id === "string"))
          }
        }
      } catch (error) {
        console.warn("LocalStorage access denied or unavailable. Running in in-memory mode.", error)
      } finally {
        hasLoadedCloud.current = true
        setIsLoaded(true)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialResumeId, userId])

  // Save to localStorage (existing behavior, preserved for non-cloud usage)
  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return
    // Skip localStorage writes when operating in cloud mode
    if (initialResumeId) return

    try {
      localStorage.setItem("hiredfast_resume_data", JSON.stringify(debouncedResumeData))
      setSaveError(null)
    } catch (error) {
      console.error("Failed to save resume data:", error)
      if (
        error instanceof Error &&
        (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")
      ) {
        setSaveError("Storage full. Changes are not saved.")
      } else {
        setSaveError("Storage unavailable.")
      }
    }
  }, [debouncedResumeData, isLoaded, initialResumeId])

  // Auto-save to Firestore when user is authenticated
  useEffect(() => {
    if (!isLoaded || !userId || !hasLoadedCloud.current) return
    if (isSaving.current) return

    const title = resumeData.personalInfo.fullName?.trim() || "Untitled Resume"

    isSaving.current = true
    if (resumeId) {
      // Update existing resume
      updateResume(userId, resumeId, title, debouncedResumeData)
        .catch((error) => console.error("Failed to auto-save resume:", error))
        .finally(() => { isSaving.current = false })
    } else {
      // Create new resume
      saveResume(userId, title, debouncedResumeData)
        .then((newId) => {
          setResumeId(newId)
          // Update URL without full page reload
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href)
            url.searchParams.set("id", newId)
            window.history.replaceState({}, "", url.toString())
          }
        })
        .catch((error) => console.error("Failed to save new resume:", error))
        .finally(() => { isSaving.current = false })
    }
  }, [debouncedResumeData, isLoaded, userId, resumeId, resumeData.personalInfo.fullName])

  // Persist hiddenSections to localStorage
  useEffect(() => {
    if (!isLoaded) return
    try {
      localStorage.setItem("hiredfast_hidden_sections", JSON.stringify(hiddenSections))
    } catch {
      // ignore
    }
  }, [hiddenSections, isLoaded])

  const setHiddenSections = (sections: string[]) => {
    setHiddenSectionsState(sections)
  }

  const updatePersonalInfo = (data: Partial<ResumeData["personalInfo"]>) => {
    setResumeData((prev) => ({ ...prev, personalInfo: { ...prev.personalInfo, ...data } }))
  }

  const setSummary = (summary: string) => {
    setResumeData((prev) => ({ ...prev, summary }))
  }

  const setCoreCompetencies = (coreCompetencies: string) => {
    setResumeData((prev) => ({ ...prev, coreCompetencies }))
  }

  const setAchievements = (achievements: string) => {
    setResumeData((prev) => ({ ...prev, achievements }))
  }

  const setWorkExperience = (data: ResumeData["workExperience"]) => {
    setResumeData((prev) => ({ ...prev, workExperience: data }))
  }

  const setWorkExperienceRich = (workExperienceRich: string) => {
    setResumeData((prev) => ({ ...prev, workExperienceRich }))
  }

  const setEducation = (data: ResumeData["education"]) => {
    setResumeData((prev) => ({ ...prev, education: data }))
  }

  const setEducationRich = (educationRich: string) => {
    setResumeData((prev) => ({ ...prev, educationRich }))
  }

  const setSkills = (data: Partial<ResumeData["skills"]>) => {
    setResumeData((prev) => ({ ...prev, skills: { ...prev.skills, ...data } }))
  }

  const setSkillsRich = (skillsRich: string) => {
    setResumeData((prev) => ({ ...prev, skillsRich }))
  }

  const setProjects = (data: ResumeData["projects"]) => {
    setResumeData((prev) => ({ ...prev, projects: data }))
  }

  const setLanguages = (data: ResumeData["languages"]) => {
    setResumeData((prev) => ({ ...prev, languages: data }))
  }

  const setCertifications = (data: ResumeData["certifications"]) => {
    setResumeData((prev) => ({ ...prev, certifications: data }))
  }

  const setAssociations = (data: ResumeData["associations"]) => {
    setResumeData((prev) => ({ ...prev, associations: data }))
  }

  const setCustomSections = (data: ResumeData["customSections"]) => {
    setResumeData((prev) => ({ ...prev, customSections: data }))
  }

  const totalSteps = 7
  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, totalSteps))
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1))
  const goToStep = (step: number) => setCurrentStep(Math.max(1, Math.min(step, totalSteps)))

  const value = {
    currentStep,
    totalSteps,
    resumeData,
    resumeId,
    isLoaded,
    hiddenSections,
    setHiddenSections,
    nextStep,
    prevStep,
    goToStep,
    updatePersonalInfo,
    setSummary,
    setCoreCompetencies,
    setAchievements,
    setWorkExperience,
    setWorkExperienceRich,
    setEducation,
    setEducationRich,
    setSkills,
    setSkillsRich,
    setProjects,
    setLanguages,
    setCertifications,
    setAssociations,
    setCustomSections,
  }

  return <ResumeBuilderContext.Provider value={value}>{children}</ResumeBuilderContext.Provider>
}

export function useResumeBuilder() {
  const context = useContext(ResumeBuilderContext)
  if (context === undefined) {
    throw new Error("useResumeBuilder must be used within a ResumeBuilderProvider")
  }
  return context
}

