import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION_OCR } from "../constants";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const config = {
  runtime: "edge",
};

export default async function handler(request: Request): Promise<Response> {
  try {
    const { base64Image } = await request.json();

    const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data,
            },
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_OCR,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            currency: { type: Type.STRING, enum: ["UAH", "USD", "EUR"] },
            date: { type: Type.STRING },
            description: { type: Type.STRING },
          },
          required: ["amount", "currency", "date"],
        },
      },
    });

    if (!response.text) {
      return new Response(JSON.stringify({ error: "No text returned from AI" }), { status: 500 });
    }

    return new Response(response.text, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Gemini OCR API Error:", error);
    return new Response(JSON.stringify({ error: "Failed to process document." }), { status: 500 });
  }
}

