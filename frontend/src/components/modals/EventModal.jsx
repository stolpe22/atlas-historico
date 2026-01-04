import React from 'react';
import { MapPin, Calendar } from 'lucide-react';
import { formatYear } from '../../utils/formatters';

// ============================================================================
// VIEW MODE COMPONENT
// ============================================================================
const EventViewMode = ({ eventData }) => (
  <div className="space-y-5">
    {/* Header */}
    <div className="border-b border-slate-100 dark:border-slate-700 pb-5">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-3xl font-black text-brand-600 dark:text-brand-400 leading-tight">
          {eventData.name}
        </h1>
        
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0">
          <Calendar size={16} className="text-slate-500 dark:text-slate-400" />
          <span className="font-mono text-lg font-bold text-slate-700 dark:text-slate-200">
            {formatYear(eventData.year_start || eventData.year)}
          </span>
        </div>
      </div>
    </div>

    {/* Details Grid */}
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
        <span className="block text-xs text-slate-400 uppercase mb-1 font-bold">Período</span>
        <span className="font-semibold text-slate-700 dark:text-slate-200">{eventData.period}</span>
      </div>
      <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark: border-slate-700">
        <span className="block text-xs text-slate-400 uppercase mb-1 font-bold">Continente</span>
        <span className="font-semibold text-slate-700 dark:text-slate-200">{eventData.continent}</span>
      </div>
    </div>

    {/* Description */}
    <div>
      <h3 className="text-sm font-bold text-slate-500 uppercase mb-1">Resumo</h3>
      <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
        {eventData.description}
      </p>
    </div>

    {/* Content */}
    {eventData.content && (
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
        <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-h-60 overflow-y-auto pr-2 custom-scrollbar text-justify">
          {eventData.content}
        </div>
      </div>
    )}
  </div>
);

// ============================================================================
// CREATE MODE COMPONENT
// ============================================================================
const EventCreateMode = ({ 
  newEvent, 
  setNewEvent, 
  onSave, 
  onPickFromMap, 
  continents 
}) => {
  const updateField = (field, value) => {
    setNewEvent(prev => ({ ...prev, [field]: value }));
  };

  const inputClasses = "w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus: ring-brand-500 outline-none transition";
  const labelClasses = "block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300";

  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className={labelClasses}>Nome</label>
        <input 
          type="text" 
          className={inputClasses}
          value={newEvent.name} 
          onChange={e => updateField('name', e.target.value)} 
        />
      </div>
      
      {/* Year and Continent */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>Ano (Use negativo para a.C.)</label>
          <input 
            type="number" 
            className={`${inputClasses} dark:[color-scheme: dark]`}
            value={newEvent.year_start} 
            onChange={e => updateField('year_start', e.target.value)} 
          />
        </div>
        <div>
          <label className={labelClasses}>Continente</label>
          <select 
            className={inputClasses}
            value={newEvent.continent} 
            onChange={e => updateField('continent', e.target.value)}
          >
            {continents.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Description */}
      <div>
        <label className={labelClasses}>Descrição Curta</label>
        <input 
          type="text" 
          className={inputClasses}
          value={newEvent.description} 
          onChange={e => updateField('description', e.target.value)} 
        />
      </div>
      
      {/* Content */}
      <div>
        <label className={labelClasses}>Resumo / História Completa</label>
        <textarea 
          rows="6" 
          className={`${inputClasses} resize-none custom-scrollbar`}
          value={newEvent.content} 
          onChange={e => updateField('content', e.target.value)}
        />
      </div>
      
      {/* Location */}
      <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
            Localização Geográfica
          </span>
          <button 
            onClick={onPickFromMap} 
            className="text-xs bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 px-2 py-1 rounded hover:bg-brand-200 dark:hover: bg-brand-900/60 flex items-center gap-1 transition"
          >
            <MapPin size={12} /> Selecionar no Mapa
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-600 dark: text-slate-400 block mb-1">Latitude</label>
            <input 
              type="number" 
              step="any" 
              className={`${inputClasses} dark:[color-scheme:dark]`}
              value={newEvent.latitude} 
              onChange={e => updateField('latitude', e.target.value)} 
            />
          </div>
          <div>
            <label className="text-slate-600 dark:text-slate-400 block mb-1">Longitude</label>
            <input 
              type="number" 
              step="any" 
              className={`${inputClasses} dark:[color-scheme:dark]`}
              value={newEvent.longitude} 
              onChange={e => updateField('longitude', e.target.value)} 
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button 
        onClick={onSave} 
        className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold shadow-lg shadow-brand-500/30 transition transform active:scale-[0.98]"
      >
        💾 Salvar Registro
      </button>
    </div>
  );
};

// ============================================================================
// MAIN MODAL COMPONENT
// ============================================================================
const EventModal = ({ 
  isOpen, 
  onClose, 
  mode, 
  eventData, 
  newEvent, 
  setNewEvent, 
  onSave, 
  onPickFromMap, 
  continents 
}) => {
  if (! isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            {mode === 'view' ? 'Detalhes Históricos' : 'Novo Registro'}
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition text-slate-500 dark:text-slate-400"
          >
            ✕
          </button>
        </div>
        
        {/* Content */}
        {mode === 'view' && eventData ?  (
          <EventViewMode eventData={eventData} />
        ) : (
          <EventCreateMode 
            newEvent={newEvent}
            setNewEvent={setNewEvent}
            onSave={onSave}
            onPickFromMap={onPickFromMap}
            continents={continents}
          />
        )}
      </div>
    </div>
  );
};

export default EventModal;