import { SoilData, CropConfig, CalculationResult, NutrientResult, RemovalRatesMap, Fertilizer, BagRecommendation, FertilizerPlan, GlobalAgronomyParams } from "../types";
import { CONVERSIONS, EFFICIENCY } from "./agronomyData";

export const calculateFertilization = (
  soil: SoilData, 
  config: CropConfig, 
  removalRates: RemovalRatesMap,
  availableFertilizers: Fertilizer[],
  globalParams: GlobalAgronomyParams
): CalculationResult => {
  
  // 1. Normalizar Área a Hectáreas
  let areaInHectares = config.areaSize;
  if (config.areaUnit === 'manzanas') {
    areaInHectares = config.areaSize * CONVERSIONS.MANZANA_TO_HECTARE;
  }

  // 2. Normalizar Meta de Producción
  let yieldInKg = 0;
  switch (config.yieldUnit) {
    case 'toneladas': yieldInKg = config.targetYield * 1000; break;
    case 'quintales': yieldInKg = config.targetYield * CONVERSIONS.QUINTAL_TO_KG; break;
    case 'kg': yieldInKg = config.targetYield; break;
    case 'lbs': yieldInKg = config.targetYield * CONVERSIONS.LB_TO_KG; break;
  }
  
  const yieldPerUnitKg = yieldInKg; 
  let yieldPerHaTon = 0;
  if (config.areaUnit === 'hectares') {
    yieldPerHaTon = yieldPerUnitKg / 1000;
  } else {
    yieldPerHaTon = (yieldPerUnitKg / CONVERSIONS.MANZANA_TO_HECTARE) / 1000;
  }

  // 3. Obtener factores de extracción
  const cropKey = config.cropType.toLowerCase();
  const factors = removalRates[cropKey] || removalRates.default;

  // 4. Calcular Suministro del Suelo
  let soilN_KgHa = 0;
  if (soil.nitrogen && soil.nitrogen > 0) {
     soilN_KgHa = soil.nitrogen * CONVERSIONS.PPM_TO_KG_HA;
  } else {
     soilN_KgHa = (soil.organicMatter || 0) * 20; 
  }

  const soilP_KgHa = (soil.phosphorus || 0) * CONVERSIONS.PPM_TO_KG_HA;
  const soilP2O5_KgHa = soilP_KgHa * 2.29; 

  let k_ppm = soil.potassium || 0;
  if (k_ppm < 10 && k_ppm > 0) { 
    k_ppm = k_ppm * CONVERSIONS.CMOL_K_TO_PPM;
  }
  const soilK_KgHa = k_ppm * CONVERSIONS.PPM_TO_KG_HA;
  const soilK2O_KgHa = soilK_KgHa * 1.20;

  // 5. Calcular Déficits
  const nutrients: NutrientResult[] = [];

  const calcNutrient = (name: string, symbol: string, demandPerTon: number, supplyKgHa: number, soilEff: number, fertEff: number) => {
    const demandPerHa = yieldPerHaTon * demandPerTon;
    const effectiveSupply = supplyKgHa * soilEff;
    const deficitRaw = Math.max(0, demandPerHa - effectiveSupply);
    const quantityToApplyPerHa = deficitRaw / fertEff;
    const totalRequired = quantityToApplyPerHa * areaInHectares;

    nutrients.push({
      nutrient: name,
      symbol: symbol,
      soilSupply: Math.round(effectiveSupply),
      cropDemand: Math.round(demandPerHa),
      deficitPerHa: Math.round(quantityToApplyPerHa), 
      totalDeficit: totalRequired 
    });
  };

  calcNutrient('Nitrógeno', 'N', factors.n, soilN_KgHa, EFFICIENCY.soil.n, EFFICIENCY.fertilizer.n);
  calcNutrient('Fósforo', 'P₂O₅', factors.p, soilP2O5_KgHa, EFFICIENCY.soil.p, EFFICIENCY.fertilizer.p);
  calcNutrient('Potasio', 'K₂O', factors.k, soilK2O_KgHa, EFFICIENCY.soil.k, EFFICIENCY.fertilizer.k);

  // 6. Generar DOS planes de fertilización
  const defN = nutrients.find(n => n.symbol === 'N')?.totalDeficit || 0;
  const defP = nutrients.find(n => n.symbol === 'P₂O₅')?.totalDeficit || 0;
  const defK = nutrients.find(n => n.symbol === 'K₂O')?.totalDeficit || 0;

  // Plan A: TRADICIONAL (Solo Commodities, Eficiencia estándar)
  const commoditiesOnly = availableFertilizers.filter(f => f.type === 'commodity');
  const traditionalItems = calculateFertilizerMix(defN, defP, defK, commoditiesOnly, false, globalParams);
  
  const traditionalPlan: FertilizerPlan = {
    name: "Propuesta Tradicional",
    type: 'traditional',
    items: traditionalItems,
    totalBags: traditionalItems.reduce((sum, item) => sum + item.bags, 0),
    totalCost: traditionalItems.reduce((sum, item) => sum + item.cost, 0),
    totalNutrients: {
        n: traditionalItems.reduce((sum, item) => sum + item.suppliedN, 0),
        p: traditionalItems.reduce((sum, item) => sum + item.suppliedP, 0),
        k: traditionalItems.reduce((sum, item) => sum + item.suppliedK, 0),
    }
  };

  // Plan B: TECNOLÓGICA (Todo el portafolio, Eficiencia mejorada en Especialidades)
  // Nota: Pasamos 'true' para useTechnologicalEfficiency
  const technologicalItems = calculateFertilizerMix(defN, defP, defK, availableFertilizers, true, globalParams);

  // Calcular el porcentaje de ahorro de N para mostrar en UI
  const savingsPct = Math.round((globalParams.nitrogenEfficiencyBoost - 1) * 100);

  const technologicalPlan: FertilizerPlan = {
    name: "Propuesta Tecnológica",
    type: 'technological',
    items: technologicalItems,
    totalBags: technologicalItems.reduce((sum, item) => sum + item.bags, 0),
    totalCost: technologicalItems.reduce((sum, item) => sum + item.cost, 0),
    totalNutrients: {
        n: technologicalItems.reduce((sum, item) => sum + item.suppliedN, 0),
        p: technologicalItems.reduce((sum, item) => sum + item.suppliedP, 0),
        k: technologicalItems.reduce((sum, item) => sum + item.suppliedK, 0),
    }
  };

  // 7. Generar Recomendaciones de Corrección y Manejo
  const soilCorrections: { title: string; description: string; type: 'warning' | 'info' | 'success' }[] = [];
  
  // --- ANÁLISIS DE pH (ACIDEZ) ---
  if (soil.ph < 5.5) {
    soilCorrections.push({
      title: "Corrección de Acidez Necesaria",
      description: `El pH de ${soil.ph} es fuertemente ácido. Esto bloquea la disponibilidad de fertilizantes. Se recomienda aplicar CAL AGRÍCOLA o DOLOMITA al menos 30 días antes de la siembra.`,
      type: 'warning'
    });
  } else if (soil.ph >= 5.5 && soil.ph < 6.0) {
    soilCorrections.push({
      title: "Acidez Moderada",
      description: `El pH de ${soil.ph} es moderadamente ácido. Considere una aplicación de mantenimiento de cal para optimizar la absorción de nutrientes.`,
      type: 'info'
    });
  } else if (soil.ph > 7.5) {
    soilCorrections.push({
      title: "Suelo Alcalino",
      description: "Posible bloqueo de micronutrientes (Hierro, Zinc). Evite encalar. Prefiera fertilizantes de reacción ácida.",
      type: 'warning'
    });
  } else {
    soilCorrections.push({
      title: "pH Óptimo",
      description: `El pH de ${soil.ph} es ideal para la mayoría de cultivos. La eficiencia de los fertilizantes será alta.`,
      type: 'success'
    });
  }

  // --- ANÁLISIS DE MATERIA ORGÁNICA ---
  if (soil.organicMatter < 2.0) {
    soilCorrections.push({
      title: "Materia Orgánica Baja",
      description: "El nivel de M.O. es bajo (< 2%). Se recomienda incorporar abono orgánico para mejorar retención.",
      type: 'warning'
    });
  }

  return {
    config,
    nutrients, 
    recommendations: [],
    soilCorrections,
    plans: {
      traditional: traditionalPlan,
      technological: technologicalPlan
    }
  };
};

// Algoritmo Optimizado para Costo-Efectividad y Balance
const calculateFertilizerMix = (
    reqN: number, 
    reqP: number, 
    reqK: number, 
    pool: Fertilizer[],
    useTechnologicalEfficiency: boolean,
    globalParams: GlobalAgronomyParams
): BagRecommendation[] => {
  
  const recommendations: BagRecommendation[] = [];
  
  // Clonamos los requerimientos para ir restando
  let currentDeficitN = reqN;
  let currentDeficitP = reqP;
  let currentDeficitK = reqK;

  const bagWeightKg = 100 * CONVERSIONS.LB_TO_KG; 

  // --- FUNCIONES AUXILIARES ---

  // Obtener el contenido EFECTIVO de N (Considerando el boost del 21% si aplica)
  const getEffectiveN = (fert: Fertilizer): number => {
    // El boost aplica SOLO si estamos en modo tecnológico Y el fertilizante es Especializado
    const factor = (useTechnologicalEfficiency && fert.type === 'specialized') ? globalParams.nitrogenEfficiencyBoost : 1.0;
    return fert.n * factor;
  };

  // Función para agregar sacos a la recomendación
  const addBags = (fertId: string, count: number) => {
    if (count <= 0) return;
    const fert = pool.find(f => f.id === fertId);
    if (!fert) return;

    // Calcular aportes con eficiencia real
    const effN = getEffectiveN(fert);
    
    // Aporte total del lote de sacos
    const effectiveSuppliedN = (count * bagWeightKg * effN) / 100;
    const suppliedP = (count * bagWeightKg * fert.p) / 100;
    const suppliedK = (count * bagWeightKg * fert.k) / 100;

    // Verificar si ya existe en la lista para sumar
    const existingIndex = recommendations.findIndex(r => r.fertilizer.id === fert.id);
    if (existingIndex >= 0) {
        recommendations[existingIndex].bags += count;
        recommendations[existingIndex].suppliedN += effectiveSuppliedN;
        recommendations[existingIndex].suppliedP += suppliedP;
        recommendations[existingIndex].suppliedK += suppliedK;
        recommendations[existingIndex].cost += (count * fert.price);
    } else {
        recommendations.push({
            fertilizer: fert,
            bags: count,
            suppliedN: effectiveSuppliedN,
            suppliedP,
            suppliedK,
            cost: count * fert.price
        });
    }

    // Restar del déficit global
    currentDeficitN -= effectiveSuppliedN;
    currentDeficitP -= suppliedP;
    currentDeficitK -= suppliedK;
  };

  // Encontrar la fuente más COSTO-EFECTIVA para un nutriente específico
  const findCheapestSource = (nutrient: 'n' | 'p' | 'k'): string | undefined => {
    let bestFertId: string | undefined;
    let bestCostPerUnit = Infinity;

    pool.forEach(fert => {
        let content = 0;
        
        if (nutrient === 'n') content = getEffectiveN(fert); 
        if (nutrient === 'p') content = fert.p;
        if (nutrient === 'k') content = fert.k;

        if (content > 0) {
            // Precio por unidad de porcentaje efectivo
            const costPerUnit = fert.price / content;
            
            if (costPerUnit < bestCostPerUnit) {
                bestCostPerUnit = costPerUnit;
                bestFertId = fert.id;
            }
        }
    });

    return bestFertId;
  };

  // --- ESTRATEGIA DE LLENADO ---
  
  // PASO 1: Cubrir bases de P y K (Complejos NPK)
  // LÓGICA MEJORADA: Evalúa "Puntos Útiles por Dólar"
  // Solo suma puntos si el cultivo realmente necesita ese nutriente en este momento.
  // Esto penaliza fertilizantes balanceados (como Triple 15) si el suelo ya tiene mucho de algo (ej. Fósforo).
  
  if (currentDeficitP > 10 || currentDeficitK > 10) {
    let bestFormulaId: string | undefined;
    let maxUsefulPointsPerDollar = 0;

    // Filtramos fertilizantes que tengan algo de P o K
    const potentialComplexes = pool.filter(f => f.p > 0 || f.k > 0);

    potentialComplexes.forEach(f => {
        const effN = getEffectiveN(f);
        
        // Calcular "Nutrientes Útiles" para la situación actual
        // Solo contamos el porcentaje del saco que va a cubrir una necesidad real
        let usefulPoints = 0;
        
        // El Nitrógeno casi siempre es útil, le damos peso completo
        if (currentDeficitN > 10) usefulPoints += effN;
        
        // P y K solo suman si hay déficit significativo
        if (currentDeficitP > 10) usefulPoints += f.p;
        if (currentDeficitK > 10) usefulPoints += f.k;

        if (usefulPoints > 0) {
            const score = usefulPoints / f.price; // Cuantos puntos de nutriente útil compro con 1 dólar
            
            if (score > maxUsefulPointsPerDollar) {
                maxUsefulPointsPerDollar = score;
                bestFormulaId = f.id;
            }
        }
    });
    
    // Si encontramos una fórmula ganadora
    if (bestFormulaId) {
        const fert = pool.find(f => f.id === bestFormulaId)!;
        let bags = 0;
        
        // Determinar la dosis basada en el limitante más crítico entre P y K
        // Usamos una lógica conservadora para no sobre-fertilizar masivamente el otro
        if (currentDeficitK > currentDeficitP && fert.k > 0) {
             const kgKPerBag = (bagWeightKg * fert.k) / 100;
             bags = Math.ceil(currentDeficitK / kgKPerBag);
             // Ajuste: Si esto provoca un exceso masivo de P (ej > 200%), reducir dosis? 
             // Por simplicidad, asumimos que cubrir el déficit es prioridad.
        } else if (currentDeficitP > 0 && fert.p > 0) {
             const kgPPerBag = (bagWeightKg * fert.p) / 100;
             bags = Math.ceil(currentDeficitP / kgPPerBag);
        }

        if (bags > 0) addBags(bestFormulaId, bags);
    }
  }

  // PASO 2: Corregir remanentes individuales
  // Iteramos para llenar lo que falta con la fuente más barata para ESE nutriente
  
  // K Restante
  if (currentDeficitK > 5) { 
      const kSourceId = findCheapestSource('k');
      if (kSourceId) {
        const fert = pool.find(f => f.id === kSourceId)!;
        const kgKPerBag = (bagWeightKg * fert.k) / 100;
        if (kgKPerBag > 0) {
            const bags = Math.ceil(currentDeficitK / kgKPerBag);
            addBags(kSourceId, bags);
        }
      }
  }

  // P Restante
  if (currentDeficitP > 5) {
      const pSourceId = findCheapestSource('p');
      if (pSourceId) {
        const fert = pool.find(f => f.id === pSourceId)!;
        const kgPPerBag = (bagWeightKg * fert.p) / 100;
        if (kgPPerBag > 0) {
            const bags = Math.ceil(currentDeficitP / kgPPerBag);
            addBags(pSourceId, bags);
        }
      }
  }

  // N Restante (El más común)
  if (currentDeficitN > 5) {
    const nSourceId = findCheapestSource('n');
    
    if (nSourceId) {
        const fert = pool.find(f => f.id === nSourceId)!;
        const effN = getEffectiveN(fert);
        const kgNPerBag = (bagWeightKg * effN) / 100;
        
        if (kgNPerBag > 0) {
            const bags = Math.ceil(currentDeficitN / kgNPerBag);
            addBags(nSourceId, bags);
        }
    }
  }

  return recommendations;
};