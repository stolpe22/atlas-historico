import React from 'react';
import { List, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import SourceBadge from '../common/SourceBadge';
import { formatYearRange } from '../../utils/formatters';

const ListView = ({ events, onViewDetails, onDelete, onSort, sortConfig }) => {
  
  // Helper para renderizar o ícone de ordenação
  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown size={14} className="opacity-30 group-hover:opacity-100 transition-opacity" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} className="text-blue-500" /> 
      : <ArrowDown size={14} className="text-blue-500" />;
  };

  const thClass = "p-4 border-b border-slate-200 dark:border-slate-700 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors";

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50 dark:bg-slate-900 p-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        
        {/* Header da View */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <List className="text-blue-600 dark:text-blue-400" size={24} /> 
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white leading-none">
              Catálogo Histórico
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Gerencie e ordene todos os eventos registrados
            </p>
          </div>
          
          <div className="ml-auto flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full border border-blue-100 dark:border-blue-800">
             <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total:</span>
             <span className="text-lg font-black text-blue-700 dark:text-blue-300 leading-none">
                {events.length}
             </span>
          </div>
        </div>

        {/* Tabela de Eventos */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold tracking-wider">
              <tr>
                <th onClick={() => onSort('year_start')} className={`${thClass} w-32`}>
                  <div className="flex items-center gap-2">
                    Ano {renderSortIcon('year_start')}
                  </div>
                </th>
                
                <th onClick={() => onSort('name')} className={thClass}>
                  <div className="flex items-center gap-2">
                    Evento {renderSortIcon('name')}
                  </div>
                </th>
                
                <th onClick={() => onSort('period')} className={`${thClass} w-48`}>
                  <div className="flex items-center gap-2">
                    Período {renderSortIcon('period')}
                  </div>
                </th>
                
                <th onClick={() => onSort('continent')} className={`${thClass} w-40`}>
                  <div className="flex items-center gap-2">
                    Continente {renderSortIcon('continent')}
                  </div>
                </th>
                
                <th className="p-4 border-b border-slate-200 dark:border-slate-700 w-32 text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {events.map(evt => (
                <tr 
                  key={evt.id} 
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition duration-150"
                >
                  {/* Coluna: Ano */}
                  <td className="p-4 font-mono text-blue-600 dark:text-blue-400 font-bold whitespace-nowrap">
                    {formatYearRange(evt.year_start, evt.year_end)}
                  </td>
                  
                  {/* Coluna: Nome e Fonte */}
                  <td className="p-4 font-medium text-slate-700 dark:text-slate-200">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-base font-bold">{evt.name}</span>
                      <div className="w-fit">
                        <SourceBadge source={evt.source} />
                      </div>
                    </div>
                  </td>
                  
                  {/* Coluna: Período */}
                  <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                    <span className="inline-block bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded text-xs font-medium">
                      {evt.period}
                    </span>
                  </td>
                  
                  {/* Coluna: Continente */}
                  <td className="p-4">
                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-600">
                      {evt.continent || 'N/A'}
                    </span>
                  </td>

                  {/* Coluna: Botões de Ação */}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => onViewDetails(evt)} 
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline px-2 py-1"
                      >
                        Detalhes
                      </button>

                      {evt.source === 'manual' && (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            onDelete(evt); 
                          }} 
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                          title="Apagar Registro"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              
              {/* Empty State */}
              {events.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <List size={48} className="opacity-20 mb-2" />
                      <p className="font-medium">Nenhum evento encontrado.</p>
                      <p className="text-xs">Tente ajustar seus filtros ou busca.</p>
                    </div>
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