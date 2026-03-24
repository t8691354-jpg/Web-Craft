import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface GeneratedSite {
  title: string;
  description: string;
  html: string;
  css: string; // Tailwind classes are in HTML, but maybe some custom CSS
  theme: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
}

export async function generateWebsite(prompt: string): Promise<GeneratedSite> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        text: `You are a world-class web designer and developer. Generate a complete, professional, and modern single-page website based on this prompt: "${prompt}".
        
        The website must:
        1. Use Tailwind CSS for all styling (assume it's already loaded).
        2. Be fully responsive and mobile-friendly.
        3. Include sections like Hero, Features, About, Testimonials, and Contact.
        4. Use high-quality placeholder images from Unsplash or Picsum.
        5. Have a cohesive color palette and typography.
        6. Include interactive elements (simulated with standard HTML/JS if needed).
        
        Return the result as a JSON object with the following structure:
        {
          "title": "Site Title",
          "description": "Short meta description",
          "html": "The full HTML body content (excluding <html>, <head>, <body> tags, just the content inside <body>)",
          "theme": {
            "primaryColor": "hex code",
            "secondaryColor": "hex code",
            "fontFamily": "font name"
          }
        }`,
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          html: { type: Type.STRING },
          theme: {
            type: Type.OBJECT,
            properties: {
              primaryColor: { type: Type.STRING },
              secondaryColor: { type: Type.STRING },
              fontFamily: { type: Type.STRING },
            },
            required: ["primaryColor", "secondaryColor", "fontFamily"],
          },
        },
        required: ["title", "description", "html", "theme"],
      },
    },
  });

  const result = JSON.parse(response.text || "{}");
  return result as GeneratedSite;
}
