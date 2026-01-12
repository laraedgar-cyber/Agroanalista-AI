import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { ResultsPreview } from './components/ResultsPreview';
import { FertilizerConfig } from './components/FertilizerConfig';
import { CalculationResults } from './components/CalculationResults';
import { AgronomyEditor } from './components/AgronomyEditor';
import { FertilizerManager } from './components/FertilizerManager'; 
import { analyzeSoilPDF } from './services/geminiService';
import { calculateFertilization } from './services/calculationService';
import { storageService } from './services/storageService'; // Import storage service
import { SoilData, AnalysisStatus, CropConfig, CalculationResult, RemovalRatesMap, Fertilizer, GlobalAgronomyParams } from './types';

// Steps of the application wizard
type AppStep = 'upload' | 'review' | 'config' | 'results' | 'settings';

function App() {
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [step, setStep] = useState<AppStep>('upload');
  const [previousStep, setPreviousStep] = useState<AppStep>('upload'); 
  
  const [soilData, setSoilData] = useState<SoilData | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // State for Agronomic Data (Load from storage LAZILY to ensure it runs on mount)
  const [removalRates, setRemovalRates] = useState<RemovalRatesMap>(() => storageService.loadRemovalRates());
  const [fertilizers, setFertilizers] = useState<Fertilizer[]>(() => storageService.loadFertilizers());
  const [globalParams, setGlobalParams] = useState<GlobalAgronomyParams>(() => storageService.loadGlobalParams());
  
  // Settings Tab State
  const [settingsTab, setSettingsTab] = useState<'rates' | 'fertilizers'>('rates');

  // EFECTOS DE PERSISTENCIA
  useEffect(() => {
    storageService.saveRemovalRates(removalRates);
  }, [removalRates]);

  useEffect(() => {
    storageService.saveFertilizers(fertilizers);
  }, [fertilizers]);

  useEffect(() => {
    storageService.saveGlobalParams(globalParams);
  }, [globalParams]);

  // Handle saving data when updated (UI triggers)
  const handleAgronomyUpdate = (newData: RemovalRatesMap, newParams: GlobalAgronomyParams) => {
    setRemovalRates(newData);
    setGlobalParams(newParams);
  };

  const handleFertilizersUpdate = (newData: Fertilizer[]) => {
    setFertilizers(newData);
  };

  const handleFileSelect = useCallback(async (file: File) => {
    setStatus(AnalysisStatus.ANALYZING);
    setErrorMessage('');

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64String = reader.result as string;
        const base64Content = base64String.split(',')[1];
        
        try {
          const data = await analyzeSoilPDF(base64Content, file.type);
          setSoilData(data);
          setStatus(AnalysisStatus.SUCCESS);
          setStep('review');
        } catch (err) {
          console.error(err);
          setErrorMessage("Error procesando el archivo con IA. Intenta con una imagen más clara o un PDF diferente.");
          setStatus(AnalysisStatus.ERROR);
        }
      };

      reader.onerror = () => {
        setErrorMessage("Error leyendo el archivo local.");
        setStatus(AnalysisStatus.ERROR);
      };

    } catch (error) {
      setErrorMessage("Ocurrió un error inesperado.");
      setStatus(AnalysisStatus.ERROR);
    }
  }, []);

  const handleReset = () => {
    setSoilData(null);
    setCalculationResult(null);
    setStatus(AnalysisStatus.IDLE);
    setStep('upload');
    setErrorMessage('');
    setSelectedCrop('');
  };

  const handleCropSelection = (crop: string) => {
    setSelectedCrop(crop);
    setStep('config');
  };

  const handleCalculate = (config: CropConfig) => {
    if (!soilData) return;
    
    // Pass removalRates, fertilizers list, AND globalParams to calculation
    const results = calculateFertilization(soilData, config, removalRates, fertilizers, globalParams);
    setCalculationResult(results);
    setStep('results');
  };

  const openSettings = () => {
    if (step !== 'settings') {
      setPreviousStep(step);
      setStep('settings');
      setSettingsTab('rates'); // Default tab
    }
  };

  const closeSettings = () => {
    setStep(previousStep);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 pb-20">
      
      {/* Header with Settings Button */}
      <header className="bg-white border-b border-emerald-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => step !== 'upload' && setStep('upload')}>
              <div className="bg-emerald-600 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AgroAnalista AI</h1>
                <p className="text-xs text-emerald-600 font-medium">Interpretación de Suelos Inteligente</p>
              </div>
            </div>
            <nav className="flex items-center gap-4">
              <button 
                onClick={openSettings}
                className="p-2 text-gray-400 hover:text-emerald-600 transition-colors"
                title="Configuración Agronómica"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        
        {/* Intro Section - Only show on Upload step */}
        {step === 'upload' && (
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-4">
              Optimiza tu cultivo con <span className="text-emerald-600">Inteligencia Artificial</span>
            </h1>
            <p className="text-lg text-gray-600">
              Sube tu análisis de suelo en PDF o imagen. Nuestra IA extraerá los datos y te recomendará 
              las dosis exactas de fertilizantes y enmiendas.
            </p>
          </div>
        )}

        {/* Dynamic Content Area */}
        <div className="transition-all duration-500 ease-in-out">
          
          {/* STEP 1: UPLOAD */}
          {step === 'upload' && status === AnalysisStatus.IDLE && (
            <FileUpload onFileSelect={handleFileSelect} />
          )}

          {/* LOADING STATE */}
          {status === AnalysisStatus.ANALYZING && (
            <div className="max-w-xl mx-auto mt-12 bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Analizando Documento...</h3>
              <p className="text-gray-500">Gemini está leyendo tu reporte de suelo para extraer los nutrientes.</p>
            </div>
          )}

          {/* ERROR STATE */}
          {status === AnalysisStatus.ERROR && (
            <div className="max-w-2xl mx-auto mt-8">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4">
                <div className="bg-red-100 p-2 rounded-full flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-red-800 mb-1">Error en el análisis</h3>
                  <p className="text-red-600 mb-4">{errorMessage}</p>
                  <button 
                    onClick={handleReset}
                    className="text-sm font-semibold text-red-700 hover:text-red-900 underline"
                  >
                    Intentar de nuevo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: REVIEW */}
          {step === 'review' && status === AnalysisStatus.SUCCESS && soilData && (
            <ResultsPreview 
              data={soilData} 
              onReset={handleReset} 
              onContinue={handleCropSelection} 
            />
          )}

          {/* STEP 3: CONFIGURATION */}
          {step === 'config' && (
            <FertilizerConfig 
              selectedCrop={selectedCrop}
              onBack={() => setStep('review')}
              onCalculate={handleCalculate}
            />
          )}

          {/* STEP 4: RESULTS */}
          {step === 'results' && calculationResult && (
            <CalculationResults 
              result={calculationResult}
              onBack={() => setStep('config')}
              onReset={handleReset}
            />
          )}

          {/* SETTINGS VIEW */}
          {step === 'settings' && (
            <div className="max-w-6xl mx-auto mt-4">
               {/* Tab Navigation */}
               <div className="flex gap-2 justify-center mb-6">
                  <button
                    onClick={() => setSettingsTab('rates')}
                    className={`px-6 py-2 rounded-full font-medium text-sm transition-all ${
                        settingsTab === 'rates' 
                        ? 'bg-emerald-600 text-white shadow-md' 
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Configuración Agronómica
                  </button>
                  <button
                    onClick={() => setSettingsTab('fertilizers')}
                    className={`px-6 py-2 rounded-full font-medium text-sm transition-all ${
                        settingsTab === 'fertilizers' 
                        ? 'bg-emerald-600 text-white shadow-md' 
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Catálogo de Fertilizantes
                  </button>
               </div>

               {settingsTab === 'rates' ? (
                 <AgronomyEditor 
                    data={removalRates} 
                    globalParams={globalParams}
                    onSave={handleAgronomyUpdate} 
                    onClose={closeSettings} 
                 />
               ) : (
                 <FertilizerManager 
                    fertilizers={fertilizers}
                    onUpdate={handleFertilizersUpdate}
                    onClose={closeSettings}
                 />
               )}
            </div>
          )}

        </div>

        {/* Features / Benefits Section (Only visible on initial screen) */}
        {step === 'upload' && status === AnalysisStatus.IDLE && (
          <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <FeatureCard 
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              title="Lectura Automática"
              description="Olvídate de transcribir datos manualmente. Sube tu PDF y listo."
            />
             <FeatureCard 
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              }
              title="Cálculo Preciso"
              description="Recomendaciones basadas en los requerimientos específicos de N-P-K."
            />
             <FeatureCard 
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
              title="Resultados Instantáneos"
              description="Obtén tu plan de fertilización y encalado en segundos."
            />
          </div>
        )}
      </main>
    </div>
  );
}

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 mb-4">
      {icon}
    </div>
    <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
  </div>
);

export default App;