import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import type { Message } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
const model = 'gemini-1.5-flash'; // Standard model name

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
} else {
  console.warn('VITE_GEMINI_API_KEY not set. AI features disabled.');
}

/**
 * Generate a conversational response based on history
 */
export const getAIBotResponse = async (history: Message[]): Promise<string> => {
  if (!ai) return 'AI is offline. Configure VITE_GEMINI_API_KEY.';

  try {
    const contents = history.map((msg) => ({
      role: msg.author.id === 'ai-bot' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    }));

    const response = await ai.models.generateContent({
      model,
      contents,
    });

    return typeof response.text === 'string' 
      ? response.text 
      : "I'm sorry, I don't have a response for that.";
  } catch (error) {
    console.error('AI Error:', error);
    return 'Encountered an AI error. Please try again.';
  }
};

/**
 * Summarize a long conversation
 */
export const summarizeConversation = async (messages: Message[]): Promise<string> => {
   if (!ai || messages.length === 0) return '';
   
   try {
     const textToSummarize = messages.map(m => `${m.author.name}: ${m.text}`).join('\n');
     const prompt = `Summarize the following chat conversation in 2-3 concise sentences:\n\n${textToSummarize}`;
     
     const response = await ai.models.generateContent({
       model,
       contents: [{ role: 'user', parts: [{ text: prompt }] }],
     });
     
     return typeof response.text === 'string' ? response.text : 'Summary unavailable.';
   } catch (err) {
     console.error('Summarization failed', err);
     return '';
   }
};
