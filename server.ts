import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Request logger
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // AI Transcription API Route
  app.post("/api/transcribe", async (req, res) => {
    const { fileData, mimeType } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY");
      return res.status(500).json({ error: "GEMINI_API_KEY is not set on the server." });
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
          text: "Transcribe the handwritten Urdu text from this document accurately. Maintain the structure and paragraphs. Use high-quality Nastaliq style transcription. If there is Arabic text, ensure it is preserved correctly. Return JUST the transcription."
        }
      ]);

      const text = result.response.text();
      res.json({ text });
    } catch (error) {
      console.error("Transcription error detail:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to transcribe document." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
