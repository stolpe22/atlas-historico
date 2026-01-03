import React from 'react';
import { List, Trash2, Database, Globe, User } from 'lucide-react'; // Ícones para as origens

const ListView = ({ events, onViewDetails, onDelete }) => {
  
  // Função para renderizar o badge de origem
  const renderSourceBadge = (source) => {
    switch(source) {
      case 'manual':
        return <span className="flex items-center gap-1 bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full border border-green-200 font-bold" title="Inserido Manualmente"><User size={10}/> Manual</span>;
      case 'seed':
        return <span className="flex items-center gap-1 bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full border border-purple-200 font-bold" title="Dado Curado (Fixo)"><Database size={10}/> Fixo</span>;
      case 'wikidata':
        return <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full border border-blue-200 font-bold" title="Importado da Wikidata"><Globe size={10}/> Wiki</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-8 h-full overflow-auto bg-slate-50 dark:bg-slate-900">
      <div className="max-w-5xl mx-auto">
        
        {/* TÍTULO DA SEÇÃO */}
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
           <List className="text-slate-500" /> 
           Catálogo Histórico 
           <span className="bg-brand-100 text-brand-700 text-xs px-2 py-1 rounded-full border border-brand-200">
             {events.length}
           </span>
        </h2>

        {/* TABELA */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
           <table className="w-full text-left border-collapse">
             <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
               <tr>
                 <th className="p-4 border-b border-slate-200 dark:border-slate-700">Ano</th>
                 <th className="p-4 border-b border-slate-200 dark:border-slate-700">Evento</th>
                 <th className="p-4 border-b border-slate-200 dark:border-slate-700">Período</th>
                 <th className="p-4 border-b border-slate-200 dark:border-slate-700">Continente</th>
                 <th className="p-4 border-b border-slate-200 dark:border-slate-700">Ação</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
               {events.map(evt => (
                 <tr key={evt.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                   <td className="p-4 font-mono text-brand-600 dark:text-brand-400 font-bold whitespace-nowrap">
                     {evt.year_start < 0 ? `${Math.abs(evt.year_start)} a.C.` : evt.year_start}
                   </td>
                   
                   <td className="p-4 font-medium text-slate-700 dark:text-slate-200">
                       <div className="flex flex-col gap-1">
                           <span>{evt.name}</span>
                           {/* AQUI ENTRA O BADGE NOVO */}
                           <div className="w-fit">
                               {renderSourceBadge(evt.source)}
                           </div>
                       </div>
                   </td>
                   
                   <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{evt.period}</td>
                   
                   <td className="p-4">
                     <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide">
                       {evt.continent}
                     </span>
                   </td>

                   <td className="p-4 flex items-center gap-3">
                     <button onClick={() => onViewDetails(evt)} className="text-sm text-brand-600 hover:underline font-semibold">Ver detalhes</button>

                     {/* SÓ PODE DELETAR SE A FONTE FOR 'manual' */}
                     {evt.source === 'manual' && (
                       <button onClick={(e) => { e.stopPropagation(); onDelete(evt); }} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition" title="Apagar Registro">
                         <Trash2 size={18} />
                       </button>
                     )}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default ListView;