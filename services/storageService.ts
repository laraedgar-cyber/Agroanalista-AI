import { Fertilizer, RemovalRatesMap, GlobalAgronomyParams } from "../types";
import { AVAILABLE_FERTILIZERS, INITIAL_CROP_NUTRIENT_REMOVAL, DEFAULT_GLOBAL_PARAMS } from "./agronomyData";

// CAMBIAMOS A 'v2' PARA FORZAR LA RECARGA DE LA LISTA DE FERTILIZANTES
const KEYS = {
  FERTILIZERS: 'agro_fertilizers_v2',
  REMOVAL_RATES: 'agro_removal_rates_v2',
  GLOBAL_PARAMS: 'agro_global_params_v2'
};

export const storageService = {
  // --- FERTILIZERS ---
  saveFertilizers: (fertilizers: Fertilizer[]) => {
    try {
      const json = JSON.stringify(fertilizers);
      localStorage.setItem(KEYS.FERTILIZERS, json);
    } catch (error) {
      console.error("Error saving fertilizers to local storage", error);
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        alert("El almacenamiento local está lleno. Intenta usar imágenes más pequeñas.");
      }
    }
  },

  loadFertilizers: (): Fertilizer[] => {
    try {
      const stored = localStorage.getItem(KEYS.FERTILIZERS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Error loading fertilizers", error);
    }
    return AVAILABLE_FERTILIZERS;
  },

  // --- REMOVAL RATES ---
  saveRemovalRates: (rates: RemovalRatesMap) => {
    try {
      localStorage.setItem(KEYS.REMOVAL_RATES, JSON.stringify(rates));
    } catch (error) {
      console.error("Error saving removal rates", error);
    }
  },

  loadRemovalRates: (): RemovalRatesMap => {
    try {
      const stored = localStorage.getItem(KEYS.REMOVAL_RATES);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Error loading removal rates", error);
    }
    return INITIAL_CROP_NUTRIENT_REMOVAL;
  },

  // --- GLOBAL PARAMS (Efficiency Factors, etc) ---
  saveGlobalParams: (params: GlobalAgronomyParams) => {
    try {
      localStorage.setItem(KEYS.GLOBAL_PARAMS, JSON.stringify(params));
    } catch (error) {
       console.error("Error saving global params", error);
    }
  },

  loadGlobalParams: (): GlobalAgronomyParams => {
    try {
        const stored = localStorage.getItem(KEYS.GLOBAL_PARAMS);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error("Error loading global params", error);
    }
    return DEFAULT_GLOBAL_PARAMS;
  },

  // --- UTILS ---
  clearAll: () => {
    localStorage.removeItem(KEYS.FERTILIZERS);
    localStorage.removeItem(KEYS.REMOVAL_RATES);
    localStorage.removeItem(KEYS.GLOBAL_PARAMS);
    window.location.reload();
  }
};