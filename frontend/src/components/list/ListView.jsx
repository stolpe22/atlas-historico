import React from 'react';
import { List, Trash2 } from 'lucide-react';

const ListView = ({ events, onViewDetails, onDelete }) => {
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
                   {/* ANO */}
                   <td className="p-4 font-mono text-brand-600 dark:text-brand-400 font-bold whitespace-nowrap">
                     {evt.year_start < 0 ? `${Math.abs(evt.year_start)} a.C.` : evt.year_start}
                   </td>
                   
                   {/* NOME + BADGE MANUAL */}
                   <td className="p-4 font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                       {evt.name}
                       {evt.is_manual && (
                         <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" title="Inserido Manualmente"></span>
                       )}
                   </td>
                   
                   {/* PERÍODO */}
                   <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{evt.period}</td>
                   
                   {/* CONTINENTE */}
                   <td className="p-4">
                     <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide">
                       {evt.continent}
                     </span>
                   </td>

                   {/* AÇÕES */}
                   <td className="p-4 flex items-center gap-3">
                     <button 
                       onClick={() => onViewDetails(evt)} 
                       className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-semibold hover:underline"
                     >
                       Ver detalhes
                     </button>

                     {evt.is_manual && (
                       <button 
                         onClick={(e) => { 
                           e.stopPropagation(); 
                           onDelete(evt); 
                         }} 
                         className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition"
                         title="Apagar Registro"
                       >
                         <Trash2 size={18} />
                       </button>
                     )}
                   </td>
                 </tr>
               ))}
               
               {events.length === 0 && (
                 <tr>
                   <td colSpan="5" className="p-8 text-center text-slate-400 italic">
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