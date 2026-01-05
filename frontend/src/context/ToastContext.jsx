import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext();

// Hook personalizado para usar fácil
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast deve ser usado dentro de um ToastProvider');
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Função disparada pelos componentes
  const addToast = useCallback(({ type = 'info', title, message, duration = 3000 }) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, title, message }]);

    // Auto-remove após X segundos
    if (duration) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Ícones e Cores baseados no tipo
  const styles = {
    success: { icon: CheckCircle, bg: 'bg-green-50 dark:bg-green-900/30', border: 'border-green-200 dark:border-green-800', text: 'text-green-800 dark:text-green-200', iconColor: 'text-green-500' },
    error:   { icon: AlertCircle, bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-800', text: 'text-red-800 dark:text-red-200', iconColor: 'text-red-500' },
    warning: { icon: AlertTriangle, bg: 'bg-yellow-50 dark:bg-yellow-900/30', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-800 dark:text-yellow-200', iconColor: 'text-yellow-500' },
    info:    { icon: Info, bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-800 dark:text-blue-200', iconColor: 'text-blue-500' },
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      
      {/* Container fixo onde os Toasts aparecem (Canto Superior Direito) */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => {
          const style = styles[toast.type] || styles.info;
          const Icon = style.icon;

          return (
            <div 
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 w-80 p-4 rounded-lg shadow-xl border ${style.bg} ${style.border} animate-in slide-in-from-right fade-in duration-300`}
            >
              <Icon className={`flex-shrink-0 mt-0.5 ${style.iconColor}`} size={20} />
              <div className="flex-1">
                {toast.title && <h4 className={`font-bold text-sm ${style.text}`}>{toast.title}</h4>}
                <p className={`text-sm opacity-90 ${style.text}`}>{toast.message}</p>
              </div>
              <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};