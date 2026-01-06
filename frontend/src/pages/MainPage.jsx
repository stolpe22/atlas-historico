import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { List, Plus, X, Map as MapIcon, MapPin, ArrowUpDown } from 'lucide-react';

// Layout e UI
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import MainMap from '../components/map/MainMap';
import ListView from '../components/list/ListView';

// Modais Unificados
import EventModal from '../components/modals/EventModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import NotificationModal from '../components/modals/NotificationModal';
import ETLModal from '../components/modals/ETLModal';

// Hooks e Contexto
import { useETL } from '../context/ETLContext';
import { useToast } from '../context/ToastContext';
import { useEvents } from '../hooks/useEvents';
import { eventsApi } from '../services/api'; // Adicionado para buscar filtros
import { DEFAULT_DATE_RANGE } from '../utils/constants';

const MainPage = () => {
  const { addToast } = useToast();
  
  // --- Estados de Filtro e UI ---
  const [dateRange, setDateRange] = useState(DEFAULT_DATE_RANGE);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('map'); 
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [focusPosition, setFocusPosition] = useState(null);

  // Novos Filtros Dinâmicos
  const [selectedContinent, setSelectedContinent] = useState('Todos');
  const [selectedPeriod, setSelectedPeriod] = useState('Todos');
  const [selectedSource, setSelectedSource] = useState('Todos');
  const [availableFilters, setAvailableFilters] = useState({
    continents: [],
    periods: [],
    sources: []
  });

  // Estado de Ordenação
  const [sortConfig, setSortConfig] = useState({ key: 'year_start', direction: 'asc' });

  // Estados de Modais
  const [showEventModal, setShowEventModal] = useState(false);
  const [modalMode, setModalMode] = useState('view'); 
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [etlSlug, setEtlSlug] = useState(null);

  // Formulário de Novo Evento
  const [newEvent, setNewEvent] = useState({
    name: '', description: '', content: '', year_start: '',
    latitude: 0, longitude: 0, continent: 'Outro',
  });

  // --- Carregamento de Dados ---
  const { allEvents, mapEvents, refresh: refreshEvents, createEvent, deleteEvent } = useEvents(dateRange, selectedContinent);
  const { startETL, progressTrigger } = useETL();

  // Busca filtros únicos do Banco (Distinct)
  const loadFilters = useCallback(async () => {
    try {
      const res = await eventsApi.getUniqueFilters();
      setAvailableFilters(res.data);
    } catch (e) {
      console.error("Erro ao carregar filtros dinâmicos", e);
    }
  }, []);

  useEffect(() => {
    loadFilters();
  }, [loadFilters, progressTrigger]); // Recarrega filtros se o ETL terminar

  useEffect(() => {
    if (progressTrigger > 0) refreshEvents();
  }, [progressTrigger, refreshEvents]);

  // --- Lógica de Filtro e Ordenação (Computed) ---
  const filteredAndSortedEvents = useMemo(() => {
    const filtered = allEvents.filter(e => {
      // Usamos (e.campo || "") para evitar o erro de toLowerCase() em valores nulos
      const matchesSearch = (e.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesContinent = selectedContinent === "Todos" || (e.continent || "") === selectedContinent;
      const matchesPeriod = selectedPeriod === "Todos" || (e.period || "") === selectedPeriod;
      const matchesSource = selectedSource === "Todos" || (e.source || "") === selectedSource;
      const matchesDate = e.year_start >= dateRange[0] && e.year_start <= dateRange[1];
      
      return matchesSearch && matchesContinent && matchesPeriod && matchesSource && matchesDate;
    });

    // Ordenação também blindada
    return [...filtered].sort((a, b) => {
      let aVal = a[sortConfig.key] ?? '';
      let bVal = b[sortConfig.key] ?? '';
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortConfig.direction === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });
  }, [allEvents, searchTerm, selectedContinent, selectedPeriod, selectedSource, dateRange, sortConfig]);

  // Converte os eventos filtrados para GeoJSON para o componente MainMap
  const geoJsonData = useMemo(() => ({
    type: 'FeatureCollection',
    features: filteredAndSortedEvents.map(e => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [e.longitude, e.latitude] },
      properties: { ...e, year: e.year_start }
    }))
  }), [filteredAndSortedEvents]);

  // --- Handlers ---
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleAddStart = useCallback(() => {
    if (viewMode === 'map') setIsAddingMode(prev => !prev);
    else {
      setNewEvent({ name: '', description: '', content: '', year_start: '', latitude: 0, longitude: 0, continent: 'Outro' });
      setModalMode('create');
      setShowEventModal(true);
    }
  }, [viewMode]);

  const handleMapClick = useCallback((latlng) => {
    setIsAddingMode(false);
    setNewEvent(prev => ({ ...prev, latitude: latlng.lat, longitude: latlng.lng }));
    setModalMode('create');
    setShowEventModal(true);
  }, []);

  const handleEventClick = useCallback((evt) => {
    setSelectedEvent(evt);
    setModalMode('view');
    setShowEventModal(true);
    if (evt.latitude && evt.longitude) setFocusPosition([evt.latitude, evt.longitude]);
  }, []);

  const handleSaveEvent = async () => {
    if (!newEvent.name || !newEvent.year_start) {
      addToast({ type: 'warning', title: 'Atenção', message: 'Preencha nome e ano.' });
      return;
    }
    const result = await createEvent({ ...newEvent, year_start: parseInt(newEvent.year_start), source: 'manual' });
    if (result.success) {
      addToast({ type: 'success', title: 'Salvo!', message: 'Evento registrado.' });
      setShowEventModal(false);
      loadFilters(); // Atualiza filtros se um novo continente/período foi criado
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteData) return;
    const result = await deleteEvent(deleteData.id);
    if (result.success) {
      addToast({ type: 'success', title: 'Apagado', message: 'Registro removido.' });
      setDeleteData(null);
    }
  };

  return (
    <div className="flex flex-row h-full w-full overflow-hidden">
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        
        {/* Header com Filtros Dinâmicos */}
        <Header
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedContinent={selectedContinent}
          setSelectedContinent={setSelectedContinent}
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          selectedSource={selectedSource}
          setSelectedSource={setSelectedSource}
          availableFilters={availableFilters}
          dateRange={dateRange}
          setDateRange={setDateRange}
          filteredCount={filteredAndSortedEvents.length}
        />

        <div className="flex-1 relative overflow-hidden">
          {/* Alternador de Visão */}
          <div className="absolute top-4 w-full flex justify-center z-[400] pointer-events-none">
            <div className="bg-white dark:bg-slate-800 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 p-1 flex pointer-events-auto backdrop-blur-md bg-opacity-90">
              <button onClick={() => setViewMode('map')} className={`flex items-center gap-2 px-6 py-1.5 rounded-full font-bold text-xs transition-all ${viewMode === 'map' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                <MapIcon size={14} /> Mapa
              </button>
              <button onClick={() => setViewMode('table')} className={`flex items-center gap-2 px-6 py-1.5 rounded-full font-bold text-xs transition-all ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                <List size={14} /> Lista
              </button>
            </div>
          </div>

          {/* Renderização condicional conforme viewMode */}
          {viewMode === 'map' ? (
            <MainMap
              events={geoJsonData}
              focusPosition={focusPosition}
              isAddingMode={isAddingMode}
              onMapClick={handleMapClick}
              onMarkerClick={handleEventClick}
            />
          ) : (
            <ListView 
              events={filteredAndSortedEvents} 
              onViewDetails={handleEventClick} 
              onDelete={(evt) => setDeleteData({ id: evt.id, name: evt.name })}
              onSort={handleSort}
              sortConfig={sortConfig}
            />
          )}

          {/* Botão Flutuante (FAB) */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[400]">
            <button
              onClick={handleAddStart}
              className={`flex items-center justify-center w-16 h-16 rounded-full shadow-2xl border-4 transition-all duration-300 hover:scale-110 ${
                isAddingMode ? 'bg-red-500 border-red-200 text-white rotate-90' : 'bg-blue-600 border-blue-200 text-white'
              }`}
            >
              {isAddingMode ? <X size={32} /> : <Plus size={32} />}
            </button>
          </div>
        </div>
      </div>

      <Sidebar
        events={filteredAndSortedEvents}
        onEventClick={handleEventClick}
        onRunSeed={() => startETL('seed', {})} 
        onOpenPopulate={() => setEtlSlug('wikidata')} 
        onOpenKaggle={() => setEtlSlug('kaggle')}
      />

      {/* Camada de Modais */}
      <EventModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        mode={modalMode}
        eventData={selectedEvent}
        newEvent={newEvent}
        setNewEvent={setNewEvent}
        onSave={handleSaveEvent}
        onPickFromMap={() => { setShowEventModal(false); setViewMode('map'); setIsAddingMode(true); }}
        continents={availableFilters.continents}
      />

      <ConfirmModal
        isOpen={!!deleteData}
        onClose={() => setDeleteData(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Registro?"
        message={`Tem certeza que deseja apagar "${deleteData?.name}"?`}
      />

      <ETLModal isOpen={!!etlSlug} onClose={() => setEtlSlug(null)} integrationSlug={etlSlug} />
      <NotificationModal notification={null} onClose={() => {}} />
    </div>
  );
};

export default MainPage;