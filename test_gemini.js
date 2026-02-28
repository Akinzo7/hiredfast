const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

let apiKey = null;
try {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const apiKeyLine = envFile.split('\n').find(l => l.startsWith('GEMINI_API_KEY='));
  apiKey = apiKeyLine ? apiKeyLine.split('=')[1].trim() : null;
} catch (e) {
  console.log("Error reading env file:", e);
}

if (!apiKey) {
    console.log("No API Key found");
    process.exit(1);
}

const GEMINI_MODEL_PRO = "gemini-2.5-pro";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_PRO });

async function run() {
    try {
        console.log("Attempting generation...");
        const result = await model.generateContent("Hello, what is 2+2?");
        const response = await result.response;
        console.log("Success:", response.text());
    } catch (e) {
        console.error("Error occurred:", e);
    }
}

run();
