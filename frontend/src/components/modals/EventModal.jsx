import React from 'react';
import { MapPin, Calendar } from 'lucide-react';

// Função auxiliar robusta para formatar o ano
const formatYear = (data) => {
    // Tenta pegar year_start ou year
    let y = data.year_start;
    if (y === undefined || y === null) y = data.year;

    if (y === undefined || y === null || y === "") return 'Data desc.';
    
    const num = parseInt(y);
    if (isNaN(num)) return 'Data desc.';
    
    return num < 0 ? `${Math.abs(num)} a.C.` : `${num}`;
};

const EventModal = ({ isOpen, onClose, mode, eventData, newEvent, setNewEvent, onSave, onPickFromMap, continents }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={onClose}>
       <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
          
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {mode === 'view' ? 'Detalhes Históricos' : 'Novo Registro'}
             </h2>
             <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition">✕</button>
          </div>
          
          {mode === 'view' && eventData ? (
            <div className="space-y-5">
               {/* CABEÇALHO COM NOME E DATA CORRIGIDA */}
               <div className="border-b border-slate-100 dark:border-slate-700 pb-5">
                  <div className="flex items-start justify-between gap-4">
                      <h1 className="text-3xl font-black text-brand-600 dark:text-brand-400 leading-tight">
                        {eventData.name}
                      </h1>
                      
                      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0">
                        <Calendar size={16} className="text-slate-500 dark:text-slate-400"/>
                        <span className="font-mono text-lg font-bold text-slate-700 dark:text-slate-200">
                            {formatYear(eventData)}
                        </span>
                      </div>
                  </div>
               </div>

               {/* GRID DE DETALHES */}
               <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                    <span className="block text-xs text-slate-400 uppercase mb-1 font-bold">Período</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{eventData.period}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                    <span className="block text-xs text-slate-400 uppercase mb-1 font-bold">Continente</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{eventData.continent}</span>
                  </div>
               </div>

               {/* DESCRIÇÃO CURTA */}
               <div>
                 <h3 className="text-sm font-bold text-slate-500 uppercase mb-1">Resumo</h3>
                 <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
                    {eventData.description}
                 </p>
               </div>

               {/* CONTEÚDO (SIMPLIFICADO COMO PEDIDO) */}
               {eventData.content && (
                 <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-h-60 overflow-y-auto pr-2 custom-scrollbar text-justify">
                        {eventData.content}
                    </div>
                 </div>
               )}
            </div>
          ) : (
            // --- MODO DE CADASTRO (MANTIDO IGUAL) ---
            <div className="space-y-4">
               <div><label className="block text-sm font-medium mb-1">Nome</label><input type="text" className="w-full p-2 rounded border dark:bg-slate-700 dark:border-slate-600" value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} /></div>
               <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Ano (Use negativo para a.C.)</label><input type="number" className="w-full p-2 rounded border dark:bg-slate-700 dark:border-slate-600" value={newEvent.year_start} onChange={e => setNewEvent({...newEvent, year_start: e.target.value})} /></div>
                  <div><label className="block text-sm font-medium mb-1">Continente</label>
                    <select className="w-full p-2 rounded border dark:bg-slate-700 dark:border-slate-600" value={newEvent.continent} onChange={e => setNewEvent({...newEvent, continent: e.target.value})}>
                         {continents.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
               </div>
               <div><label className="block text-sm font-medium mb-1">Descrição Curta</label><input type="text" className="w-full p-2 rounded border dark:bg-slate-700 dark:border-slate-600" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} /></div>
               <div><label className="block text-sm font-medium mb-1">Resumo / História Completa</label><textarea rows="6" className="w-full p-2 rounded border dark:bg-slate-700 dark:border-slate-600" value={newEvent.content} onChange={e => setNewEvent({...newEvent, content: e.target.value})}></textarea></div>
               
               <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                  <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-bold text-slate-500">Localização Geográfica</span>
                      <button onClick={onPickFromMap} className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded hover:bg-brand-200 flex items-center gap-1">
                         <MapPin size={12}/> Selecionar no Mapa
                      </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                      <div><label>Latitude</label><input type="number" step="any" className="w-full p-1 rounded border" value={newEvent.latitude} onChange={e => setNewEvent({...newEvent, latitude: e.target.value})} /></div>
                      <div><label>Longitude</label><input type="number" step="any" className="w-full p-1 rounded border" value={newEvent.longitude} onChange={e => setNewEvent({...newEvent, longitude: e.target.value})} /></div>
                  </div>
               </div>

               <button onClick={onSave} className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold shadow-lg shadow-brand-500/30 transition">💾 Salvar Registro</button>
            </div>
          )}
       </div>
    </div>
  );
};

export default EventModal;