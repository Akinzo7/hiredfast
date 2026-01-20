import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(req: Request) {
  if (!genAI) {
    return NextResponse.json(
      { error: "Gemini API key is not configured. Please add GEMINI_API_KEY to your .env.local file." },
      { status: 500 }
    );
  }

  try {
    const { jobDescription, resumeData, source } = await req.json();

    if (!jobDescription || jobDescription.length < 50) {
      return NextResponse.json({ error: "Job description is too short." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const resumeContext = resumeData 
      ? JSON.stringify(resumeData) 
      : "User will upload a PDF (Placeholder for parsing logic)";

    const prompt = `
      You are a professional career coach and expert cover letter writer.
      
      Using the following resume data:
      ${resumeContext}
      
      And this job description:
      ${jobDescription}
      
      Write a highly tailored, professional cover letter. 
      Focus on matching the user's specific skills and projects to the job requirements.
      Keep it concise, impactful, and ready to send.
      Use a standard business letter format but omit the recipient's address block (placeholders like [Hiring Manager Name] are fine).
      The tone should be confident but humble.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ letter: text });
  } catch (error) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate cover letter. Please try again." }, { status: 500 });
  }
}
