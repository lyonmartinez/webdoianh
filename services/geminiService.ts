import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult } from "../types";

const parseBase64 = (dataUrl: string) => {
  return dataUrl.split(',')[1];
};

export const analyzeImage = async (imageDataUrl: string): Promise<AIAnalysisResult> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key not found");
    }

    const ai = new GoogleGenAI({ apiKey });

    // Using gemini-3-flash-preview for fast and efficient vision tasks
    const modelId = "gemini-3-flash-preview";

    const base64Data = parseBase64(imageDataUrl);

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: base64Data,
            },
          },
          {
            text: "Analyze this image. I need a SEO-friendly filename (kebab-case, ending in .png) and a concise, descriptive alt text for accessibility.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedFilename: {
              type: Type.STRING,
              description: "A short, descriptive, kebab-case filename ending in .png",
            },
            altText: {
              type: Type.STRING,
              description: "A concise description of the image for accessibility",
            },
          },
          required: ["suggestedFilename", "altText"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(text) as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback if AI fails or no key
    return {
      suggestedFilename: `resized-image-${Date.now()}.png`,
      altText: "Resized image",
    };
  }
};