import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware first!
  app.use(express.json({ limit: '50mb' }));
  
  // Request logger to terminal
  app.use((req, res, next) => {
    console.log(`\n>>> [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    if (req.method === 'POST') console.log('Payload size:', JSON.stringify(req.body).length);
    next();
  });

  // Health check/Testing route
  app.get("/api/test", (req, res) => {
    console.log("Health check hit");
    res.json({ status: "Server is online!", time: new Date().toISOString() });
  });

  // AI Transcription API Route
  app.post("/api/transcribe", async (req, res) => {
    const { fileData, mimeType } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    console.log("Transcribe requested. API Key present:", !!apiKey);

    if (!apiKey) {
      console.error("CRITICAL: GEMINI_API_KEY is not defined in the environment.");
      return res.status(500).json({ error: "GEMINI_API_KEY is missing on the server. Please check your config." });
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
