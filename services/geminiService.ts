import { SoilData } from "../types";

type AnalyzeResponse = {
  data?: SoilData;
  error?: string;
};

export const analyzeSoilPDF = async (base64File: string, mimeType: string): Promise<SoilData> => {
  const response = await fetch("/api/analyze-soil", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ base64File, mimeType }),
  });

  const payload = (await response.json().catch(() => ({}))) as AnalyzeResponse;

  if (!response.ok || !payload.data) {
    throw new Error(payload.error || "No se pudo analizar el documento.");
  }

  return payload.data;
};
