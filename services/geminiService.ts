import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini API
// Prefer public env for client bundle; fall back to server-side key if explicitly exposed.
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("Gemini API anahtarı bulunamadı. .env.local içinde NEXT_PUBLIC_GEMINI_API_KEY veya GEMINI_API_KEY tanımlayın.");
}

const ai = new GoogleGenAI({ apiKey });

export interface ReceiptData {
  amount: number;
  merchant: string;
  date: string;
  category: string;
  summary: string;
}

export const scanReceipt = async (base64Image: string): Promise<ReceiptData | null> => {
  try {
    // Clean base64 string if it has the prefix
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const model = "gemini-2.5-flash";

    const prompt = `
      Analyze this receipt image (which may be in Turkish or English) and extract the transaction details.
      
      CRITICAL INSTRUCTION FOR AMOUNT:
      1. Look for the "Total", "Genel Toplam", "Toplam" or "Grand Total" amount.
      2. If the total is NOT visible, cut off, or unclear, you MUST extract all visible individual line item prices and SUM them up manually.
      3. Use this calculated sum as the 'amount'.

      Extract the following:
      1. Total Amount (number only). If total is not found, sum the visible items.
      2. Merchant Name (store name).
      3. Date (in YYYY-MM-DD format, if not found use today's date).
      4. Category. Map the transaction to one of these exact Turkish categories:
         - "Market" (Grocery, Supermarket, Convenience Store)
         - "Yeme & İçme" (Restaurant, Cafe, Food, Starbucks)
         - "Ulaşım" (Transport, Fuel, Taxi, Bus)
         - "Fatura" (Bills, Utilities, Phone, Internet)
         - "Diğer" (Other, Shopping, Health, Entertainment)
      5. Summary: A short description of items purchased. IMPORTANT: Write the summary in Turkish, even if the receipt is in English.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg", // Assuming JPEG for camera captures, but API is flexible
              data: cleanBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: "The total amount paid. If total is missing, this is the sum of visible items." },
            merchant: { type: Type.STRING, description: "The name of the store or merchant" },
            date: { type: Type.STRING, description: "The date of the transaction in YYYY-MM-DD format" },
            category: { type: Type.STRING, description: "The category of the expense (Must be one of: Market, Yeme & İçme, Ulaşım, Fatura, Diğer)" },
            summary: { type: Type.STRING, description: "A short description of items purchased in Turkish" },
          },
          required: ["amount", "merchant", "date", "category"],
        },
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text) as ReceiptData;
      return data;
    }
    return null;
  } catch (error) {
    console.error("Error scanning receipt with Gemini:", error);
    throw error;
  }
};
