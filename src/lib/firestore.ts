import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

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
      createdAt: Timestamp
      updatedAt: Timestamp
    }),
  }))
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
