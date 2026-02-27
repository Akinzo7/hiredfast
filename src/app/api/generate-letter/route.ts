import { NextResponse } from "next/server";
import { GEMINI_MODEL_FLASH, genAI } from "@/lib/gemini";

export async function POST(req: Request) {
  if (!genAI) {
    return NextResponse.json(
      { error: "Gemini API key is not configured. Please add GEMINI_API_KEY to your .env.local file." },
      { status: 500 }
    );
  }

  try {
    const { resumeText, jobDescription } = await req.json();

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: "Resume text is too short. Please provide more details about your experience." },
        { status: 400 }
      );
    }

    if (!jobDescription || jobDescription.trim().length < 50) {
      return NextResponse.json(
        { error: "Job description is too short. Please provide more details about the position." },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_FLASH });

    const prompt = `
You are a professional career coach and expert cover letter writer with years of experience helping candidates land their dream jobs.

Using the following resume information:
${resumeText}

And this job description:
${jobDescription}

Write a highly tailored, professional cover letter that:
1. Opens with a compelling hook that grabs attention
2. Clearly connects the candidate's specific skills and experiences to the job requirements
3. Highlights 2-3 key achievements that are most relevant to the position
4. Demonstrates genuine enthusiasm for the role and company
5. Closes with a confident call-to-action

Guidelines:
- Keep the letter concise (3-4 paragraphs, approximately 300-400 words)
- Use a professional but personable tone
- Avoid generic phrases like "I am writing to apply for..."
- Use specific examples and quantifiable achievements where possible
- Format as a standard business letter (omit recipient's address, use [Hiring Manager Name] as placeholder if needed)
- Make it ready to send with minimal editing

Return ONLY the cover letter text, no additional commentary.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const letter = response.text();

    return NextResponse.json({ letter });
  } catch (error) {
    console.error("AI Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate cover letter. Please try again." },
      { status: 500 }
    );
  }
}
