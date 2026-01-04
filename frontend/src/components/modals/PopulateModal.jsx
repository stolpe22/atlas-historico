import React, { useEffect, useRef } from 'react'; // Adicione useRef
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { Database, Download, Loader2, Ban, Minus, X } from 'lucide-react';

export const PopulateModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  onStop, 
  isLoading, 
  logs = [] // AGORA RECEBE UM ARRAY DE LOGS, NÃO UMA STRING
}) => {
  if (!isOpen) return null;
  
  const [selectedContinents, setSelectedContinents] = React.useState(["América do Sul"]);
  const [range, setRange] = React.useState([1800, 1900]);
  
  // Ref para auto-scroll
  const logsEndRef = useRef(null);

  // Auto-scroll sempre que chegar novo log
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const allContinents = ["América do Sul", "Europa", "América do Norte", "África", "Ásia", "Oceania", "Antártida"];

  const toggleContinent = (c) => {
    if (isLoading) return;
    if (selectedContinents.includes(c)) setSelectedContinents(prev => prev.filter(item => item !== c));
    else setSelectedContinents(prev => [...prev, c]);
  };

  const handleRun = () => {
    if (selectedContinents.length === 0) return;
    onConfirm({ continents: selectedContinents, start_year: range[0], end_year: range[1] });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] relative">
        
        {/* BOTÕES DE CONTROLE */}
        <div className="absolute top-4 right-4 flex gap-2">
            {isLoading && (
                <button onClick={onClose} title="Minimizar" className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition">
                    <Minus size={20} />
                </button>
            )}
            {!isLoading && (
                <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition">
                    <X size={20} />
                </button>
            )}
        </div>

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4 shrink-0 pr-10">
            <div className={`p-2 rounded-full ${isLoading ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-blue-100 text-blue-600'}`}>
              {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Database size={24} />}
            </div>
            <div>
              <h3 className="text-xl font-bold dark:text-white">{isLoading ? 'Extraindo Dados...' : 'Configurar Importação'}</h3>
              {isLoading && <p className="text-xs text-slate-500">Minimize para continuar usando o mapa</p>}
            </div>
        </div>

        {/* BODY - TERMINAL DE LOGS */}
        <div className="space-y-6 overflow-y-auto custom-scrollbar px-1 flex-1 min-h-[200px]">
           {isLoading ? (
             <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs border border-slate-800 shadow-inner h-full max-h-[400px] overflow-y-auto flex flex-col">
                <div className="text-green-500 mb-2 flex items-center gap-2 font-bold sticky top-0 bg-slate-950 pb-2 border-b border-slate-800">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Terminal de Execução
                </div>
                
                {/* LISTA DE LOGS */}
                <div className="flex flex-col gap-1 text-slate-300">
                    {logs.length === 0 && <span className="text-slate-500 italic">Inicializando...</span>}
                    
                    {logs.map((log, index) => (
                        <div key={index} className="break-words border-l-2 border-slate-800 pl-2 hover:bg-slate-900 transition-colors">
                            {log}
                        </div>
                    ))}
                    <div ref={logsEndRef} /> {/* Âncora para scroll */}
                </div>
             </div>
           ) : (
             <>
               {/* CONFIGURAÇÃO (Só aparece se NÃO estiver carregando) */}
               <div>
                  <label className="block text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">Regiões Alvo</label>
                  <div className="flex flex-wrap gap-2">
                      {allContinents.map(c => (
                          <button key={c} onClick={() => toggleContinent(c)} className={`text-xs px-3 py-1.5 rounded-full border transition ${selectedContinents.includes(c) ? 'bg-brand-600 text-white border-brand-600 shadow-sm' : 'border-slate-300 dark:border-slate-600 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                            {c}
                          </button>
                      ))}
                  </div>
               </div>
               <div>
                  <div className="flex justify-between text-sm font-bold text-slate-500 mb-4 bg-slate-100 dark:bg-slate-900 p-2 rounded-lg">
                    <span>De: {range[0]}</span><span>Até: {range[1]}</span>
                  </div>
                  <div className="px-2"><Slider range min={-4000} max={2025} value={range} onChange={setRange} trackStyle={[{ backgroundColor: '#2563eb' }]} handleStyle={[{ borderColor: '#2563eb', backgroundColor: '#fff', opacity: 1 }, { borderColor: '#2563eb', backgroundColor: '#fff', opacity: 1 }]} railStyle={{ backgroundColor: '#cbd5e1' }} /></div>
               </div>
             </>
           )}
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 mt-8 shrink-0 pt-4 border-t border-slate-100 dark:border-slate-700">
            {isLoading ? (
              <button onClick={onStop} className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold shadow-lg shadow-red-500/20 transition flex items-center justify-center gap-2">
                <Ban size={20} /> PARAR AGORA
              </button>
            ) : (
              <>
                <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition">Cancelar</button>
                <button onClick={handleRun} disabled={selectedContinents.length === 0} className={`px-6 py-2 rounded-lg font-bold shadow-lg transition flex items-center gap-2 ${selectedContinents.length === 0 ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20'}`}>
                  <Download size={18} /> Iniciar Extração
                </button>
              </>
            )}
        </div>
      </div>
    </div>
  );
};