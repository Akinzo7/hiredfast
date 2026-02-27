import { GoogleGenerativeAI } from "@google/generative-ai"

export const GEMINI_MODEL_PRO = "gemini-2.5-pro"
export const GEMINI_MODEL_FLASH = "gemini-2.5-flash"

const apiKey = process.env.GEMINI_API_KEY

export const genAI = apiKey && apiKey.trim() ? new GoogleGenerativeAI(apiKey) : null
