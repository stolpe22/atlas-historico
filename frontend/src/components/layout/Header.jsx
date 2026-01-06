import React from 'react';
import Slider from 'rc-slider';
import { Search, Globe, Clock, Layers } from 'lucide-react';
import { DATE_RANGE_LIMITS } from '../../utils/constants';

const Header = ({ 
  searchTerm, setSearchTerm, 
  selectedContinent, setSelectedContinent, 
  selectedPeriod, setSelectedPeriod,
  selectedSource, setSelectedSource,
  availableFilters,
  dateRange, setDateRange, 
  filteredCount 
}) => {
  
  const selectClass = "bg-slate-100 dark:bg-slate-700 border-none rounded-lg px-3 py-2 text-xs font-bold outline-none cursor-pointer text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all";

  return (
    <header className="h-20 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-col px-6 shadow-sm z-10 justify-center gap-2">
      
      {/* Linha Superior: Filtros */}
      <div className="flex items-center gap-4">
        
        {/* Search */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg flex-1 max-w-xs">
          <Search size={16} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Pesquisar evento..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="bg-transparent border-none outline-none text-sm w-full text-slate-700 dark:text-slate-200 placeholder-slate-400"
          />
        </div>

        {/* Filtros Dropdown */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Globe size={14} className="text-slate-400" />
            <select value={selectedContinent} onChange={e => setSelectedContinent(e.target.value)} className={selectClass}>
              <option value="Todos">Todos Continentes</option>
              {availableFilters.continents?.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <Clock size={14} className="text-slate-400" />
            <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)} className={selectClass}>
              <option value="Todos">Todos Períodos</option>
              {availableFilters.periods?.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <Layers size={14} className="text-slate-400" />
            <select value={selectedSource} onChange={e => setSelectedSource(e.target.value)} className={selectClass}>
              <option value="Todos">Todas Fontes</option>
              {availableFilters.sources?.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>
          </div>
        </div>

        {/* Contador */}
        <div className="ml-auto flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800">
          <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase">
            {filteredCount} Eventos
          </span>
        </div>
      </div>

      {/* Linha Inferior: Timeline Slider */}
      <div className="flex items-center gap-6 px-2">
        <span className="text-[10px] font-black text-slate-400 w-12 text-right">
          {dateRange[0] < 0 ? `${Math.abs(dateRange[0])} a.C.` : dateRange[0]}
        </span>
        
        <div className="flex-1 px-2">
          <Slider 
            range 
            min={DATE_RANGE_LIMITS.min} 
            max={DATE_RANGE_LIMITS.max} 
            value={dateRange} 
            onChange={setDateRange}
            trackStyle={[{ backgroundColor: '#2563eb', height: 4 }]}
            handleStyle={[
              { borderColor: '#2563eb', backgroundColor: '#fff', opacity: 1, boxShadow: 'none' },
              { borderColor: '#2563eb', backgroundColor: '#fff', opacity: 1, boxShadow: 'none' }
            ]}
            railStyle={{ backgroundColor: '#e2e8f0', height: 4 }}
          />
        </div>
        
        <span className="text-[10px] font-black text-slate-400 w-12">
          {dateRange[1]}
        </span>
      </div>
    </header>
  );
};

export default Header;