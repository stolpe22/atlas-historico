import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

const NOTIFICATION_CONFIG = {
  success: { 
    icon: CheckCircle, 
    color: "text-green-500", 
    bg: "bg-green-100 dark:bg-green-900/30", 
    btn: "bg-green-600 hover:bg-green-700" 
  },
  error: { 
    icon: XCircle, 
    color: "text-red-500", 
    bg:  "bg-red-100 dark:bg-red-900/30", 
    btn: "bg-red-600 hover:bg-red-700" 
  },
  warning:  { 
    icon: AlertTriangle, 
    color:  "text-amber-500", 
    bg: "bg-amber-100 dark:bg-amber-900/30", 
    btn:  "bg-amber-600 hover:bg-amber-700" 
  },
  info: { 
    icon: Info, 
    color: "text-blue-500", 
    bg: "bg-blue-100 dark:bg-blue-900/30", 
    btn:  "bg-brand-600 hover: bg-brand-700" 
  }
};

const NotificationModal = ({ notification, onClose }) => {
  if (!notification) return null;

  const { type, title, message } = notification;
  const config = NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG.info;
  const Icon = config.icon;

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <div className={`flex items-center gap-4 mb-4 ${config.color}`}>
          <div className={`p-3 rounded-full ${config.bg}`}>
            <Icon size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark: text-white">
            {title}
          </h3>
        </div>
        
        <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
          {message}
        </p>
        
        <div className="flex justify-end">
          <button 
            onClick={onClose} 
            className={`px-6 py-2.5 rounded-lg text-white font-bold shadow-lg transition ${config.btn}`}
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;