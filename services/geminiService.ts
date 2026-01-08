import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { Message } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
const model = 'gemini-2.5-flash';

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
} else {
  console.warn("VITE_GEMINI_API_KEY environment variable not set. AI features will be disabled.");
}

export const getAIBotResponse = async (history: Message[]): Promise<string> => {
  if (!apiKey) {
    return "The AI bot is currently offline. Please configure the VITE_GEMINI_API_KEY.";
  }
  
  try {
    const contents = history.map(msg => ({
      role: msg.author.id === 'ai-bot' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    }));

    const response: GenerateContentResponse = await ai!.models.generateContent({
      model: model,
      contents: contents,
    });
    
    const responseText = response.text;

    // Fix: Add a strict type check to ensure the response is a string.
    // This prevents objects (e.g., from blocked responses) from being returned and causing a render error.
    if (typeof responseText === 'string') {
        return responseText;
    }

    // If responseText is not a string, the response was likely empty, blocked, or malformed.
    console.warn(
        "AI response.text was not a string or was empty. Full response:", 
        JSON.stringify(response, null, 2)
    );
    return "I'm sorry, I don't have a response for that right now.";
    
  } catch (error) {
    console.error("Error getting AI response:", error);
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
    if (errorMessage.includes('api key not valid')) {
        return "The AI Service API key is invalid. Please check the application configuration.";
    }
    if (errorMessage.includes('quota')) {
        return "The AI is experiencing high traffic (quota exceeded). Please try again later.";
    }
    return "Sorry, I encountered an error while trying to connect to the AI. Please try again.";
  }
};
