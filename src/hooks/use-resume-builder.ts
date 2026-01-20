"use client"

import { useState, useEffect } from "react"

export type ResumeData = {
  personalInfo: {
    fullName: string
    email: string
    phone: string
    linkedin: string
    portfolio: string
    address: string
  }
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
}

const initialResumeData: ResumeData = {
  personalInfo: { fullName: "", email: "", phone: "", linkedin: "", portfolio: "", address: "" },
  workExperience: [],
  education: [],
  skills: { technical: "", soft: "" },
  projects: [],
  languages: [],
  certifications: [],
  associations: [],
}

export function useResumeBuilder() {
  const [currentStep, setCurrentStep] = useState(1)
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from LocalStorage
  useEffect(() => {
    const savedData = localStorage.getItem("hiredfast_resume_data")
    if (savedData) {
      try {
        setResumeData(JSON.parse(savedData))
      } catch (e) {
        console.error("Failed to parse resume data", e)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save to LocalStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("hiredfast_resume_data", JSON.stringify(resumeData))
    }
  }, [resumeData, isLoaded])

  const updatePersonalInfo = (data: Partial<ResumeData["personalInfo"]>) => {
    setResumeData((prev) => ({ ...prev, personalInfo: { ...prev.personalInfo, ...data } }))
  }

  // Generic updater for array fields would be nice, but explicit ones are safer for now
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

  const totalSteps = 7

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, totalSteps))
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1))
  const goToStep = (step: number) => setCurrentStep(Math.max(1, Math.min(step, totalSteps)))

  return {
    currentStep,
    totalSteps,
    resumeData,
    isLoaded,
    nextStep,
    prevStep,
    goToStep,
    updatePersonalInfo,
    setWorkExperience,
    setEducation,
    setSkills,
    setProjects,
    setLanguages,
    setCertifications,
    setAssociations,
  }
}
