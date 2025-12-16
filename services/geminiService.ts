
import { GoogleGenAI, Type } from "@google/genai";
import type { AIGeneratedContent } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateEventContent(
    eventTitle: string, 
    department: string, 
    resourcePersonName: string,
    tone: string = 'Professional'
): Promise<AIGeneratedContent | null> {
  // FIX: Removed API_KEY check to align with guidelines assuming it's always present.
  const prompt = `
    For a college event organized by the Institution's Innovation Council (IIC), please generate content for a report.
    Event Title: "${eventTitle}"
    Department: "${department}"
    Resource Person: "${resourcePersonName}"
    Writing Tone: "${tone}"

    Based on this, provide the following in a structured JSON format:
    1.  A brief information summary about the activity (around 200 words).
    2.  A list of key objectives for the activity (around 75 words).
    3.  The expected benefits for the student participants (around 100 words).
    
    Ensure the content is high-quality, well-structured, and suitable for an official institution report.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brief: {
              type: Type.STRING,
              description: "Brief information summary about the activity (around 200 words).",
            },
            objectives: {
              type: Type.STRING,
              description: "A list of key objectives for the activity (around 75 words).",
            },
            benefits: {
              type: Type.STRING,
              description: "The expected benefits for the student participants (around 100 words).",
            },
          },
          required: ["brief", "objectives", "benefits"],
        },
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as AIGeneratedContent;

  } catch (error) {
    console.error("Error generating content with Gemini API:", error);
    return null;
  }
}
