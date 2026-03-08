import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { GEMINI_MODEL_FLASH, genAI } from "@/lib/gemini";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("firebase-session")?.value;

  if (!sessionCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!genAI) {
    return NextResponse.json(
      { error: "Gemini API key is not configured. Please add GEMINI_API_KEY to your .env.local file." },
      { status: 500 }
    );
  }

  try {
    const { jobDescription, jobTitle, company, resumeData } = await req.json();

    if (!jobDescription || jobDescription.length < 20) {
      return NextResponse.json({ error: "Job description is too short." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_FLASH });

    const resumeContext = resumeData
      ? (typeof resumeData === "string" ? resumeData : JSON.stringify(resumeData))
      : null;

    const prompt = `
      You are a professional career coach and expert cover letter writer.
      
      ${resumeContext ? `Using the following resume data:\n${resumeContext}` : "The applicant has not provided a resume. Generate a template cover letter based on ideal qualifications for the role."}
      
      Job Title: ${jobTitle || "Not specified"}
      Company: ${company || "Not specified"}
      
      Job Description:
      ${jobDescription}
      
      Write a highly tailored, professional cover letter.
      Focus on matching the applicant's specific skills and experience to the job requirements.
      Keep it concise, impactful, and ready to send.
      Format the response as plain text without markdown formatting.
      Use a standard business letter format.
      Start with "Dear [Hiring Manager Name]," as the salutation.
      The tone should be confident but humble.
      Do NOT include any addresses or headers - just the salutation and body paragraphs and a sign-off.
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
