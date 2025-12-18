import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION_ADVISOR, FOP_LIMITS, MILITARY_LEVY_RATE_G3, MILITARY_LEVY_FIXED } from "../constants";
import { FopGroup, UserProfile } from "../types";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const config = {
  runtime: "edge",
};

export default async function handler(request: Request): Promise<Response> {
  try {
    const { profile, totalIncome } = (await request.json()) as {
      profile: UserProfile;
      totalIncome: number;
    };

    const limit = FOP_LIMITS[profile.group];
    const percentUsed = (totalIncome / limit) * 100;

    let taxContext = "";
    if (profile.group === FopGroup.GROUP_3) {
      const ep = totalIncome * profile.taxRate;
      const vs = totalIncome * MILITARY_LEVY_RATE_G3;
      taxContext = `Єдиний податок: ${ep.toFixed(0)} грн. Військовий збір (1%): ${vs.toFixed(0)} грн.`;
    } else {
      const vs = MILITARY_LEVY_FIXED;
      taxContext = `Фіксований Військовий збір: ${vs} грн/міс.`;
    }

    const prompt = `
      Профіль користувача (2026 рік):
      - Група ФОП: ${profile.group}
      - Ставка податку: ${profile.taxRate * 100}%
      - Наявність співробітників: ${profile.hasEmployees ? "Так" : "Ні"}
      
      Поточний стан:
      - Загальний дохід (з початку року): ${totalIncome} UAH
      - Розрахункові податки: ${taxContext}
      - Ліміт групи: ${limit} UAH
      - Використано ліміту: ${percentUsed.toFixed(2)}%

      Надай короткий (2 речення) статус українською мовою. 
      Якщо ліміт близький (>80%), попередь ввічливо.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_ADVISOR,
        maxOutputTokens: 150,
      },
    });

    return new Response(
      JSON.stringify({
        text: response.text || "Статус нормальний.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Gemini Advice API Error:", error);
    return new Response(
      JSON.stringify({
        text: "Система працює. Слідкуйте за лімітами.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}


