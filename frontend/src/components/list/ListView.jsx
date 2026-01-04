import React from 'react';
import { List, Trash2 } from 'lucide-react';
import SourceBadge from '../common/SourceBadge';
import { formatYearRange } from '../../utils/formatters';

const ListView = ({ events, onViewDetails, onDelete }) => {
  return (
    // CORREÇÃO AQUI: bg-gray-100 para tema claro, dark:bg-slate-900 para escuro
    <div className="h-full w-full overflow-y-auto bg-gray-100 dark:bg-slate-900 p-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        
        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <List className="text-brand-600 dark:text-brand-400" size={24} /> 
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white leading-none">
              Catálogo Histórico
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Gerencie todos os eventos registrados
            </p>
          </div>
          
          <span className="ml-auto bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-sm font-bold px-3 py-1 rounded-full border border-brand-200 dark:border-brand-800">
            {events.length}
          </span>
        </div>

        {/* Table Container */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold tracking-wider">
              <tr>
                <th className="p-4 border-b border-slate-200 dark:border-slate-700 w-32">Ano</th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-700">Evento</th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-700 w-48">Período</th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-700 w-40">Continente</th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-700 w-32 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {events.map(evt => (
                <tr 
                  key={evt.id} 
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition duration-150"
                >
                  <td className="p-4 font-mono text-brand-600 dark:text-brand-400 font-bold whitespace-nowrap">
                    {formatYearRange(evt.year_start, evt.year_end)}
                  </td>
                  
                  <td className="p-4 font-medium text-slate-700 dark:text-slate-200">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-base">{evt.name}</span>
                      <div className="w-fit">
                        <SourceBadge source={evt.source} />
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                    <span className="inline-block bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded text-xs">
                      {evt.period}
                    </span>
                  </td>
                  
                  <td className="p-4">
                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide">
                      {evt.continent}
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => onViewDetails(evt)} 
                        className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline px-2 py-1"
                      >
                        Ver detalhes
                      </button>

                      {evt.source === 'manual' && (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            onDelete(evt); 
                          }} 
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                          title="Apagar Registro"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              
              {events.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-400">
                    Nenhum evento encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ListView;