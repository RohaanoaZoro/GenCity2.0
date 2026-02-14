
import { GoogleGenAI, Type } from "@google/genai";
import { BuildingData } from "../types";

export const generateCityLayout = async (prompt: string): Promise<BuildingData[]> => {
  // Always initialize GoogleGenAI inside the function call to ensure fresh configuration
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a JSON layout for a group of 3D buildings based on this theme: "${prompt}".
      
      Create between 5 to 12 buildings.
      The coordinates (position) should be roughly within x: -10 to 10, z: -10 to 10. 
      y position should be height/2 (so they sit on the ground).
      Sizes should vary but be realistic for a stylized city. 
      Colors should match the theme.
      Give each building a creative name and a short 1-sentence description related to the theme.
      Also generate realistic percentage stats (0-100) for occupancy, energy, and stability.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              position: { 
                type: Type.ARRAY,
                items: { type: Type.NUMBER }
              },
              size: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER }
              },
              color: { type: Type.STRING },
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              stats: {
                type: Type.OBJECT,
                properties: {
                  occupancy: { type: Type.NUMBER },
                  energy: { type: Type.NUMBER },
                  stability: { type: Type.NUMBER }
                },
                required: ["occupancy", "energy", "stability"]
              }
            },
            required: ["id", "position", "size", "color", "name", "stats"]
          }
        }
      }
    });

    // Access the .text property directly as per the latest SDK guidelines
    if (response.text) {
      const data = JSON.parse(response.text) as BuildingData[];
      // Ensure strict type safety for the tuple types which JSON.parse might loosen
      return data.map(b => ({
        ...b,
        position: [b.position[0], b.size[1] / 2, b.position[2]] as [number, number, number], // Ensure Y is correct based on height
        size: [b.size[0], b.size[1], b.size[2]] as [number, number, number]
      }));
    }
    return [];
  } catch (error) {
    console.error("Failed to generate city:", error);
    throw error;
  }
};
