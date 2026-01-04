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