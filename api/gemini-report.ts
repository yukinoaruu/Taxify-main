import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION_REPORT } from "../constants";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const config = {
  runtime: "edge",
};

export default async function handler(request: Request): Promise<Response> {
  try {
    const { reportType, dataSummary } = (await request.json()) as {
      reportType: string;
      dataSummary: string;
    };

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Згенеруй текст для звіту: "${reportType}".
      Дані для звіту:
      ${dataSummary}
      
      Сформуй це як офіційний текстовий документ з заголовками та підсумками.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_REPORT,
      },
    });

    return new Response(
      JSON.stringify({
        text: response.text || "Помилка генерації звіту.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Gemini Report API Error:", error);
    return new Response(
      JSON.stringify({
        text: "Сервіс звітності тимчасово недоступний.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}

