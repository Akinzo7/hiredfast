import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "AIzaSyDm4ry6jNaYT5-NFdZ9PzhBgZpFfxp1yUk";
const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const result = await model.generateContent("Hello, world!");
    console.log("PRO Success:", result.response.text());
  } catch (e) {
    console.error("PRO Error:", e.message || e);
  }

  try {
    const model2 = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result2 = await model2.generateContent("Hello, world!");
    console.log("FLASH Success:", result2.response.text());
  } catch (e) {
    console.error("FLASH Error:", e.message || e);
  }
}

run();
