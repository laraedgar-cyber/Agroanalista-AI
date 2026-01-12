// Definición de los datos extraídos del análisis de suelo
export interface SoilData {
  ph: number;
  organicMatter: number; // Porcentaje
  nitrogen: number; // ppm o %
  phosphorus: number; // ppm
  potassium: number; // cmol/kg o ppm
  calcium: number; // cmol/kg
  magnesium: number; // cmol/kg
  cationExchangeCapacity: number; // CEC
  texture: string; // "Arcilloso", "Franco", etc.
  crop?: string; // Cultivo mencionado si existe
  otherData?: string[]; // Datos adicionales o no clasificados
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

// Tipos para la configuración del cálculo
export type AreaUnit = 'hectares' | 'manzanas';
export type YieldUnit = 'kg' | 'lbs' | 'quintales' | 'toneladas';

export interface CropConfig {
  cropType: string;
  areaSize: number;
  areaUnit: AreaUnit;
  targetYield: number;
  yieldUnit: YieldUnit;
}

export interface NutrientResult {
  nutrient: string; // 'Nitrógeno', 'Fósforo', 'Potasio'
  symbol: string; // 'N', 'P2O5', 'K2O'
  soilSupply: number; // kg/ha disponibles
  cropDemand: number; // kg/ha requeridos
  deficitPerHa: number; // kg/ha a aplicar
  totalDeficit: number; // kg totales para el área seleccionada
}

export type FertilizerType = 'commodity' | 'specialized';

export interface Fertilizer {
  id: string;
  name: string;
  type: FertilizerType;
  price: number; // Precio por saco
  bagWeight: number; // lbs default 100
  imageUrl?: string; // Base64 image string
  
  // Macros
  n: number; // %
  p: number; // %
  k: number; // %
  
  // Secundarios
  s?: number; // % Azufre
  ca?: number; // % Calcio
  mg?: number; // % Magnesio
  
  // Micros
  zn?: number; // % Zinc
  b?: number; // % Boro
  fe?: number; // % Hierro
  mn?: number; // % Manganeso
  cu?: number; // % Cobre
}

export interface BagRecommendation {
  fertilizer: Fertilizer;
  bags: number; // Cantidad de sacos
  suppliedN: number; // kg
  suppliedP: number; // kg
  suppliedK: number; // kg
  cost: number; // Costo total de estos sacos
}

export interface FertilizerPlan {
  name: string;
  type: 'traditional' | 'technological';
  items: BagRecommendation[];
  totalCost: number;
  totalBags: number;
  // Totales suministrados para gráfica
  totalNutrients: {
    n: number;
    p: number;
    k: number;
  };
}

export interface CalculationResult {
  config: CropConfig;
  nutrients: NutrientResult[];
  recommendations: string[]; // Notas generales
  soilCorrections: { title: string; description: string; type: 'warning' | 'info' | 'success' }[];
  
  // Nuevos planes comparativos
  plans: {
    traditional: FertilizerPlan;
    technological: FertilizerPlan;
  };
}

// Estructura para los datos editables
export interface CropRemovalRate {
  n: number;
  p: number;
  k: number;
}
export type RemovalRatesMap = Record<string, CropRemovalRate>;

// Configuración Global Agronómica
export interface GlobalAgronomyParams {
  nitrogenEfficiencyBoost: number; // Factor (ej. 1.21 para 21%)
}