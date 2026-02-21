import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

const apiKey = process.env.GEMINI_API_KEY
const genAI = apiKey && apiKey.trim() ? new GoogleGenerativeAI(apiKey) : null

export async function POST(req: Request) {
  if (!genAI) {
    return NextResponse.json(
      { error: "Gemini API key is not configured." },
      { status: 500 }
    )
  }

  try {
    const { resumeText } = await req.json()

    if (!resumeText || resumeText.trim().length < 100) {
      return NextResponse.json(
        { error: "Resume text is too short to analyze. Please provide more content." },
        { status: 400 }
      )
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const prompt = `
You are an expert resume analyst and career coach with years of experience 
reviewing resumes for Fortune 500 companies and top recruitment agencies.

Analyze the following resume text and provide a detailed, honest scoring 
assessment.

Resume Text:
${resumeText}

Score the resume across these 4 categories:

1. Content Quality (out of 35 points)
   Evaluate: strength of work experience descriptions, use of quantifiable 
   achievements and metrics, relevance of skills listed, depth of project 
   descriptions, and overall quality of written content.

2. Formatting & Readability (out of 30 points)
   Evaluate: logical section ordering, use of clear headings, consistent 
   formatting style, appropriate length, and how easy the resume is to 
   scan in 6 seconds.

3. ATS Compatibility (out of 30 points)
   Evaluate: presence of industry-relevant keywords, use of standard 
   section headings (Experience, Education, Skills), avoidance of tables 
   or complex layouts, and overall machine-readability for applicant 
   tracking systems.

4. Professional Presentation (out of 5 points)
   Evaluate: professional tone throughout, absence of grammar or spelling 
   errors, and the overall impression the resume makes.

For each category, provide exactly 3 to 4 specific feedback points.
Mix positive observations (start with ✓) with improvement suggestions 
(start with ⚠). Be specific — reference actual content from the resume 
where possible.

Important scoring guidelines:
- Be realistic. Only award near-perfect scores if the resume is genuinely 
  excellent in that category.
- A typical good resume should score between 65-85 overall.
- The totalScore must equal the exact sum of all category scores.
- Each category score must be between 0 and its maxScore.

Return ONLY a valid JSON object. No markdown, no code fences, no extra text.
Use this exact structure:

{
  "totalScore": <number>,
  "categories": [
    {
      "name": "Content Quality",
      "score": <number between 0 and 35>,
      "maxScore": 35,
      "feedback": [
        "✓ specific positive observation",
        "✓ another positive point",
        "⚠ specific improvement suggestion",
        "⚠ another improvement suggestion"
      ]
    },
    {
      "name": "Formatting & Readability",
      "score": <number between 0 and 30>,
      "maxScore": 30,
      "feedback": [
        "✓ positive point",
        "⚠ improvement suggestion",
        "⚠ another suggestion"
      ]
    },
    {
      "name": "ATS Compatibility",
      "score": <number between 0 and 30>,
      "maxScore": 30,
      "feedback": [
        "✓ positive point",
        "⚠ improvement suggestion",
        "⚠ another suggestion"
      ]
    },
    {
      "name": "Professional Presentation",
      "score": <number between 0 and 5>,
      "maxScore": 5,
      "feedback": [
        "✓ positive point",
        "⚠ improvement suggestion"
      ]
    }
  ]
}
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text()

    // Strip any markdown code fences if present
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()

    const analysisResult = JSON.parse(text)

    // Validate the parsed result has required fields
    if (
      typeof analysisResult.totalScore !== "number" ||
      !Array.isArray(analysisResult.categories) ||
      analysisResult.categories.length !== 4
    ) {
      throw new Error("Invalid response structure from AI")
    }

    return NextResponse.json(analysisResult)
  } catch (error) {
    console.error("Resume Analysis Error:", error)
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Failed to parse analysis response. Please try again." },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: "Failed to analyze resume. Please try again." },
      { status: 500 }
    )
  }
}
