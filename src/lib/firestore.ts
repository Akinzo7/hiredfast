import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
  getCountFromServer,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { ResumeData } from "@/hooks/use-resume-builder"

// ---- RESUMES ----

export async function saveResume(
  userId: string,
  title: string,
  data: object
) {
  const ref = collection(db, "users", userId, "resumes")
  const doc = await addDoc(ref, {
    title,
    data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return doc.id
}

export async function getResumes(userId: string) {
  const ref = collection(db, "users", userId, "resumes")
  const q = query(ref, orderBy("updatedAt", "desc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as {
      title: string
      data?: ResumeData
      createdAt: Timestamp
      updatedAt: Timestamp
    }),
  }))
}

export async function getResumeCount(userId: string): Promise<number> {
  const ref = collection(db, "users", userId, "resumes")
  const snapshot = await getCountFromServer(ref)
  return snapshot.data().count
}

export async function getResume(userId: string, resumeId: string) {
  const resumeRef = doc(db, "users", userId, "resumes", resumeId)
  const snap = await getDoc(resumeRef)
  if (!snap.exists()) return null
  return {
    id: snap.id,
    ...(snap.data() as {
      title: string
      data?: ResumeData
      uploadedText?: string
      createdAt: Timestamp
      updatedAt: Timestamp
    }),
  }
}

export async function updateResume(
  userId: string,
  resumeId: string,
  title: string,
  data: object
) {
  const resumeRef = doc(db, "users", userId, "resumes", resumeId)
  await updateDoc(resumeRef, {
    title,
    data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteResume(userId: string, resumeId: string) {
  const resumeRef = doc(db, "users", userId, "resumes", resumeId)
  await deleteDoc(resumeRef)
}

// ---- INTERVIEWS ----

export async function saveInterview(
  userId: string,
  data: {
    jobTitle?: string
    company?: string
    score?: number
    results?: object
  }
) {
  const ref = collection(db, "users", userId, "interviews")
  const doc = await addDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
  })
  return doc.id
}

export async function getInterviews(userId: string) {
  const ref = collection(db, "users", userId, "interviews")
  const q = query(ref, orderBy("createdAt", "desc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as {
      jobTitle?: string
      company?: string
      score?: number
      createdAt: Timestamp
    }),
  }))
}

// ---- COVER LETTERS ----

export async function saveCoverLetter(
  userId: string,
  data: {
    jobTitle?: string
    company?: string
    content: string
  }
) {
  const ref = collection(db, "users", userId, "coverLetters")
  const doc = await addDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
  })
  return doc.id
}

export async function getCoverLetters(userId: string) {
  const ref = collection(db, "users", userId, "coverLetters")
  const q = query(ref, orderBy("createdAt", "desc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as {
      jobTitle?: string
      company?: string
      content: string
      createdAt: Timestamp
    }),
  }))
}

// ---- JOBS ----

export async function saveJob(
  userId: string,
  data: {
    title: string
    company?: string
    employmentType?: string
    description?: string
    status?: string
  }
) {
  const ref = collection(db, "users", userId, "jobs")
  const newDoc = await addDoc(ref, {
    ...data,
    status: data.status || "Added",
    createdAt: serverTimestamp(),
  })
  return newDoc.id
}

export async function getJobs(userId: string) {
  const ref = collection(db, "users", userId, "jobs")
  const q = query(ref, orderBy("createdAt", "desc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as {
      title: string
      company?: string
      employmentType?: string
      description?: string
      status?: string
      createdAt: Timestamp
    }),
  }))
}

// ---- USER PROFILE ----

export async function updateUserProfile(
  userId: string,
  data: {
    name?: string
    phone?: string
    city?: string
    linkedin?: string
    photoURL?: string
  }
): Promise<void> {
  const userRef = doc(db, "users", userId)
  await updateDoc(userRef, data)
}

export async function getUserProfile(
  userId: string
): Promise<{
  phone?: string
  city?: string
  linkedin?: string
  photoURL?: string
  photoBase64?: string
  name?: string
  email?: string
} | null> {
  const userRef = doc(db, "users", userId)
  const snap = await getDoc(userRef)
  if (!snap.exists()) return null
  return snap.data() as {
    phone?: string
    city?: string
    linkedin?: string
    photoURL?: string
    photoBase64?: string
    name?: string
    email?: string
  }
}
