import React, { useState, useRef } from 'react';
import { Fertilizer, FertilizerType } from '../types';

interface FertilizerManagerProps {
  fertilizers: Fertilizer[];
  onUpdate: (updatedList: Fertilizer[]) => void;
  onClose: () => void;
}

const INITIAL_FERT_STATE: Partial<Fertilizer> = {
  name: '',
  price: 0,
  bagWeight: 100,
  type: 'specialized',
  imageUrl: '',
  n: 0, p: 0, k: 0,
  s: 0, ca: 0, mg: 0,
  zn: 0, b: 0, fe: 0, mn: 0, cu: 0
};

export const FertilizerManager: React.FC<FertilizerManagerProps> = ({ fertilizers, onUpdate, onClose }) => {
  const [newFert, setNewFert] = useState<Partial<Fertilizer>>(INITIAL_FERT_STATE);
  const [showMicros, setShowMicros] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof Fertilizer, value: string | number) => {
    setNewFert(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Helper para comprimir imágenes y evitar llenar el LocalStorage
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Reducir a un máximo de 200px (suficiente para thumbnails)
                const MAX_SIZE = 200;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                // Convertir a JPEG de baja calidad para ahorrar espacio
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
  };

  // Manejo de carga de imagen optimizada
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        setNewFert(prev => ({ ...prev, imageUrl: compressedBase64 }));
      } catch (error) {
        console.error("Error comprimiendo imagen", error);
        alert("No se pudo procesar la imagen.");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFert.name) return;

    const fertilizerData: Fertilizer = {
      id: editingId || Date.now().toString(), // Use existing ID if editing
      name: newFert.name,
      type: (newFert.type as FertilizerType) || 'specialized',
      price: Number(newFert.price),
      bagWeight: Number(newFert.bagWeight),
      imageUrl: newFert.imageUrl,
      n: Number(newFert.n),
      p: Number(newFert.p),
      k: Number(newFert.k),
      s: Number(newFert.s || 0),
      ca: Number(newFert.ca || 0),
      mg: Number(newFert.mg || 0),
      zn: Number(newFert.zn || 0),
      b: Number(newFert.b || 0),
      fe: Number(newFert.fe || 0),
      mn: Number(newFert.mn || 0),
      cu: Number(newFert.cu || 0),
    };

    if (editingId) {
        // Update existing
        onUpdate(fertilizers.map(f => f.id === editingId ? fertilizerData : f));
        setEditingId(null);
    } else {
        // Create new
        onUpdate([...fertilizers, fertilizerData]);
    }

    setNewFert(INITIAL_FERT_STATE);
    setShowMicros(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEdit = (fert: Fertilizer) => {
    setNewFert(fert);
    setEditingId(fert.id);
    
    // Check if we should auto-expand micros section based on data
    const hasMicros = (fert.s || 0) > 0 || (fert.ca || 0) > 0 || (fert.mg || 0) > 0 || 
                      (fert.zn || 0) > 0 || (fert.b || 0) > 0 || (fert.fe || 0) > 0 || 
                      (fert.mn || 0) > 0 || (fert.cu || 0) > 0;
    setShowMicros(hasMicros);
  };

  const handleCancelEdit = () => {
    setNewFert(INITIAL_FERT_STATE);
    setEditingId(null);
    setShowMicros(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este fertilizante?')) {
      onUpdate(fertilizers.filter(f => f.id !== id));
      if (editingId === id) {
        handleCancelEdit();
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 max-w-6xl mx-auto mt-8 animate-fade-in-up">
       <div className="bg-gray-800 px-6 py-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h2 className="text-lg font-bold">Catálogo de Fertilizantes</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 md:p-8 grid lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: LIST (Takes up 7 cols) */}
            <div className="order-2 lg:order-1 lg:col-span-7">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Inventario Actual ({fertilizers.length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-2">
                    {fertilizers.map(fert => (
                        <div 
                            key={fert.id} 
                            className={`border rounded-xl p-3 transition-all cursor-pointer relative group ${editingId === fert.id ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200' : 'border-gray-200 bg-gray-50 hover:border-emerald-300 hover:shadow-md'}`}
                            onClick={() => handleEdit(fert)}
                        >
                            <div className="flex gap-3">
                                {/* Image Thumbnail */}
                                <div className="w-16 h-16 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {fert.imageUrl ? (
                                    <img src={fert.imageUrl} alt={fert.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-gray-300 text-xs text-center p-1">Sin Foto</span>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-gray-800 text-sm truncate pr-4" title={fert.name}>{fert.name}</h4>
                                    </div>
                                    <div className="flex gap-2 mt-1 mb-2">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${fert.type === 'commodity' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                            {fert.type === 'commodity' ? 'Com.' : 'Esp.'}
                                        </span>
                                        <span className="text-xs text-gray-700 font-mono bg-white px-1.5 border rounded">
                                            ${fert.price}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1 text-[10px] text-gray-600 text-center">
                                        <div className="bg-white rounded border border-gray-100">N: {fert.n}%</div>
                                        <div className="bg-white rounded border border-gray-100">P: {fert.p}%</div>
                                        <div className="bg-white rounded border border-gray-100">K: {fert.k}%</div>
                                    </div>
                                </div>
                            </div>

                            {/* Delete Button (Visible on hover or edit) */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(fert.id); }}
                                className="absolute top-2 right-2 text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Eliminar"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT COLUMN: FORM (Takes up 5 cols) */}
            <div className="order-1 lg:order-2 lg:col-span-5 bg-white rounded-xl">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                    {editingId ? 'Editar Producto' : 'Nuevo Producto'}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Image Upload */}
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-lg bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group">
                        {newFert.imageUrl ? (
                           <>
                             <img src={newFert.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                             <button 
                               type="button" 
                               onClick={() => setNewFert(p => ({...p, imageUrl: ''}))}
                               className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs"
                             >X</button>
                           </>
                        ) : (
                          <span className="text-gray-400 text-xs text-center">Foto</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Imagen del Producto</label>
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Se optimizará automáticamente para ahorrar espacio.</p>
                      </div>
                    </div>

                    {/* Basic Info */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Comercial</label>
                            <input 
                                required
                                type="text" 
                                placeholder="Ej. Sulfato de Amonio"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={newFert.name}
                                onChange={e => handleInputChange('name', e.target.value)}
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo</label>
                                <select 
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                                    value={newFert.type}
                                    onChange={e => handleInputChange('type', e.target.value)}
                                >
                                    <option value="commodity">Commodity</option>
                                    <option value="specialized">Especializado</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Precio</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-400">$</span>
                                    <input 
                                        type="number" 
                                        min="0"
                                        className="w-full pl-6 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={newFert.price || ''}
                                        onChange={e => handleInputChange('price', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Peso del Saco (lbs)</label>
                             <input 
                                type="number" 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                value={newFert.bagWeight}
                                onChange={e => handleInputChange('bagWeight', e.target.value)}
                            />
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Macros */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Composición Macronutrientes (%)</label>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-center block text-xs text-blue-600 font-bold mb-1">N</label>
                                <input type="number" placeholder="0" className="w-full text-center p-2 border border-blue-100 bg-blue-50 rounded" 
                                    value={newFert.n || ''} onChange={e => handleInputChange('n', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-center block text-xs text-orange-600 font-bold mb-1">P₂O₅</label>
                                <input type="number" placeholder="0" className="w-full text-center p-2 border border-orange-100 bg-orange-50 rounded" 
                                    value={newFert.p || ''} onChange={e => handleInputChange('p', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-center block text-xs text-purple-600 font-bold mb-1">K₂O</label>
                                <input type="number" placeholder="0" className="w-full text-center p-2 border border-purple-100 bg-purple-50 rounded" 
                                    value={newFert.k || ''} onChange={e => handleInputChange('k', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* Toggle Advanced */}
                    <button 
                        type="button"
                        onClick={() => setShowMicros(!showMicros)}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 underline flex items-center gap-1"
                    >
                        {showMicros ? 'Ocultar Elementos Menores' : 'Agregar Secundarios y Micronutrientes'}
                    </button>

                    {showMicros && (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 animate-fade-in-up">
                            {/* Secondaries */}
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Secundarios (%)</label>
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                {['s', 'ca', 'mg'].map(el => (
                                    <div key={el}>
                                        <label className="block text-xs text-center text-gray-500 uppercase mb-1">{el}</label>
                                        <input type="number" className="w-full text-center p-1.5 border border-gray-200 rounded text-sm" 
                                        // @ts-ignore
                                        value={newFert[el] || ''} onChange={e => handleInputChange(el as keyof Fertilizer, e.target.value)} />
                                    </div>
                                ))}
                            </div>

                            {/* Micros */}
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Micronutrientes (%)</label>
                            <div className="grid grid-cols-5 gap-1">
                                {['zn', 'b', 'fe', 'mn', 'cu'].map(el => (
                                    <div key={el}>
                                        <label className="block text-[10px] text-center text-gray-500 uppercase mb-1">{el}</label>
                                        <input type="number" className="w-full text-center p-1 border border-gray-200 rounded text-xs" 
                                        // @ts-ignore
                                        value={newFert[el] || ''} onChange={e => handleInputChange(el as keyof Fertilizer, e.target.value)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 mt-4">
                        {editingId && (
                            <button 
                                type="button"
                                onClick={handleCancelEdit}
                                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition-all"
                            >
                                Cancelar
                            </button>
                        )}
                        <button 
                            type="submit"
                            className={`flex-1 py-3 text-white font-bold rounded-lg shadow-lg transition-all ${editingId ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}`}
                        >
                            {editingId ? 'Actualizar' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
  );
};