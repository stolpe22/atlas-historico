import React, { useState, useCallback, useEffect } from 'react';
import { List, Plus, X, Map as MapIcon, MapPin } from 'lucide-react';

import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import MainMap from '../components/map/MainMap';
import ListView from '../components/list/ListView';
import EventModal from '../components/modals/EventModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import NotificationModal from '../components/modals/NotificationModal';
import PopulateModal from '../components/modals/PopulateModal';
import PopulateIndicator from '../components/common/PopulateIndicator';
import ETLModal from '../components/modals/ETLModal';

import { useETL } from '../context/ETLContext';
import { useEvents } from '../hooks/useEvents';
import { usePopulate } from '../hooks/usePopulate';
import { CONTINENTS, DEFAULT_DATE_RANGE } from '../utils/constants';

const MainPage = () => {
  // UI & filtros
  const [dateRange, setDateRange] = useState(DEFAULT_DATE_RANGE);
  const [selectedContinent, setSelectedContinent] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('map');
  const [focusPosition, setFocusPosition] = useState(null);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [notification, setNotification] = useState(null);
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    content: '',
    year_start: '',
    latitude: 0,
    longitude: 0,
    continent: 'Outro',
  });
  const [etlSlug, setEtlSlug] = useState(null);

  // Dados
  const { mapEvents, refresh: refreshEvents, createEvent, deleteEvent, filterEvents } = useEvents(dateRange, selectedContinent);
  const { startETL, progressTrigger } = useETL();

  useEffect(() => {
    if (progressTrigger > 0) refreshEvents();
  }, [progressTrigger, refreshEvents]);

  const {
    isPopulating,
    logs: populateLogs,
    showModal: showPopulateModal,
    setShowModal: setShowPopulateModal,
    startExtraction,
    startSeed,
    stop: stopPopulate,
  } = usePopulate((notif) => {
    setNotification(notif);
    refreshEvents();
  });

  const filteredEvents = filterEvents(searchTerm);

  // Handlers
  const handleAddStart = useCallback(() => {
    if (!showEventModal && !isAddingMode) {
      setNewEvent({
        name: '',
        description: '',
        content: '',
        year_start: '',
        latitude: 0,
        longitude: 0,
        continent: 'Outro',
      });
    }
    if (viewMode === 'map') setIsAddingMode((prev) => !prev);
    else {
      setModalMode('create');
      setShowEventModal(true);
    }
  }, [showEventModal, isAddingMode, viewMode]);

  const handleMapClick = useCallback((latlng) => {
    setIsAddingMode(false);
    setNewEvent((prev) => ({ ...prev, latitude: latlng.lat, longitude: latlng.lng }));
    setModalMode('create');
    setShowEventModal(true);
  }, []);

  const handleEventClick = useCallback((evt) => {
    setSelectedEvent(evt);
    setModalMode('view');
    setShowEventModal(true);
    setFocusPosition([evt.latitude, evt.longitude]);
  }, []);

  const handleSaveEvent = useCallback(async () => {
    if (!newEvent.name || !newEvent.year_start) {
      setNotification({ type: 'warning', title: 'Atenção', message: 'Preencha nome e ano.' });
      return;
    }
    const result = await createEvent({ ...newEvent, year_start: parseInt(newEvent.year_start), source: 'manual' });
    if (result.success) {
      setNotification({ type: 'success', title: 'Salvo!', message: 'Evento registrado.' });
      setShowEventModal(false);
    } else {
      setNotification({ type: 'error', title: 'Erro', message: 'Falha ao salvar.' });
    }
  }, [newEvent, createEvent]);

  const handleRequestDelete = useCallback((evt) => {
    if (evt.source !== 'manual') {
      setNotification({ type: 'warning', title: 'Bloqueado', message: 'Apenas eventos manuais podem ser excluídos.' });
      return;
    }
    setDeleteData({ id: evt.id, name: evt.name });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteData) return;
    const result = await deleteEvent(deleteData.id);
    if (result.success) setNotification({ type: 'success', title: 'Apagado', message: 'Removido.' });
    else setNotification({ type: 'error', title: 'Erro', message: 'Falha ao apagar.' });
    setDeleteData(null);
  }, [deleteData, deleteEvent]);

  const handleRunSeed = () => {
    // Em vez de abrir o modal antigo ou chamar startSeed, chamamos o ETL unificado
    startETL('seed', {}); 
  };

  return (
    <div className="flex flex-row h-full w-full overflow-hidden">
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        <Header
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedContinent={selectedContinent}
          setSelectedContinent={setSelectedContinent}
          dateRange={dateRange}
          setDateRange={setDateRange}
          filteredCount={filteredEvents.length}
          continents={CONTINENTS}
        />

        {isPopulating && (
          <PopulateIndicator
            lastLog={populateLogs[populateLogs.length - 1]}
            onMaximize={() => setShowPopulateModal(true)}
            onStop={stopPopulate}
          />
        )}

        <div className="flex-1 relative overflow-hidden">
          {/* Troca de visão */}
          <div className="absolute top-4 w-full flex justify-center z-[400] pointer-events-none">
            <div className="bg-white dark:bg-slate-800 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 p-1 flex pointer-events-auto backdrop-blur-md bg-opacity-90">
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-2 px-6 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all ${
                  viewMode === 'map'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <MapIcon size={14} /> Mapa
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-2 px-6 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <List size={14} /> Lista
              </button>
            </div>
          </div>

          {isAddingMode && viewMode === 'map' && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[400] pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="bg-slate-900/90 backdrop-blur-md text-white px-5 py-2.5 rounded-full shadow-2xl border border-slate-700 flex items-center gap-3 animate-bounce">
                <MapPin size={18} className="text-red-400" />
                <span className="font-bold text-sm tracking-wide">Escolha um local no mapa</span>
              </div>
            </div>
          )}

          {viewMode === 'map' ? (
            <MainMap
              events={mapEvents}
              focusPosition={focusPosition}
              isAddingMode={isAddingMode}
              onMapClick={handleMapClick}
              onMarkerClick={handleEventClick}
            />
          ) : (
            <ListView events={filteredEvents} onViewDetails={handleEventClick} onDelete={handleRequestDelete} />
          )}

          {/* FAB */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[400]">
            <button
              onClick={handleAddStart}
              className={`group flex items-center justify-center w-16 h-16 rounded-full shadow-2xl border-4 transition-all duration-300 hover:scale-110 ${
                isAddingMode
                  ? 'bg-red-500 border-red-200 dark:border-red-900 text-white rotate-90'
                  : 'bg-blue-600 border-blue-200 dark:border-blue-900 text-white'
              }`}
            >
              {isAddingMode ? <X size={32} /> : <Plus size={32} />}
            </button>
          </div>
        </div>
      </div>

      <Sidebar
        events={filteredEvents}
        onEventClick={handleEventClick}
        onRunSeed={handleRunSeed}
        onOpenPopulate={() => setShowPopulateModal(true)}
        onOpenKaggle={() => setEtlSlug('kaggle')}
      />

      {/* Modais */}
      <EventModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        mode={modalMode}
        eventData={selectedEvent}
        newEvent={newEvent}
        setNewEvent={setNewEvent}
        onSave={handleSaveEvent}
        onPickFromMap={() => {
          setShowEventModal(false);
          setViewMode('map');
          setIsAddingMode(true);
        }}
        continents={CONTINENTS}
      />

      <ConfirmModal
        isOpen={!!deleteData}
        onClose={() => setDeleteData(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir?"
        message={`Apagar "${deleteData?.name}"?`}
      />

      <PopulateModal
        isOpen={showPopulateModal}
        onClose={() => setShowPopulateModal(false)}
        onConfirm={startExtraction}
        isLoading={isPopulating}
        logs={populateLogs}
        onStop={stopPopulate}
      />

      <ETLModal
        isOpen={!!etlSlug}
        onClose={() => setEtlSlug(null)}
        integrationSlug={etlSlug}
        onRunOverride={
          etlSlug === 'seed'
            ? async () => {
                await startSeed();
                setNotification({
                  type: 'success',
                  title: 'Seed concluído',
                  message: 'Dados restaurados de manual_events.json.'
                });
                refreshEvents();
              }
            : undefined
        }
      />

      <NotificationModal notification={notification} onClose={() => setNotification(null)} />
    </div>
  );
};

export default MainPage;