import { initializeApp, getApps, cert, App } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"

let adminApp: App

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0]
  }
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Replace escaped newlines in the private key
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  })
}

adminApp = getAdminApp()

export const adminAuth = getAuth(adminApp)
export const adminDb = getFirestore(adminApp)
