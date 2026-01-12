import React, { useState, useEffect } from 'react';
import { RemovalRatesMap, GlobalAgronomyParams } from '../types';

interface AgronomyEditorProps {
  data: RemovalRatesMap;
  globalParams: GlobalAgronomyParams;
  onSave: (newData: RemovalRatesMap, newParams: GlobalAgronomyParams) => void;
  onClose: () => void;
}

export const AgronomyEditor: React.FC<AgronomyEditorProps> = ({ data, globalParams, onSave, onClose }) => {
  const [localData, setLocalData] = useState<RemovalRatesMap>(JSON.parse(JSON.stringify(data)));
  const [localParams, setLocalParams] = useState<GlobalAgronomyParams>(JSON.parse(JSON.stringify(globalParams)));
  const [hasChanges, setHasChanges] = useState(false);

  // Calcular el porcentaje de eficiencia para mostrar (1.21 -> 21)
  const displayEfficiency = Math.round((localParams.nitrogenEfficiencyBoost - 1) * 100);

  const handleChange = (cropKey: string, nutrient: 'n' | 'p' | 'k', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setLocalData(prev => ({
      ...prev,
      [cropKey]: {
        ...prev[cropKey],
        [nutrient]: numValue
      }
    }));
    setHasChanges(true);
  };

  const handleParamChange = (valueStr: string) => {
    const val = parseFloat(valueStr);
    if (isNaN(val)) return;
    
    // Convertir de porcentaje a factor (21 -> 1.21)
    const factor = 1 + (val / 100);
    setLocalParams(prev => ({
        ...prev,
        nitrogenEfficiencyBoost: factor
    }));
    setHasChanges(true);
  };

  const handleReset = () => {
    setLocalData(JSON.parse(JSON.stringify(data)));
    setLocalParams(JSON.parse(JSON.stringify(globalParams)));
    setHasChanges(false);
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 animate-fade-in-up pb-12">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-gray-800 px-6 py-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h2 className="text-lg font-bold">Configuración Agronómica</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          
          {/* SECTION: Global Params */}
          <div className="mb-8 bg-emerald-50 border border-emerald-100 p-5 rounded-xl">
             <h3 className="text-emerald-800 font-bold mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Factores de Tecnología
             </h3>
             <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Mejora de Eficiencia en Nitrógeno (%)
                    </label>
                    <p className="text-xs text-gray-500">
                        Porcentaje extra de N asimilable en fertilizantes de especialidad vs. commodities. 
                        Ajustar según condiciones de humedad y suelo.
                    </p>
                </div>
                <div className="w-32 relative">
                    <input 
                        type="number"
                        min="0"
                        max="100"
                        value={displayEfficiency}
                        onChange={(e) => handleParamChange(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 border border-emerald-300 rounded-lg text-emerald-900 font-bold text-center focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <span className="absolute right-3 top-2 text-emerald-600 font-bold">%</span>
                </div>
             </div>
          </div>

          <h3 className="text-gray-800 font-bold mb-4">Constantes de Extracción por Cultivo</h3>
          <p className="text-sm text-gray-500 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
            <strong>Nota:</strong> Kg de nutriente extraídos por tonelada de cosecha.
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Cultivo</th>
                  <th className="px-4 py-3 text-center text-blue-700 bg-blue-50">Nitrógeno (N)</th>
                  <th className="px-4 py-3 text-center text-orange-700 bg-orange-50">Fósforo (P₂O₅)</th>
                  <th className="px-4 py-3 text-center text-purple-700 bg-purple-50 rounded-tr-lg">Potasio (K₂O)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.keys(localData).map((key) => (
                  <tr key={key} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-700 capitalize">
                      {key === 'default' ? 'Por defecto' : key}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-center">
                        <input
                          type="number"
                          value={localData[key].n}
                          onChange={(e) => handleChange(key, 'n', e.target.value)}
                          className="w-20 text-center p-2 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-center">
                        <input
                          type="number"
                          value={localData[key].p}
                          onChange={(e) => handleChange(key, 'p', e.target.value)}
                          className="w-20 text-center p-2 border border-gray-200 rounded focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-center">
                        <input
                          type="number"
                          value={localData[key].k}
                          onChange={(e) => handleChange(key, 'k', e.target.value)}
                          className="w-20 text-center p-2 border border-gray-200 rounded focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
              disabled={!hasChanges}
            >
              Revertir Cambios
            </button>
            <button
              onClick={() => { onSave(localData, localParams); onClose(); }}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-md font-medium"
            >
              Guardar Configuración
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};