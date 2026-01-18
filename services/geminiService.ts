
import { GoogleGenAI } from "@google/genai";

// Always use direct process.env.API_KEY without fallbacks for initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateQueueMessage = async (ticketNumber: string, counter: number) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a polite, professional, and very short (one sentence) announcement message for ticket ${ticketNumber} to proceed to counter ${counter}. Example: "Ticket A-102, please proceed to Counter 4 for assistance."`,
    });
    return response.text?.trim() || `Ticket ${ticketNumber}, please proceed to Counter ${counter}.`;
  } catch (error) {
    console.error("Gemini Error:", error);
    return `Ticket ${ticketNumber}, please proceed to Counter ${counter}.`;
  }
};
