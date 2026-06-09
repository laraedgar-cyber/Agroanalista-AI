import { GoogleGenAI, Type } from "@google/genai";
import type { IncomingMessage, ServerResponse } from "http";
import type { SoilData } from "../types";

type JsonRequest = IncomingMessage & {
  body?: unknown;
  method?: string;
};

type AnalyzeRequestBody = {
  base64File?: string;
  mimeType?: string;
};

const MAX_BASE64_LENGTH = 12 * 1024 * 1024;

const sendJson = (res: ServerResponse, statusCode: number, payload: unknown) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
};

const readJsonBody = async (req: JsonRequest): Promise<AnalyzeRequestBody> => {
  if (req.body && typeof req.body === "object") {
    return req.body as AnalyzeRequestBody;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  if (!rawBody) return {};

  return JSON.parse(rawBody) as AnalyzeRequestBody;
};

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
      description: "Lista de todos los datos adicionales: micronutrientes, relaciones, saturaciones y otros elementos químicos.",
    },
  },
  required: ["ph", "phosphorus", "potassium"],
};

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

const analyzeSoilDocument = async (base64File: string, mimeType: string): Promise<SoilData> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType,
            data: base64File,
          },
        },
        {
          text: "Analiza este reporte de suelo adjunto. Extrae los nutrientes principales y pon TODOS los micronutrientes, relaciones, saturaciones y datos extra en 'otherData'.",
        },
      ],
    },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  if (!response.text) {
    throw new Error("No se pudo extraer texto de la respuesta de Gemini.");
  }

  return JSON.parse(response.text) as SoilData;
};

export default async function handler(req: JsonRequest, res: ServerResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const { base64File, mimeType } = await readJsonBody(req);

    if (!base64File || !mimeType) {
      sendJson(res, 400, { error: "base64File and mimeType are required." });
      return;
    }

    if (!mimeType.startsWith("image/") && mimeType !== "application/pdf") {
      sendJson(res, 400, { error: "Only PDF and image files are supported." });
      return;
    }

    if (base64File.length > MAX_BASE64_LENGTH) {
      sendJson(res, 413, { error: "The uploaded file is too large." });
      return;
    }

    const data = await analyzeSoilDocument(base64File, mimeType);
    sendJson(res, 200, { data });
  } catch (error) {
    console.error("Error analyzing soil document:", error);
    const message = error instanceof Error && error.message.includes("GEMINI_API_KEY")
      ? "El servidor no tiene configurada la clave de Gemini."
      : "No se pudo procesar el documento con IA.";
    sendJson(res, 500, { error: message });
  }
}
