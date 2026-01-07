import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Calendar, Languages, Loader2, Globe, Lock } from 'lucide-react';
import { formatYearRange } from '../../utils/formatters';
import { translateText } from '../../services/translate';
import { eventsApi } from '../../services/api'; // <--- Importante: API para detecção

// ============================================================================
// VIEW MODE COMPONENT (Mantido igual, apenas renderização)
// ============================================================================
const EventViewMode = ({ eventData }) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translated, setTranslated] = useState(null);
  const [error, setError] = useState(null);
  const [langShown, setLangShown] = useState('original'); // 'original' | 'pt'

  useEffect(() => {
    setIsTranslating(false);
    setTranslated(null);
    setError(null);
    setLangShown('original');
  }, [eventData?.id]);

  const cacheKey = eventData ? `translation:${eventData.id}:pt` : null;

  const handleTranslate = useCallback(async () => {
    if (!eventData) return;
    setError(null);

    if (cacheKey) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setTranslated(JSON.parse(cached));
        setLangShown('pt');
        return;
      }
    }

    try {
      setIsTranslating(true);
      const [namePt, descPt, contentPt] = await Promise.all([
        translateText(eventData.name, 'en', 'pt'),
        translateText(eventData.description, 'en', 'pt'),
        translateText(eventData.content, 'en', 'pt'),
      ]);
      const result = {
        name: namePt || eventData.name,
        description: descPt || eventData.description,
        content: contentPt || eventData.content,
      };
      if (cacheKey) localStorage.setItem(cacheKey, JSON.stringify(result));
      setTranslated(result);
      setLangShown('pt');
    } catch (e) {
      setError('Falha ao traduzir. Tente novamente.');
    } finally {
      setIsTranslating(false);
    }
  }, [eventData, cacheKey]);

  const showOriginal = () => setLangShown('original');
  const showPt = () => {
    if (translated) setLangShown('pt');
    else handleTranslate();
  };

  const currentName =
    langShown === 'pt' && translated ? translated.name : eventData.name;
  const currentDescription =
    langShown === 'pt' && translated ? translated.description : eventData.description;
  const currentContent =
    langShown === 'pt' && translated ? translated.content : eventData.content;

  const translatedIndicator = translated && langShown === 'pt';

  return (
    <div className="space-y-5">
      <div className="border-b border-slate-100 dark:border-slate-700 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black text-brand-600 dark:text-brand-400 leading-tight">
                {currentName}
              </h1>
              {translatedIndicator && (
                <span
                  className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                  title="Conteúdo traduzido"
                >
                  PT
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                {eventData.period}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                {eventData.continent}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-200">
              <Calendar size={14} className="mr-1 text-slate-400" />
              {formatYearRange(eventData.year_start || eventData.year, eventData.year_end)}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={showOriginal}
                className={`px-2 py-1 rounded text-xs font-bold ${
                  langShown === 'original'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200'
                }`}
              >
                Original
              </button>
              <button
                onClick={showPt}
                disabled={isTranslating}
                className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${
                  langShown === 'pt'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                } ${isTranslating ? 'opacity-70 cursor-wait' : ''}`}
              >
                {isTranslating ? <Loader2 className="animate-spin" size={12} /> : <Languages size={12} />}
                PT
              </button>
            </div>
          </div>
        </div>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
          <span className="block text-xs text-slate-400 uppercase mb-1 font-bold">Período</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">{eventData.period}</span>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
          <span className="block text-xs text-slate-400 uppercase mb-1 font-bold">Continente</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">{eventData.continent}</span>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-1">Resumo</h3>
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
          {currentDescription}
        </p>
      </div>

      {currentContent && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-h-60 overflow-y-auto pr-2 custom-scrollbar text-justify">
            {currentContent}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// CREATE MODE COMPONENT (ATUALIZADO PARA INTELIGÊNCIA ESPACIAL) 🧠
// ============================================================================
const EventCreateMode = ({ 
  newEvent, 
  setNewEvent, 
  onSave, 
  onPickFromMap
  // continents - removido pois não usamos mais select
}) => {
  const [detecting, setDetecting] = useState(false);

  const updateField = (field, value) => setNewEvent(prev => ({ ...prev, [field]: value }));
  
  const inputClasses = "w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 outline-none transition text-sm";
  const labelClasses = "block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-500 dark:text-slate-400";

  // 🧠 EFEITO DE INTELIGÊNCIA ESPACIAL
  // Sempre que lat/lon mudar (seja digitando ou clicando no mapa), detecta o continente
  useEffect(() => {
    const lat = parseFloat(newEvent.latitude);
    const lon = parseFloat(newEvent.longitude);

    // Valida se são números reais e diferentes de 0,0 (padrão inicial)
    if (!isNaN(lat) && !isNaN(lon) && (lat !== 0 || lon !== 0)) {
      setDetecting(true);
      
      // Pequeno delay (debounce) para não chamar API enquanto digita rápido
      const timeoutId = setTimeout(async () => {
        try {
          const res = await eventsApi.detectContinent(lat, lon);
          updateField('continent', res.data.continent);
        } catch (error) {
          console.error("Erro ao detectar continente", error);
          updateField('continent', "Erro na detecção");
        } finally {
          setDetecting(false);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [newEvent.latitude, newEvent.longitude]);

  return (
    <div className="space-y-5 animate-in slide-in-from-bottom-4 fade-in duration-300">
      
      {/* Nome */}
      <div>
        <label className={labelClasses}>Nome do Evento <span className="text-red-500">*</span></label>
        <input 
          type="text" 
          placeholder="Ex: Queda de Constantinopla"
          className={inputClasses} 
          value={newEvent.name} 
          onChange={e => updateField('name', e.target.value)} 
          autoFocus
        />
      </div>

      {/* Datas (Agora com Range) */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>Ano Inicial <span className="text-red-500">*</span></label>
          <div className="relative">
            <input 
              type="number" 
              placeholder="-4000, 2024, etc."
              className={`${inputClasses} dark:[color-scheme:dark] pr-8`} 
              value={newEvent.year_start} 
              onChange={e => updateField('year_start', e.target.value)} 
            />
            <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold pointer-events-none">ANO</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Use negativo para a.C.</p>
        </div>
        <div>
          <label className={labelClasses}>Ano Final (Opcional)</label>
          <div className="relative">
             <input 
              type="number" 
              placeholder="Opcional"
              className={`${inputClasses} dark:[color-scheme:dark]`} 
              value={newEvent.year_end || ''} 
              onChange={e => updateField('year_end', e.target.value)} 
            />
          </div>
        </div>
      </div>

      {/* Localização Inteligente */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Globe size={16} className="text-blue-500" />
            Geolocalização
          </span>
          <button 
            onClick={onPickFromMap} 
            className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/60 flex items-center gap-1 transition font-bold"
          >
            <MapPin size={14} /> Marcar no Mapa
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs mb-4">
          <div>
            <label className="text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Latitude</label>
            <input 
              type="number" 
              step="any" 
              className={`${inputClasses} bg-white`} 
              value={newEvent.latitude} 
              onChange={e => updateField('latitude', e.target.value)} 
            />
          </div>
          <div>
            <label className="text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Longitude</label>
            <input 
              type="number" 
              step="any" 
              className={`${inputClasses} bg-white`} 
              value={newEvent.longitude} 
              onChange={e => updateField('longitude', e.target.value)} 
            />
          </div>
        </div>

        {/* Campo de Continente Automático (Read Only) */}
        <div className="relative">
          <label className={labelClasses}>Continente (Automático)</label>
          <div className="relative">
            <input 
              type="text" 
              className={`${inputClasses} bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed pl-9`} 
              value={detecting ? "Calculando localização..." : (newEvent.continent || "Aguardando coordenadas")} 
              readOnly
            />
            <div className="absolute left-3 top-2.5 text-slate-400">
              {detecting ? <Loader2 size={16} className="animate-spin text-blue-500" /> : <Lock size={16} />}
            </div>
          </div>
        </div>
      </div>

      {/* Descrições */}
      <div>
        <label className={labelClasses}>Descrição Curta</label>
        <input type="text" className={inputClasses} value={newEvent.description} onChange={e => updateField('description', e.target.value)} />
      </div>
      
      <div>
        <label className={labelClasses}>Conteúdo Detalhado</label>
        <textarea 
          rows="5" 
          className={`${inputClasses} resize-none custom-scrollbar`} 
          value={newEvent.content} 
          onChange={e => updateField('content', e.target.value)} 
          placeholder="Escreva a história completa aqui..."
        />
      </div>

      <button 
        onClick={onSave} 
        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition transform active:scale-[0.98] flex justify-center items-center gap-2"
      >
        <MapPin size={18} />
        Salvar no Atlas
      </button>
    </div>
  );
};

// ============================================================================
// MAIN WRAPPER
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
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar p-6 border border-slate-200 dark:border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            {mode === 'view' ? <><Languages size={24} className="text-blue-500"/> Detalhes do Evento</> : <><MapPin size={24} className="text-blue-500"/> Novo Evento</>}
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition text-slate-500 dark:text-slate-400"
          >
            ✕
          </button>
        </div>

        {mode === 'view' && eventData ? (
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