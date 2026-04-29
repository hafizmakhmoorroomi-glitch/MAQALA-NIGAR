import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export async function transcribeUrduHandwriting(fileData: string, mimeType: string): Promise<string> {
  if (!ai) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              text: "Transcribe the handwritten Urdu text from this document accurately. Maintain the structure and paragraphs. Only return the Urdu text without any comments or introductory phrases. Use high-quality Nastaliq style transcription."
            },
            {
              inlineData: {
                data: fileData,
                mimeType: mimeType
              }
            }
          ]
        }
      ],
      config: {
        temperature: 0.2,
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("OCR Error:", error);
    throw new Error("Failed to transcribe document. Please check your image/PDF quality.");
  }
}
