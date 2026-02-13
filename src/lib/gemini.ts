import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();
const genAI = new GoogleGenerativeAI(API_KEY);

export const askGemini = async (prompt: string): Promise<string> => {
  if (!API_KEY) {
    throw new Error("Cosmic Key Missing: Please check your .env file.");
  }

  // Creating the model instance with production-grade JSON configuration
  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    generationConfig: {
      temperature: 0.8,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 500,
      responseMimeType: "application/json",
    }
  });

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) throw new Error("The stars remained silent. (Empty response)");
    return text;
  } catch (error: any) {
    console.error("Celestial Communication Error:", error);
    // Throwing error ensures the App's offline fallback can trigger
    throw error;
  }
};
