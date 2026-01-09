import { GoogleGenAI } from "@google/genai";

// Initialize the AI client using the mandatory named parameter and environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getDailySavingTip = async (recentExpenses: any[]) => {
  try {
    // Basic Text Task: Use gemini-3-flash-preview as recommended.
    const prompt = `Based on these recent expenses: ${JSON.stringify(recentExpenses.slice(0, 5))}, give one short, practical, and highly actionable "Money Saving Tip" for today. Keep it under 20 words.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    // Use .text property directly as per latest SDK guidelines.
    return response.text || "Track every penny today to see where your money flows!";
  } catch (error) {
    console.error("Error fetching tip:", error);
    return "The best way to save is to spend less than you earn!";
  }
};