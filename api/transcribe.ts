import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { fileData, mimeType } = req.body;
  const rawApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  let apiKey = rawApiKey?.trim();
  
  if (apiKey?.startsWith('"') && apiKey?.endsWith('"')) apiKey = apiKey.slice(1, -1).trim();
  if (apiKey?.startsWith("'") && apiKey?.endsWith("'")) apiKey = apiKey.slice(1, -1).trim();

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "") {
    console.error("Missing GEMINI_API_KEY in Vercel function.");
    return res.status(500).json({ 
      error: "GEMINI_API_KEY missing. Please add it to Environment Variables in Vercel settings." 
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      {
        inlineData: {
          data: fileData,
          mimeType: mimeType
        }
      },
      {
        text: "Transcribe the handwritten Urdu text from this document accurately. Maintain the structure and paragraphs. Use high-quality Nastaliq style transcription. Return JUST the transcription."
      }
    ]);

    const text = result.response.text();
    res.status(200).json({ text });
  } catch (error) {
    console.error("Transcription error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to transcribe document." });
  }
}
