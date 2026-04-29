export async function transcribeUrduHandwriting(fileData: string, mimeType: string): Promise<string> {
  try {
    const response = await fetch("/api/transcribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fileData, mimeType }),
    });

    const contentType = response.headers.get("content-type");
    
    if (!response.ok) {
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      } else {
        const text = await response.text();
        console.error("Non-JSON error response:", text);
        throw new Error(`Server error (${response.status}). Check server logs.`);
      }
    }

    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return data.text || "";
    } else {
      throw new Error("Invalid response format from server.");
    }
  } catch (error) {
    console.error("OCR Error:", error);
    throw error instanceof Error ? error : new Error("Failed to connect to transcription service.");
  }
}

