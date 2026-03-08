import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { GEMINI_MODEL_FLASH, genAI } from "@/lib/gemini";
import { Schema, SchemaType } from "@google/generative-ai";

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
    const { conversationHistory, userAnswer, resumeData, jobDescription, questionNumber } = await req.json();

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_FLASH });

    const resumeContext = typeof resumeData === 'string' ? resumeData : JSON.stringify(resumeData);

    const totalQuestions = 5;
    const isComplete = questionNumber > totalQuestions;

    if (questionNumber === 1) {
      // First question - greeting
      const prompt = `
You are an experienced technical interviewer conducting a mock interview.

Resume Context:
${resumeContext}

Job Description:
${jobDescription}

Start the interview with a warm greeting and ask the first behavioral or technical question relevant to the job description and the candidate's resume. Keep it professional but friendly.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const message = response.text();

      return NextResponse.json({ message, isComplete: false });
    }

    if (isComplete) {
      // Generate performance analysis
      const analysisPrompt = `
You are an expert interview coach analyzing a candidate's interview performance.

Conversation History:
${JSON.stringify(conversationHistory)}

Final Answer from Candidate:
${userAnswer}

Provide:
1. An overall score out of 100
2. Three key strengths demonstrated
3. For one of the weaker answers, provide:
   - The original question
   - The candidate's answer
   - An improved version of how they could have answered

Return your response as a JSON object with this structure:
{
  "score": number,
  "strengths": ["strength1", "strength2", "strength3"],
  "betterAnswer": {
    "originalQuestion": "question text",
    "userAnswer": "their answer",
    "improvedAnswer": "better version"
  }
}

Return ONLY valid JSON, no markdown formatting or additional text.
      `;

      const schema: Schema = {
        type: SchemaType.OBJECT,
        properties: {
          score: { type: SchemaType.NUMBER },
          strengths: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
          },
          betterAnswer: {
            type: SchemaType.OBJECT,
            properties: {
              originalQuestion: { type: SchemaType.STRING },
              userAnswer: { type: SchemaType.STRING },
              improvedAnswer: { type: SchemaType.STRING }
            },
            required: ["originalQuestion", "userAnswer", "improvedAnswer"]
          }
        },
        required: ["score", "strengths", "betterAnswer"]
      };

      const analysisModel = genAI.getGenerativeModel({
        model: GEMINI_MODEL_FLASH,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
        }
      });

      const result = await analysisModel.generateContent(analysisPrompt);
      const response = await result.response;
      const analysisText = response.text();

      const performanceData = JSON.parse(analysisText);

      const closingMessage = `Thank you for completing the interview! Based on your responses, you scored ${performanceData.score}/100. Let's review your performance.`;

      return NextResponse.json({
        message: closingMessage,
        isComplete: true,
        performanceData
      });
    }

    // Generate next question
    const nextQuestionPrompt = `
You are an experienced technical interviewer conducting a mock interview.

Conversation History:
${JSON.stringify(conversationHistory)}

Latest Answer from Candidate:
${userAnswer}

Resume Context:
${resumeContext}

Job Description:
${jobDescription}

This is question ${questionNumber} of ${totalQuestions}. 

Briefly acknowledge their previous answer (in 1 sentence), then ask the next relevant question based on the job requirements and their background. Mix behavioral and technical questions appropriately.
    `;

    const result = await model.generateContent(nextQuestionPrompt);
    const response = await result.response;
    const message = response.text();

    return NextResponse.json({ message, isComplete: false });

  } catch (error) {
    console.error("Interview API Error:", error);
    return NextResponse.json(
      { error: "Failed to process interview request. Please try again." },
      { status: 500 }
    );
  }
}
