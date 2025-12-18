import { UserProfile } from "../types";

export interface ExtractedIncomeData {
  amount: number;
  currency: 'UAH' | 'USD' | 'EUR';
  date: string;
  description: string;
}

export const extractIncomeFromImage = async (base64Image: string): Promise<ExtractedIncomeData> => {
  try {
    const res = await fetch("/api/gemini-ocr", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ base64Image }),
    });

    if (!res.ok) {
      throw new Error("OCR request failed");
    }

    const data = (await res.json()) as ExtractedIncomeData;
    return data;
  } catch (error) {
    console.error("Gemini OCR Error:", error);
    throw new Error("Не вдалося обробити документ.");
  }
};

export const generateTaxAdvice = async (profile: UserProfile, totalIncome: number): Promise<string> => {
  try {
    const res = await fetch("/api/gemini-advice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ profile, totalIncome }),
    });

    if (!res.ok) {
      throw new Error("Advice request failed");
    }

    const json = (await res.json()) as { text: string };
    return json.text || "Статус нормальний.";
  } catch (e) {
    console.error("Gemini Advice Error", e);
    return "Система працює. Слідкуйте за лімітами.";
  }
};

export const generateReportContent = async (reportType: string, dataSummary: string): Promise<string> => {
  try {
    const res = await fetch("/api/gemini-report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reportType, dataSummary }),
    });

    if (!res.ok) {
      throw new Error("Report request failed");
    }

    const json = (await res.json()) as { text: string };
    return json.text || "Помилка генерації звіту.";
  } catch (e) {
    console.error("Gemini Report Error", e);
    return "Сервіс звітності тимчасово недоступний.";
  }
};