import React from 'react';
import { Trash2, CheckCircle, HelpCircle } from 'lucide-react';

const IntegrationCard = ({ integ, onConnect, onDelete, onHelp }) => {
  return (
    <div className="flex items-center justify-between p-4 border rounded-2xl dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white dark:bg-slate-700 p-2 rounded-xl border dark:border-slate-600 shadow-sm">
          <img src={integ.logo_url} className="w-full h-full object-contain" alt={integ.name} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800 dark:text-white leading-none">
              {integ.name}
            </h3>
            {integ.is_connected && <CheckCircle size={14} className="text-green-500 fill-green-500/10" />}
            <button 
              onClick={() => onHelp(integ.slug)}
              className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
              title="Ajuda e Configuração"
            >
              <HelpCircle size={16} />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{integ.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {integ.is_connected ? (
          <button 
            onClick={() => onDelete({ id: integ.connected_id, name: integ.name })}
            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
            title="Desconectar"
          >
            <Trash2 size={18} />
          </button>
        ) : (
          <button 
            onClick={() => onConnect(integ)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all transform active:scale-95"
          >
            Conectar
          </button>
        )}
      </div>
    </div>
  );
};

export default IntegrationCard;