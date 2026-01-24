"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from "react"

export type ResumeData = {
  personalInfo: {
    fullName: string
    email: string
    phone: string
    linkedin: string
    portfolio: string
    address: string
  }
  summary: string
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
  }>
  languages: Array<{ id: string; name: string; proficiency: string }>
  certifications: Array<{ id: string; name: string; issuer: string; year: string }>
  associations: Array<{ id: string; name: string; role: string }>
  customSections: Array<{ id: string; title: string; content: string }>
}

const initialResumeData: ResumeData = {
  personalInfo: { fullName: "", email: "", phone: "", linkedin: "", portfolio: "", address: "" },
  summary: "",
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
  isLoaded: boolean
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  updatePersonalInfo: (data: Partial<ResumeData["personalInfo"]>) => void
  setSummary: (summary: string) => void
  setWorkExperience: (data: ResumeData["workExperience"]) => void
  setEducation: (data: ResumeData["education"]) => void
  setSkills: (data: Partial<ResumeData["skills"]>) => void
  setProjects: (data: ResumeData["projects"]) => void
  setLanguages: (data: ResumeData["languages"]) => void
  setCertifications: (data: ResumeData["certifications"]) => void
  setAssociations: (data: ResumeData["associations"]) => void
  setCustomSections: (data: ResumeData["customSections"]) => void
}

const ResumeBuilderContext = createContext<ResumeBuilderContextType | undefined>(undefined)

export function ResumeBuilderProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from LocalStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedData = localStorage.getItem("hiredfast_resume_data");
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // Merge with initial data to ensure new fields (like customSections) are present
        setResumeData({ ...initialResumeData, ...parsed });
      }
    } catch (error) {
      console.error("Failed to load resume data:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    
    try {
      localStorage.setItem("hiredfast_resume_data", JSON.stringify(resumeData));
    } catch (error) {
      console.error("Failed to save resume data:", error);
    }
  }, [resumeData, isLoaded]);

  const updatePersonalInfo = (data: Partial<ResumeData["personalInfo"]>) => {
    setResumeData((prev) => ({ ...prev, personalInfo: { ...prev.personalInfo, ...data } }))
  }

  const setWorkExperience = (data: ResumeData["workExperience"]) => {
    setResumeData((prev) => ({ ...prev, workExperience: data }))
  }
  
  const setEducation = (data: ResumeData["education"]) => {
    setResumeData((prev) => ({ ...prev, education: data }))
  }

  const setSkills = (data: Partial<ResumeData["skills"]>) => {
    setResumeData((prev) => ({ ...prev, skills: { ...prev.skills, ...data } }))
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

  const setSummary = (summary: string) => {
    setResumeData((prev) => ({ ...prev, summary }))
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
    isLoaded,
    nextStep,
    prevStep,
    goToStep,
    updatePersonalInfo,
    setSummary,
    setWorkExperience,
    setEducation,
    setSkills,
    setProjects,
    setLanguages,
    setCertifications,
    setAssociations,
    setCustomSections,
  }

  const ContextProvider = ResumeBuilderContext.Provider;

  return (
    <ContextProvider value={value}>
      {children}
    </ContextProvider>
  )
}

export function useResumeBuilder() {
  const context = useContext(ResumeBuilderContext)
  if (context === undefined) {
    throw new Error("useResumeBuilder must be used within a ResumeBuilderProvider")
  }
  return context
}
