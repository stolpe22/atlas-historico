import React from 'react';
import Slider from 'rc-slider';
import { Search } from 'lucide-react';

const Header = ({ searchTerm, setSearchTerm, selectedContinent, setSelectedContinent, dateRange, setDateRange, filteredCount, continents }) => {
  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-6 gap-6 shadow-sm z-10">
       <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg">
         <Search size={18} className="text-slate-400"/>
         <input type="text" placeholder="Filtrar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-sm w-48 text-slate-700 dark:text-slate-200 placeholder-slate-400" />
       </div>
       <select value={selectedContinent} onChange={e => setSelectedContinent(e.target.value)} className="bg-slate-100 dark:bg-slate-700 border-none rounded-lg px-4 py-2 text-sm font-medium outline-none cursor-pointer">
         {continents.map(c => <option key={c} value={c}>{c}</option>)}
       </select>

        <div className="flex flex-col items-center leading-tight bg-brand-50 dark:bg-slate-900/50 px-3 py-1 rounded border border-brand-100 dark:border-slate-600">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Exibindo</span>
          <span className="text-sm font-black text-brand-600 dark:text-brand-400">
            {filteredCount} eventos
          </span>
        </div>

       <div className="flex-1 px-4 flex items-center gap-4">
         <span className="text-xs font-bold text-slate-500">{dateRange[0]}</span>
         <Slider range min={-4000} max={2025} value={dateRange} onChange={setDateRange} trackStyle={[{ backgroundColor: '#0ea5e9' }]} handleStyle={[{ borderColor: '#0ea5e9', backgroundColor: '#fff', opacity: 1 }, { borderColor: '#0ea5e9', backgroundColor: '#fff', opacity: 1 }]} railStyle={{ backgroundColor: '#94a3b8' }} />
         <span className="text-xs font-bold text-slate-500">{dateRange[1]}</span>
       </div>
    </header>
  );
};

export default Header;