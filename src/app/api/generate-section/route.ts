import { NextResponse } from "next/server"
import { GEMINI_MODEL_FLASH, genAI } from "@/lib/gemini"

const stripCodeFences = (value: string) =>
  value
    .replace(/```html\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim()

export async function POST(req: Request) {
  if (!genAI) {
    return NextResponse.json({ error: "Gemini API key is not configured." }, { status: 500 })
  }

  try {
    const body = (await req.json()) as {
      sectionTitle?: string
      currentContent?: string
      resumeContext?: string
    }

    const sectionTitle = typeof body.sectionTitle === "string" ? body.sectionTitle : ""
    const currentContent = typeof body.currentContent === "string" ? body.currentContent : ""
    const resumeContext = typeof body.resumeContext === "string" ? body.resumeContext : ""

    if (!sectionTitle.trim()) {
      return NextResponse.json({ error: "sectionTitle is required." }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_FLASH })

    const prompt = `You are a professional resume writer. Improve the following resume section titled '${sectionTitle}' for someone whose resume context is: ${resumeContext}. Current content: ${currentContent}. Return ONLY clean HTML. Use <p> tags for paragraphs, <ul><li> for bullet lists, <strong> for emphasis. Do not include any markdown, code fences, explanations, or wrapper elements like <html> or <body>. Return only the inner HTML content for this section.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const cleanedHtml = stripCodeFences(response.text())

    return NextResponse.json({ content: cleanedHtml })
  } catch (error) {
    console.error("Generate section error:", error)
    return NextResponse.json({ error: "Failed to generate section." }, { status: 500 })
  }
}



