import React, { useState } from 'react';
import { AreaUnit, YieldUnit, CropConfig } from '../types';

interface FertilizerConfigProps {
  selectedCrop: string;
  onBack: () => void;
  onCalculate: (config: CropConfig) => void;
}

export const FertilizerConfig: React.FC<FertilizerConfigProps> = ({ selectedCrop, onBack, onCalculate }) => {
  const [areaSize, setAreaSize] = useState<string>('');
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('manzanas');
  const [targetYield, setTargetYield] = useState<string>('');
  const [yieldUnit, setYieldUnit] = useState<YieldUnit>('quintales');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaSize || !targetYield) return;

    onCalculate({
      cropType: selectedCrop,
      areaSize: parseFloat(areaSize),
      areaUnit,
      targetYield: parseFloat(targetYield),
      yieldUnit
    });
  };

  // Helper para mostrar el nombre del cultivo capitalizado
  const cropName = selectedCrop.charAt(0).toUpperCase() + selectedCrop.slice(1);

  return (
    <div className="max-w-2xl mx-auto mt-8 animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="bg-emerald-600 px-6 py-6 text-center">
          <div className="mx-auto bg-emerald-500 w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 36v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-white font-bold text-2xl">Configuración del Cultivo</h2>
          <p className="text-emerald-100 mt-2 text-sm">
            Define el área y tu meta de producción para <strong>{cropName}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* Section 1: Area */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <label className="block text-gray-700 font-bold mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              Área de Siembra
            </label>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Tamaño del terreno</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  required
                  value={areaSize}
                  onChange={(e) => setAreaSize(e.target.value)}
                  placeholder="Ej. 5.5"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                />
              </div>
              <div className="w-full md:w-48">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Unidad de medida</label>
                <div className="relative">
                  <select
                    value={areaUnit}
                    onChange={(e) => setAreaUnit(e.target.value as AreaUnit)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white cursor-pointer"
                  >
                    <option value="manzanas">Manzanas (mz)</option>
                    <option value="hectares">Hectáreas (ha)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
            </div>
            
            {areaUnit === 'manzanas' && (
              <p className="text-xs text-gray-400 mt-2 italic">
                * Calculando 1 Manzana = 0.7 Hectáreas
              </p>
            )}
          </div>

          {/* Section 2: Production Goal */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <label className="block text-gray-700 font-bold mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Meta de Producción
            </label>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Rendimiento esperado por {areaUnit === 'manzanas' ? 'Manzana' : 'Hectárea'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={targetYield}
                  onChange={(e) => setTargetYield(e.target.value)}
                  placeholder="Ej. 40"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                />
              </div>
              <div className="w-full md:w-48">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Unidad de peso</label>
                <div className="relative">
                  <select
                    value={yieldUnit}
                    onChange={(e) => setYieldUnit(e.target.value as YieldUnit)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white cursor-pointer"
                  >
                    <option value="quintales">Quintales (qq)</option>
                    <option value="kg">Kilogramos (kg)</option>
                    <option value="lbs">Libras (lb)</option>
                    <option value="toneladas">Toneladas (t)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
            </div>
             {yieldUnit === 'quintales' && (
              <p className="text-xs text-gray-400 mt-2 italic">
                * 1 Quintal = 100 Libras
              </p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-3 px-6 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Atrás
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-6 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5"
            >
              Generar Recomendación
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};