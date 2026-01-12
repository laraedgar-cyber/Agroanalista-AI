import { Fertilizer, RemovalRatesMap, GlobalAgronomyParams } from "../types";

// ESTE ARCHIVO CONTIENE LAS CONSTANTES AGRONÓMICAS
// Estos valores son promedios generales y deben ser validados por un especialista local.

// Factores de conversión
export const CONVERSIONS = {
  MANZANA_TO_HECTARE: 0.7, // 1 Manzana = 0.7 Hectáreas
  QUINTAL_TO_KG: 45.36,    // 1 Quintal (100 lbs) = 45.36 kg
  LB_TO_KG: 0.4536,
  KG_TO_LB: 2.20462,
  TON_TO_KG: 1000,
  
  // Conversión de suelo (Aproximación para profundidad de 20cm y densidad aparente 1.0)
  // ppm * 2 = kg/ha aproximadamente
  PPM_TO_KG_HA: 2, 
  
  // Conversión de Potasio: 1 cmol/kg K ≈ 390 ppm K (masa atómica 39 * 10)
  CMOL_K_TO_PPM: 391,
};

// TABLA DE EXTRACCIÓN DE NUTRIENTES (Valores Iniciales)
export const INITIAL_CROP_NUTRIENT_REMOVAL: RemovalRatesMap = {
  cafe: { n: 12, p: 2.5, k: 16 },  // Café Uva/Cereza (Ajustado para 300qq/mz ≈ 28 sacos)
  maiz: { n: 25, p: 10, k: 20 },   // Grano
  frijol: { n: 40, p: 10, k: 30 }, // Grano
  tomate: { n: 2.8, p: 0.8, k: 3.5 }, 
  cana: { n: 1.5, p: 0.5, k: 2.5 },   
  papa: { n: 3.5, p: 1.5, k: 5.5 },   
  default: { n: 20, p: 10, k: 20 }
};

// Parámetros Globales por Defecto
export const DEFAULT_GLOBAL_PARAMS: GlobalAgronomyParams = {
  nitrogenEfficiencyBoost: 1.21 // 21% de mejora por defecto
};

// PORTAFOLIO DE FERTILIZANTES
export const AVAILABLE_FERTILIZERS: Fertilizer[] = [
  // Commodities
  { id: 'urea', name: 'Urea (46-0-0)', type: 'commodity', n: 46, p: 0, k: 0, bagWeight: 100, price: 35 },
  { id: '15-15-15', name: 'Triple 15 (15-15-15)', type: 'commodity', n: 15, p: 15, k: 15, bagWeight: 100, price: 45 },
  { id: '18-46-0', name: 'DAP (18-46-0)', type: 'commodity', n: 18, p: 46, k: 0, bagWeight: 100, price: 50 },
  { id: '0-0-60', name: 'Cloruro de Potasio (0-0-60)', type: 'commodity', n: 0, p: 0, k: 60, bagWeight: 100, price: 40 },
  { id: '20-20-0', name: 'Inicio (20-20-0)', type: 'commodity', n: 20, p: 20, k: 0, bagWeight: 100, price: 42 },
  
  // Especialidades (Tecnología)
  // NitroXTEND: Precio $40 vs Urea $35. 
  // Costo por unidad N Urea: 35/46 = 0.76
  // Costo por unidad N NitroXTEND (con boost): 40/(46*1.21) = 40/55.66 = 0.71 -> ¡GANA NITROXTEND!
  { id: 'nitroxtend', name: 'NitroXTEND (46-0-0)', type: 'specialized', n: 46, p: 0, k: 0, bagWeight: 100, price: 40 },
  { id: '17-6-18', name: 'Producción (17-6-18)', type: 'specialized', n: 17, p: 6, k: 18, s: 4, bagWeight: 100, price: 48 },
];

// EFICIENCIA DEL SUELO Y FERTILIZANTE
export const EFFICIENCY = {
  soil: {
    n: 0.5, 
    p: 0.3, 
    k: 0.6  
  },
  fertilizer: {
    n: 0.6,
    p: 0.3, 
    k: 0.7
  }
};