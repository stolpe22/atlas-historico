import React, { useState, useEffect, useRef } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { AlertTriangle, CheckCircle, Info, XCircle, Database, Download, Loader2, Ban, Minus, X, Terminal } from 'lucide-react';

// --- MODAL DE CONFIRMAÇÃO (MANTIDO IGUAL) ---
export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 transform scale-100 transition-all">
        <div className="flex items-center gap-4 mb-4 text-red-500">
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full"><AlertTriangle size={28} /></div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h3>
        </div>
        <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition">Cancelar</button>
          <button onClick={onConfirm} className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-500/30 transition">Sim, apagar</button>
        </div>
      </div>
    </div>
  );
};

// --- MODAL DE NOTIFICAÇÃO (MANTIDO IGUAL) ---
export const NotificationModal = ({ notification, onClose }) => {
  if (!notification) return null;
  const { type, title, message } = notification;
  const config = {
    success: { icon: <CheckCircle size={28} />, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30", btn: "bg-green-600 hover:bg-green-700" },
    error:   { icon: <XCircle size={28} />,     color: "text-red-500",   bg: "bg-red-100 dark:bg-red-900/30",     btn: "bg-red-600 hover:bg-red-700" },
    warning: { icon: <AlertTriangle size={28} />, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/30", btn: "bg-amber-600 hover:bg-amber-700" },
    info:    { icon: <Info size={28} />,        color: "text-blue-500",  bg: "bg-blue-100 dark:bg-blue-900/30",   btn: "bg-brand-600 hover:bg-brand-700" }
  };
  const style = config[type] || config.info;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
        <div className={`flex items-center gap-4 mb-4 ${style.color}`}>
          <div className={`p-3 rounded-full ${style.bg}`}>{style.icon}</div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h3>
        </div>
        <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end">
          <button onClick={onClose} className={`px-6 py-2.5 rounded-lg text-white font-bold shadow-lg transition ${style.btn}`}>Entendi</button>
        </div>
      </div>
    </div>
  );
};

// --- MODAL DE POPULAÇÃO (TOTALMENTE REFATORADO) ---
export const PopulateModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  onStop, 
  isLoading, 
  logs = [] // Agora recebe um array de logs
}) => {
  if (!isOpen) return null;
  
  const [selectedContinents, setSelectedContinents] = useState(["América do Sul"]);
  const [range, setRange] = useState([1800, 1900]);
  
  // Ref para rolar o terminal para baixo automaticamente
  const logsEndRef = useRef(null);

  useEffect(() => {
    // Sempre que chegar um log novo, rola para o fim
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
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] relative transition-all">
        
        {/* BOTÕES DE CONTROLE (MINIMIZAR / FECHAR) */}
        <div className="absolute top-4 right-4 flex gap-2 z-10">
            {isLoading && (
                <button 
                    onClick={onClose} // Fecha o modal, mas o App.js mantém o robô rodando (minimiza)
                    title="Minimizar para segundo plano"
                    className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition"
                >
                    <Minus size={20} />
                </button>
            )}
            {!isLoading && (
                <button 
                    onClick={onClose} 
                    className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition"
                >
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
              <h3 className="text-xl font-bold dark:text-white">
                {isLoading ? 'Extraindo Dados...' : 'Configurar Importação'}
              </h3>
              {isLoading && <p className="text-xs text-slate-500">Minimize para usar o mapa</p>}
            </div>
        </div>

        {/* BODY */}
        <div className="space-y-6 overflow-y-auto custom-scrollbar px-1 flex-1 min-h-[200px]">
           {isLoading ? (
             // --- MODO TERMINAL (RODANDO) ---
             <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs border border-slate-800 shadow-inner h-full max-h-[350px] overflow-y-auto flex flex-col">
                <div className="text-green-500 mb-2 flex items-center gap-2 font-bold sticky top-0 bg-slate-950 pb-2 border-b border-slate-800 z-10">
                  <Terminal size={14} />
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Console de Execução
                </div>
                
                <div className="flex flex-col gap-1.5 text-slate-300">
                    {logs.length === 0 && <span className="text-slate-500 italic">Inicializando conexão...</span>}
                    
                    {logs.map((log, index) => (
                        <div key={index} className="break-words border-l-2 border-slate-800 pl-2 hover:bg-slate-900 transition-colors animate-in slide-in-from-left-2 duration-300">
                            {log}
                        </div>
                    ))}
                    <div ref={logsEndRef} /> {/* Âncora para scroll */}
                </div>
             </div>
           ) : (
             // --- MODO CONFIGURAÇÃO (PARADO) ---
             <>
               <div>
                  <label className="block text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">Regiões Alvo</label>
                  <div className="flex flex-wrap gap-2">
                      {allContinents.map(c => (
                          <button 
                            key={c} 
                            onClick={() => toggleContinent(c)} 
                            className={`text-xs px-3 py-1.5 rounded-full border transition 
                              ${selectedContinents.includes(c) 
                                ? 'bg-brand-600 text-white border-brand-600 shadow-sm' 
                                : 'border-slate-300 dark:border-slate-600 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                              }`}
                          >
                            {c}
                          </button>
                      ))}
                  </div>
               </div>

               <div>
                  <div className="flex justify-between text-sm font-bold text-slate-500 mb-4 bg-slate-100 dark:bg-slate-900 p-2 rounded-lg">
                    <span>De: {range[0]}</span>
                    <span>Até: {range[1]}</span>
                  </div>
                  <div className="px-2">
                    <Slider 
                      range 
                      min={-4000} 
                      max={2025} 
                      value={range} 
                      onChange={setRange} 
                      trackStyle={[{ backgroundColor: '#2563eb' }]} 
                      handleStyle={[
                        { borderColor: '#2563eb', backgroundColor: '#fff', opacity: 1, boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.2)' }, 
                        { borderColor: '#2563eb', backgroundColor: '#fff', opacity: 1, boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.2)' }
                      ]} 
                      railStyle={{ backgroundColor: '#cbd5e1' }}
                    />
                  </div>
               </div>
             </>
           )}
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 mt-8 shrink-0 pt-4 border-t border-slate-100 dark:border-slate-700">
            {isLoading ? (
              <button 
                onClick={onStop} 
                className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold shadow-lg shadow-red-500/20 transition flex items-center justify-center gap-2 active:scale-95"
              >
                <Ban size={20} /> PARAR EXTRAÇÃO
              </button>
            ) : (
              <>
                <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition">
                  Cancelar
                </button>
                <button 
                  onClick={handleRun} 
                  disabled={selectedContinents.length === 0}
                  className={`px-6 py-2 rounded-lg font-bold shadow-lg transition flex items-center gap-2
                    ${selectedContinents.length === 0 
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                      : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20 active:scale-95'
                    }`}
                >
                  <Download size={18} /> Iniciar Extração
                </button>
              </>
            )}
        </div>
      </div>
    </div>
  );
};