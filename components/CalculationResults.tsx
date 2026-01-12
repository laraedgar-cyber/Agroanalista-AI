import React, { useState } from 'react';
import { CalculationResult, FertilizerPlan, NutrientResult } from '../types';

interface CalculationResultsProps {
  result: CalculationResult;
  onBack: () => void;
  onReset: () => void;
}

export const CalculationResults: React.FC<CalculationResultsProps> = ({ result, onBack, onReset }) => {
  const { config, nutrients, soilCorrections, plans } = result;

  // Helper to extract required totals for chart context
  const requirements = {
    n: nutrients.find(n => n.symbol === 'N')?.totalDeficit || 0,
    p: nutrients.find(n => n.symbol === 'P₂O₅')?.totalDeficit || 0,
    k: nutrients.find(n => n.symbol === 'K₂O')?.totalDeficit || 0,
  };

  // Determinar la etiqueta de unidad (ej. "por Manzana" o "por Hectárea")
  const unitLabel = config.areaUnit === 'manzanas' ? 'Manzana' : 'Hectárea';
  
  return (
    <div className="w-full max-w-7xl mx-auto mt-8 animate-fade-in-up pb-12">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-8 text-center text-white relative">
          <button 
            onClick={onReset}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            title="Cargar nuevo análisis"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <h2 className="text-3xl font-bold mb-2">Plan de Fertilización</h2>
          <p className="text-emerald-100 opacity-90">
            Para {config.areaSize} {config.areaUnit} de <strong>{config.cropType}</strong> con meta de {config.targetYield} {config.yieldUnit}/{unitLabel.toLowerCase()}
          </p>
        </div>

        <div className="p-6 md:p-8 bg-gray-50">
          
          {/* COMPARATIVE QUOTES */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            
            {/* TRADITIONAL PLAN */}
            <PlanCard 
              plan={plans.traditional} 
              requirements={requirements}
              isRecommended={false} 
              areaLabel={`${config.areaSize} ${config.areaUnit}`}
            />

            {/* TECHNOLOGICAL PLAN */}
            <PlanCard 
              plan={plans.technological} 
              requirements={requirements}
              isRecommended={true} 
              areaLabel={`${config.areaSize} ${config.areaUnit}`}
              savingsText="Incluye tecnología de eficiencia de Nitrógeno (+21%)"
            />

          </div>

          {/* NUTRIENT REQ GRID */}
          <div className="mb-12 max-w-5xl mx-auto">
             <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Requerimientos Nutricionales Totales</h3>
             <div className="grid md:grid-cols-3 gap-6">
                {nutrients.map((item, idx) => {
                  const val = Math.round(item.totalDeficit);
                  const colors = ['bg-blue-100 text-blue-800', 'bg-orange-100 text-orange-800', 'bg-purple-100 text-purple-800'];
                  return (
                    <div key={idx} className={`rounded-xl p-4 ${colors[idx % 3]} flex justify-between items-center`}>
                       <div>
                          <span className="block text-xs font-bold uppercase opacity-70">{item.nutrient}</span>
                          <span className="text-2xl font-black">{val} kg</span>
                       </div>
                       <div className="text-3xl font-black opacity-20">{item.symbol}</div>
                    </div>
                  );
                })}
             </div>
          </div>

          {/* SOIL CORRECTIONS SECTION */}
          {soilCorrections.length > 0 && (
            <div className="mb-10 max-w-5xl mx-auto">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="bg-amber-100 p-2 rounded-lg text-amber-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </span>
                Correcciones y Manejo de Suelo
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                {soilCorrections.map((item, i) => (
                  <div key={i} className={`p-4 rounded-xl border flex gap-4 items-start bg-white border-gray-200 shadow-sm`}>
                      <div className="flex-shrink-0 mt-1 text-emerald-600">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1 text-gray-800">{item.title}</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                      </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center border-t border-gray-200 pt-8 max-w-5xl mx-auto">
            <button
              onClick={onBack}
              className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-white transition-colors"
            >
              Ajustar Configuración
            </button>
            <button
              onClick={onReset}
              className="px-6 py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 shadow-lg transition-all hover:-translate-y-0.5"
            >
              Cargar Nuevo Análisis
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

const PlanCard = ({ plan, requirements, isRecommended, areaLabel, savingsText }: { plan: FertilizerPlan, requirements: {n:number, p:number, k:number}, isRecommended: boolean, areaLabel: string, savingsText?: string }) => {
  
  // Calcular el puntaje de "Apego a la necesidad"
  // Promedio del porcentaje de satisfacción de N, P y K, capeado al 100% para no premiar excesos
  const calcScore = (supplied: number, required: number) => {
    if (required === 0) return 1; // Si no se requiere, 100% satisfecho
    return Math.min(supplied / required, 1.1); // Permitir un poco de exceso en el score visual (110%)
  };
  
  const scoreN = calcScore(plan.totalNutrients.n, requirements.n);
  const scoreP = calcScore(plan.totalNutrients.p, requirements.p);
  const scoreK = calcScore(plan.totalNutrients.k, requirements.k);
  
  const matchScore = Math.round(((scoreN + scoreP + scoreK) / 3) * 100);
  
  // Color del score
  let scoreColor = "text-red-500";
  if(matchScore > 80) scoreColor = "text-yellow-500";
  if(matchScore > 95) scoreColor = "text-emerald-500";

  return (
    <div className={`rounded-2xl overflow-hidden flex flex-col h-full border-2 transition-all duration-300 ${isRecommended ? 'border-emerald-500 shadow-xl scale-[1.02] bg-white z-10' : 'border-gray-200 shadow-md bg-white opacity-90 hover:opacity-100'}`}>
      
      {/* Card Header */}
      <div className={`p-5 text-center ${isRecommended ? 'bg-emerald-600' : 'bg-gray-700'}`}>
        <h3 className="text-xl font-bold text-white uppercase tracking-wider">{plan.name}</h3>
        {isRecommended && (
           <span className="inline-block mt-2 bg-emerald-800 text-emerald-100 text-xs px-2 py-0.5 rounded-full font-bold uppercase">
             Opción Recomendada
           </span>
        )}
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col">
         {savingsText && (
             <div className="mb-4 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-2 rounded-lg text-center border border-emerald-100">
               ✨ {savingsText}
             </div>
         )}
         
         {/* CHART & SCORE */}
         <div className="flex flex-col items-center mb-6 border-b border-gray-100 pb-6">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Balance Nutricional</h4>
            <div className="relative w-48 h-48">
                 {/* Match Score Badge */}
                <div className="absolute top-0 right-0 bg-white shadow-md border rounded-lg p-1.5 text-center z-10">
                    <span className="block text-[10px] text-gray-400 font-bold uppercase">Precisión</span>
                    <span className={`text-lg font-black ${scoreColor}`}>{matchScore}%</span>
                </div>

                <RadarChart 
                    required={requirements} 
                    supplied={plan.totalNutrients} 
                    color={isRecommended ? '#10b981' : '#6b7280'}
                />
            </div>
            <div className="flex gap-4 text-[10px] text-gray-500 mt-2">
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300"></span>Requerido</div>
                <div className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${isRecommended ? 'bg-emerald-500' : 'bg-gray-500'}`}></span>Aportado</div>
            </div>
         </div>

         {/* Items List */}
         <div className="flex-1 space-y-3 mb-6">
            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase border-b pb-2 mb-2">
                <span>Producto</span>
                <span>Cantidad</span>
                <span>Subtotal</span>
            </div>
            {plan.items.length > 0 ? (
                plan.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${isRecommended ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                             {item.fertilizer.type === 'specialized' ? '★' : 'C'}
                           </div>
                           <span className="font-medium text-gray-800">{item.fertilizer.name}</span>
                        </div>
                        <div className="text-right">
                            <div className="font-bold">{item.bags} scs</div>
                            <div className="text-xs text-gray-500 font-mono">${item.cost.toLocaleString()}</div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-8 text-gray-400 italic text-sm">
                    No se requieren productos de esta categoría.
                </div>
            )}
         </div>

         {/* Summary Footer */}
         <div className="border-t pt-4 mt-auto">
            <div className="flex justify-between items-center mb-1 text-gray-600 text-sm">
               <span>Total Sacos:</span>
               <span className="font-bold">{plan.totalBags}</span>
            </div>
            <div className="flex justify-between items-end">
               <span className="text-gray-800 font-bold">Inversión Total:</span>
               <span className={`text-3xl font-black ${isRecommended ? 'text-emerald-600' : 'text-gray-800'}`}>
                 ${plan.totalCost.toLocaleString()}
               </span>
            </div>
            <p className="text-[10px] text-gray-400 text-right mt-1">Para {areaLabel}</p>
         </div>
      </div>
    </div>
  );
};

// --- RADAR CHART COMPONENT (Pure SVG) ---
const RadarChart = ({ required, supplied, color }: { 
    required: {n:number, p:number, k:number}, 
    supplied: {n:number, p:number, k:number},
    color: string
}) => {
    // Constants
    const size = 200;
    const center = size / 2;
    const radius = 80;

    // Normalization: Find the max value to scale the chart so everything fits
    // Use required as the baseline 100% (radius), but expand if supplied is larger
    const maxVal = Math.max(
        required.n || 1, required.p || 1, required.k || 1,
        supplied.n, supplied.p, supplied.k
    ) * 1.1; // Add 10% padding

    // Helper to calculate coordinates
    // Angles: N (top, -90), P (bottom-right, 30), K (bottom-left, 150)
    const getCoords = (value: number, angleDeg: number) => {
        const angleRad = (angleDeg * Math.PI) / 180;
        // Scale value relative to maxVal
        const r = (value / maxVal) * radius; 
        const x = center + r * Math.cos(angleRad);
        const y = center + r * Math.sin(angleRad);
        return `${x},${y}`;
    };

    // Ideal (Required) Polygon points
    // Note: We normalize 'Required' so it forms a perfect triangle relative to itself if we wanted, 
    // but here we are plotting absolute values scaled to maxVal to show real deficits.
    const reqPoints = [
        getCoords(required.n, -90),
        getCoords(required.p, 30),
        getCoords(required.k, 150)
    ].join(" ");

    // Actual (Supplied) Polygon points
    const supPoints = [
        getCoords(supplied.n, -90),
        getCoords(supplied.p, 30),
        getCoords(supplied.k, 150)
    ].join(" ");

    // Axis Endpoints (for drawing lines)
    const axisN = getCoords(maxVal, -90);
    const axisP = getCoords(maxVal, 30);
    const axisK = getCoords(maxVal, 150);

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full overflow-visible">
            {/* Background Circle / Axes */}
            <circle cx={center} cy={center} r={radius} fill="none" stroke="#f3f4f6" strokeWidth="1" />
            <circle cx={center} cy={center} r={radius * 0.5} fill="none" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4 4" />
            
            {/* Axis Lines */}
            <line x1={center} y1={center} x2={axisN.split(',')[0]} y2={axisN.split(',')[1]} stroke="#e5e7eb" strokeWidth="1" />
            <line x1={center} y1={center} x2={axisP.split(',')[0]} y2={axisP.split(',')[1]} stroke="#e5e7eb" strokeWidth="1" />
            <line x1={center} y1={center} x2={axisK.split(',')[0]} y2={axisK.split(',')[1]} stroke="#e5e7eb" strokeWidth="1" />

            {/* Labels */}
            <text x={center} y={center - radius - 10} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#374151">N</text>
            <text x={center + radius * 0.86 + 10} y={center + radius * 0.5 + 5} textAnchor="start" fontSize="10" fontWeight="bold" fill="#374151">P</text>
            <text x={center - radius * 0.86 - 10} y={center + radius * 0.5 + 5} textAnchor="end" fontSize="10" fontWeight="bold" fill="#374151">K</text>

            {/* Required Area (Gray) */}
            <polygon points={reqPoints} fill="#9ca3af" fillOpacity="0.1" stroke="#9ca3af" strokeWidth="1" strokeDasharray="4 2" />

            {/* Supplied Area (Colored) */}
            <polygon points={supPoints} fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />
            
            {/* Dots for Supplied */}
            <circle cx={supPoints.split(' ')[0].split(',')[0]} cy={supPoints.split(' ')[0].split(',')[1]} r="3" fill={color} />
            <circle cx={supPoints.split(' ')[1].split(',')[0]} cy={supPoints.split(' ')[1].split(',')[1]} r="3" fill={color} />
            <circle cx={supPoints.split(' ')[2].split(',')[0]} cy={supPoints.split(' ')[2].split(',')[1]} r="3" fill={color} />

        </svg>
    );
};