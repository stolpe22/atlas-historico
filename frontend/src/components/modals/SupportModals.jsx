import React, { useState } from 'react';
import Slider from 'rc-slider';
import { AlertTriangle, CheckCircle, Info, XCircle, Database, Download } from 'lucide-react';

// --- MODAL DE CONFIRMAÇÃO ---
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

// --- MODAL DE NOTIFICAÇÃO (TOAST) ---
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

// --- MODAL DE CONFIGURAÇÃO DE POPULAÇÃO ---
export const PopulateModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  const [selectedContinents, setSelectedContinents] = useState(["América do Sul", "Europa", "América do Norte", "África", "Ásia"]);
  const [range, setRange] = useState([-3000, 2025]);
  const allContinents = ["América do Sul", "Europa", "América do Norte", "África", "Ásia", "Oceania", "Antártida"];

  const toggleContinent = (c) => {
    if (selectedContinents.includes(c)) setSelectedContinents(prev => prev.filter(item => item !== c));
    else setSelectedContinents(prev => [...prev, c]);
  };

  const handleRun = () => {
    onConfirm({ continents: selectedContinents, start_year: range[0], end_year: range[1] });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full text-blue-600"><Database size={24} /></div>
            <h3 className="text-xl font-bold dark:text-white">Configurar Importação</h3>
        </div>
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">Regiões Alvo</label>
                <div className="flex flex-wrap gap-2">
                    {allContinents.map(c => (
                        <button key={c} onClick={() => toggleContinent(c)} className={`text-xs px-3 py-1.5 rounded-full border transition ${selectedContinents.includes(c) ? 'bg-brand-600 text-white border-brand-600' : 'border-slate-300 dark:border-slate-600 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>{c}</button>
                    ))}
                </div>
            </div>
            <div>
                <div className="flex justify-between text-sm font-bold text-slate-500 mb-2"><span>De: {range[0]}</span><span>Até: {range[1]}</span></div>
                <Slider range min={-4000} max={2025} value={range} onChange={setRange} trackStyle={[{ backgroundColor: '#0ea5e9' }]} handleStyle={[{ borderColor: '#0ea5e9', backgroundColor: '#fff', opacity: 1 }, { borderColor: '#0ea5e9', backgroundColor: '#fff', opacity: 1 }]} />
            </div>
        </div>
        <div className="flex justify-end gap-3 mt-8">
            <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition">Cancelar</button>
            <button onClick={handleRun} className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold shadow-lg shadow-brand-500/20 transition flex items-center gap-2"><Download size={18} /> Iniciar</button>
        </div>
      </div>
    </div>
  );
};