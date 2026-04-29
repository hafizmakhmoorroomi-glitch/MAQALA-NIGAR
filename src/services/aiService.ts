export async function transcribeUrduHandwriting(fileData: string, mimeType: string): Promise<string> {
  try {
    const response = await fetch("/api/transcribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fileData, mimeType }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to transcribe document.");
    }

    const data = await response.json();
    return data.text || "";
  } catch (error) {
    console.error("OCR Error:", error);
    throw error instanceof Error ? error : new Error("Failed to connect to transcription service.");
  }
}

