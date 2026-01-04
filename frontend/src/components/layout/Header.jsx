import React from 'react';
import Slider from 'rc-slider';
import { Search } from 'lucide-react';
import { DATE_RANGE_LIMITS } from '../../utils/constants';

const Header = ({ 
  searchTerm, 
  setSearchTerm, 
  selectedContinent, 
  setSelectedContinent, 
  dateRange, 
  setDateRange, 
  filteredCount, 
  continents 
}) => {
  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-6 gap-6 shadow-sm z-10">
      {/* Search */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg">
        <Search size={18} className="text-slate-400" />
        <input 
          type="text" 
          placeholder="Filtrar..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          className="bg-transparent border-none outline-none text-sm w-48 text-slate-700 dark:text-slate-200 placeholder-slate-400"
        />
      </div>

      {/* Continent Filter - CORRIGIDO */}
      {/* Adicionei 'accent-blue-600' e cores fixas de texto para garantir contraste */}
      <select 
        value={selectedContinent} 
        onChange={e => setSelectedContinent(e.target.value)} 
        className="bg-slate-100 dark:bg-slate-700 border-none rounded-lg px-4 py-2 text-sm font-bold outline-none cursor-pointer text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
      >
        {continents.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {/* Event Counter - CORRIGIDO */}
      {/* Trocado 'brand' por 'blue' para garantir que a cor apareça mesmo se o config falhar */}
      <div className="flex flex-col items-center leading-tight bg-blue-50 dark:bg-slate-900/50 px-3 py-1 rounded border border-blue-100 dark:border-slate-600">
        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
          Exibindo
        </span>
        <span className="text-sm font-black text-blue-600 dark:text-blue-400">
          {filteredCount} eventos
        </span>
      </div>

      {/* Date Range Slider */}
      <div className="flex-1 px-4 flex items-center gap-4">
        <span className="text-xs font-bold text-slate-500 min-w-[50px] text-right">
          {dateRange[0]}
        </span>
        
        <Slider 
          range 
          min={DATE_RANGE_LIMITS.min} 
          max={DATE_RANGE_LIMITS.max} 
          value={dateRange} 
          onChange={setDateRange}
          trackStyle={[{ backgroundColor: '#2563eb' }]}
          handleStyle={[
            { borderColor: '#2563eb', backgroundColor: '#fff', opacity: 1 },
            { borderColor: '#2563eb', backgroundColor: '#fff', opacity: 1 }
          ]}
          railStyle={{ backgroundColor: '#94a3b8' }}
        />
        
        <span className="text-xs font-bold text-slate-500 min-w-[50px]">
          {dateRange[1]}
        </span>
      </div>
    </header>
  );
};

export default Header;