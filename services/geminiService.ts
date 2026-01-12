import { GoogleGenAI, Type } from "@google/genai";
import { SoilData } from "../types";

// Inicializar el cliente de Gemini
// Asumiendo que process.env.API_KEY está inyectado globalmente
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeSoilPDF = async (base64File: string, mimeType: string): Promise<SoilData> => {
  const modelId = "gemini-3-flash-preview";

  const systemInstruction = `
    Eres un agrónomo experto en interpretación de análisis de suelos. 
    Tu tarea es extraer datos numéricos precisos de un reporte de laboratorio en formato PDF (imagen o texto).
    
    INSTRUCCIONES PRINCIPALES:
    1. Extrae los valores para los campos principales: pH, Materia Orgánica, Nitrógeno, Fósforo, Potasio, Calcio, Magnesio, CIC y Textura.
    2. Si un valor no se encuentra explícitamente, usa 0.
    3. Normaliza las unidades si es necesario para mantener consistencia numérica.
    
    INSTRUCCIONES PARA 'otherData' (IMPORTANTE):
    4. Tu objetivo es capturar TODO el resto de información técnica disponible.
    5. Agrega al array 'otherData' cadenas de texto con el formato "Nombre: Valor Unidad".
    6. Busca específicamente:
       - Nutrientes Secundarios: Azufre (S).
       - Micronutrientes: Hierro (Fe), Zinc (Zn), Manganeso (Mn), Cobre (Cu), Boro (B).
       - Elementos tóxicos: Aluminio (Al), Sodio (Na).
       - Relaciones catiónicas: Ca/Mg, Mg/K, (Ca+Mg)/K.
       - Porcentajes de Saturación: Saturación de Al, Saturación de bases, etc.
       - Acidez intercambiable.
    
    Ejemplo de otherData: ["Azufre: 12 ppm", "Zinc: 2.4 ppm", "Relación Ca/Mg: 3.5", "Sat. Bases: 85%"]
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      ph: { type: Type.NUMBER, description: "Nivel de pH del suelo" },
      organicMatter: { type: Type.NUMBER, description: "Porcentaje de materia orgánica" },
      nitrogen: { type: Type.NUMBER, description: "Nivel de nitrógeno (ppm o kg/ha según reporte)" },
      phosphorus: { type: Type.NUMBER, description: "Nivel de fósforo (ppm)" },
      potassium: { type: Type.NUMBER, description: "Nivel de potasio (cmol/kg o ppm)" },
      calcium: { type: Type.NUMBER, description: "Nivel de calcio (cmol/kg)" },
      magnesium: { type: Type.NUMBER, description: "Nivel de magnesio (cmol/kg)" },
      cationExchangeCapacity: { type: Type.NUMBER, description: "Capacidad de Intercambio Catiónico (CIC)" },
      texture: { type: Type.STRING, description: "Clase textural del suelo (ej. Franco, Arcilloso)" },
      crop: { type: Type.STRING, description: "Cultivo recomendado o analizado, si aparece en el texto" },
      otherData: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "Lista de todos los datos adicionales: micronutrientes, relaciones, saturaciones y otros elementos químicos." 
      }
    },
    required: ["ph", "phosphorus", "potassium"],
  };

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64File,
            },
          },
          {
            text: "Analiza este reporte de suelo adjunto. Extrae los nutrientes principales y pon TODOS los micronutrientes, relaciones, saturaciones y datos extra en 'otherData'.",
          },
        ],
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as SoilData;
    } else {
      throw new Error("No se pudo extraer texto de la respuesta de Gemini.");
    }
  } catch (error) {
    console.error("Error analizando el PDF con Gemini:", error);
    throw error;
  }
};