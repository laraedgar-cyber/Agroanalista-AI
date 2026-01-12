import React, { useState, useEffect, useMemo } from 'react';
import { SoilData } from '../types';

interface ResultsPreviewProps {
  data: SoilData;
  onReset: () => void;
  onContinue: (selectedCrop: string) => void;
}

const SUPPORTED_CROPS = [
  { id: 'cafe', label: 'Café', icon: '☕' },
  { id: 'maiz', label: 'Maíz', icon: '🌽' },
  { id: 'frijol', label: 'Frijol', icon: '🫘' },
  { id: 'tomate', label: 'Tomate', icon: '🍅' },
  { id: 'cana', label: 'Caña', icon: '🎋' },
  { id: 'papa', label: 'Papa', icon: '🥔' },
];

// Helper interface for display items
interface DisplayItem {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  isRaw?: boolean; // If true, it comes from otherData string
}

export const ResultsPreview: React.FC<ResultsPreviewProps> = ({ data, onReset, onContinue }) => {
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [isRatiosOpen, setIsRatiosOpen] = useState<boolean>(false);

  useEffect(() => {
    if (data.crop) {
      const normalized = data.crop.toLowerCase();
      const match = SUPPORTED_CROPS.find(c => 
        normalized.includes(c.label.toLowerCase()) || 
        normalized.includes(c.id)
      );
      if (match) setSelectedCrop(match.id);
    }
  }, [data.crop]);

  // Logic to classify and distribute data
  const classifiedData = useMemo(() => {
    const rawOtherData = data.otherData || [];
    
    // Arrays to hold categorized items
    const majors: DisplayItem[] = [];
    const secondaries: DisplayItem[] = [];
    const micros: DisplayItem[] = [];
    const physical: DisplayItem[] = [];
    const ratiosAndPercentages: DisplayItem[] = [];
    const unclassified: string[] = [];

    // 1. Process Core Fixed Fields
    // Physical / Chemical Basics
    physical.push({ label: 'pH', value: data.ph, color: 'blue' });
    // Organic Matter moved to Majors based on user request
    if (data.cationExchangeCapacity) physical.push({ label: 'CIC', value: data.cationExchangeCapacity, unit: 'cmol/kg', color: 'gray' });
    if (data.texture) physical.push({ label: 'Textura', value: data.texture, color: 'gray' });

    // Majors (Macro)
    // REPLACEMENT: Use Organic Matter and Inferred Nitrogen instead of raw Nitrogen
    if (data.organicMatter) {
      // 1. Materia Orgánica (Primary indicator for N potential)
      majors.push({ 
        label: 'Materia Orgánica', 
        value: data.organicMatter, 
        unit: '%', 
        color: 'emerald' 
      });

      // 2. Inferred Nitrogen
      // Heuristic: Approx 20kg N available per Ha per year for each 1% of OM.
      const estimatedN = (data.organicMatter * 20).toFixed(0);
      majors.push({ 
        label: 'Nitrógeno Est. (N)', 
        value: estimatedN, 
        unit: 'kg/ha/año', 
        color: 'emerald' 
      });
    } else {
      // Fallback if no OM detected but N is present
      majors.push({ label: 'Nitrógeno (N)', value: data.nitrogen, unit: 'ppm', color: 'emerald' });
    }

    majors.push({ label: 'Fósforo (P)', value: data.phosphorus, unit: 'ppm', color: 'emerald' });
    majors.push({ label: 'Potasio (K)', value: data.potassium, unit: 'cmol/kg', color: 'emerald' });

    // Secondaries (Fixed fields from Gemini schema)
    if (data.calcium) secondaries.push({ label: 'Calcio (Ca)', value: data.calcium, unit: 'cmol/kg', color: 'teal' });
    if (data.magnesium) secondaries.push({ label: 'Magnesio (Mg)', value: data.magnesium, unit: 'cmol/kg', color: 'teal' });

    // 2. Process "Other Data" (String parsing)
    // Strict Keywords for classification
    const keywords = {
      // Sulfates typically secondary
      secondary: ['azufre', 'sufre', 'so4', '-s', 'sulfate', 'sulphur'],
      // Standard Micronutrients (B, Zn, Fe, Mn, Cu, Mo, Cl)
      micro: [
          'boro', ' b ', 'boron', 
          'hierro', 'fe ', 'iron', 
          'manganeso', 'mn ', 'manganese', 
          'cobre', 'cu ', 'copper', 
          'zinc', 'cinc', 'zn ', 
          'molibdeno', 'mo ', 
          'cloro', 'cl '
      ],
      // Ratios and saturations
      ratios: ['relación', 'relacion', 'ratio', '/', 'saturación', 'saturacion', 'sat', 'acidez', 'intercambiable', 'h+al', 'aluminum', 'aluminio', 'al '],
    };

    rawOtherData.forEach(item => {
      const lowerItem = item.toLowerCase();
      
      // Order matters slightly to prevent false positives, though explicit checks are better
      if (keywords.micro.some(k => lowerItem.includes(k))) {
        micros.push({ label: item, value: '', isRaw: true, color: 'orange' });
      } 
      else if (keywords.secondary.some(k => lowerItem.includes(k))) {
        secondaries.push({ label: item, value: '', isRaw: true, color: 'teal' });
      } 
      else if (keywords.ratios.some(k => lowerItem.includes(k))) {
        ratiosAndPercentages.push({ label: item, value: '', isRaw: true, color: 'purple' });
      } else {
        unclassified.push(item);
      }
    });

    return {
      majors,
      secondaries,
      micros,
      physical,
      ratiosAndPercentages,
      unclassified
    };
  }, [data]);

  return (
    <div className="max-w-4xl mx-auto mt-8 animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="bg-emerald-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Análisis Completado
          </h2>
          <button 
            onClick={onReset}
            className="text-emerald-100 hover:text-white text-sm font-medium transition-colors"
          >
            Analizar otro
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-8">
            <h3 className="text-gray-800 font-semibold mb-6 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="bg-emerald-100 text-emerald-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              Datos del Análisis
            </h3>
            
            <div className="space-y-8 pl-2 md:pl-4">
              
              {/* SECTION: Physical Properties */}
              <div>
                <h4 className="text-sm uppercase tracking-wide text-gray-500 font-semibold mb-3">Propiedades Físico-Químicas</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {classifiedData.physical.map((item, idx) => (
                    <DataCard key={idx} {...item} />
                  ))}
                </div>
              </div>

              {/* SECTION: Nutrients Grid */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Majors */}
                <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
                  <h4 className="text-emerald-800 font-bold mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Elementos Mayores
                  </h4>
                  <div className="space-y-3">
                    {classifiedData.majors.map((item, idx) => (
                      <MiniRow key={idx} label={item.label} value={item.value} unit={item.unit} />
                    ))}
                  </div>
                </div>

                {/* Secondaries */}
                <div className="bg-teal-50/50 rounded-xl p-4 border border-teal-100">
                  <h4 className="text-teal-800 font-bold mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                    Elementos Menores
                  </h4>
                  <div className="space-y-3">
                    {classifiedData.secondaries.length > 0 ? (
                      classifiedData.secondaries.map((item, idx) => (
                        <MiniRow key={idx} label={item.label} value={item.value} unit={item.unit} isRaw={item.isRaw} />
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 italic">No detectados</p>
                    )}
                  </div>
                </div>

                {/* Micros */}
                <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100">
                  <h4 className="text-amber-800 font-bold mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Micronutrientes
                  </h4>
                  <div className="space-y-3">
                    {classifiedData.micros.length > 0 ? (
                      classifiedData.micros.map((item, idx) => (
                        <MiniRow key={idx} label={item.label} value={item.value} unit={item.unit} isRaw={item.isRaw} />
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 italic">No detectados (Zn, B, Fe, Mn, Cu)</p>
                    )}
                  </div>
                </div>
              </div>

              {/* COLLAPSIBLE SECTION: Ratios & Percentages */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button 
                  onClick={() => setIsRatiosOpen(!isRatiosOpen)}
                  className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="font-semibold text-gray-700">Relaciones, Saturaciones y Acidez</span>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                      {classifiedData.ratiosAndPercentages.length} items
                    </span>
                  </div>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-5 w-5 text-gray-400 transform transition-transform duration-300 ${isRatiosOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <div className={`transition-all duration-300 ease-in-out ${isRatiosOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-white">
                    {classifiedData.ratiosAndPercentages.length > 0 ? (
                      classifiedData.ratiosAndPercentages.map((item, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                          {item.label}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-sm p-2">No se encontraron datos de relaciones o saturación.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Unclassified leftovers */}
              {classifiedData.unclassified.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">Otros datos sin clasificar</h5>
                  <div className="flex flex-wrap gap-2">
                    {classifiedData.unclassified.map((item, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-white border border-gray-300 text-gray-600">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="bg-emerald-100 text-emerald-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              Cultivo a Sembrar
            </h3>
            
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-4">
              {SUPPORTED_CROPS.map((crop) => (
                <button
                  key={crop.id}
                  onClick={() => setSelectedCrop(crop.id)}
                  className={`
                    p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 relative overflow-hidden group
                    ${selectedCrop === crop.id 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200 ring-offset-1 shadow-sm' 
                      : 'border-gray-100 bg-white text-gray-500 hover:border-emerald-200 hover:bg-gray-50 hover:text-gray-700'
                    }
                  `}
                >
                  <span className="text-2xl filter drop-shadow-sm">{crop.icon}</span>
                  <span className="text-xs font-semibold">{crop.label}</span>
                  {selectedCrop === crop.id && (
                    <div className="absolute top-1 right-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 justify-end border-t border-gray-100 pt-6 mt-8">
            <button 
               onClick={onReset}
               className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
               onClick={() => selectedCrop && onContinue(selectedCrop)}
               disabled={!selectedCrop}
               className={`
                 px-6 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-lg
                 ${selectedCrop 
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200 hover:shadow-emerald-300 transform hover:-translate-y-0.5' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                 }
               `}
            >
              <span>Calcular Fertilización</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-component for Major properties card
const DataCard = ({ label, value, unit, color }: { label: string, value: string | number | undefined, unit?: string, color?: string }) => {
  const displayValue = value === 0 || value === undefined ? '-' : value;
  
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    gray: 'bg-gray-50 text-gray-700 border-gray-100',
  };

  const className = colorClasses[color || 'gray'];

  return (
    <div className={`p-3 rounded-xl border ${className} flex flex-col items-center justify-center text-center`}>
      <span className="text-[10px] uppercase tracking-wider font-bold opacity-60 mb-1">{label}</span>
      <span className="text-xl font-bold">
        {displayValue} <span className="text-xs font-normal opacity-70">{unit}</span>
      </span>
    </div>
  );
};

// Sub-component for list items in nutrient columns
const MiniRow = ({ label, value, unit, isRaw }: { label: string, value: string | number, unit?: string, isRaw?: boolean }) => {
  if (isRaw) {
    // If it's a raw string from otherData, just display the label (which contains the value)
    return (
      <div className="flex justify-between items-center bg-white p-2 rounded border border-gray-100 shadow-sm">
         <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
    );
  }

  const displayValue = value === 0 || value === undefined ? '-' : value;
  
  return (
    <div className="flex justify-between items-center bg-white p-2 rounded border border-gray-100 shadow-sm">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="font-bold text-gray-800">
        {displayValue} <span className="text-xs font-normal text-gray-400">{unit}</span>
      </span>
    </div>
  );
};