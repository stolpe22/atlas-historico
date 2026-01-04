import { useState, useCallback } from 'react';
import { Map as MapIcon, List, Plus, X, Moon, Sun, Monitor } from 'lucide-react';

// Styles
import 'leaflet/dist/leaflet.css';
import 'rc-slider/assets/index.css';

// Components
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import NavButton from './components/layout/NavButton';
import MainMap from './components/map/MainMap';
import ListView from './components/list/ListView';
import EventModal from './components/modals/EventModal';
import ConfirmModal from './components/modals/ConfirmModal';
import NotificationModal from './components/modals/NotificationModal';
import PopulateModal from './components/modals/PopulateModal';
import PopulateIndicator from './components/common/PopulateIndicator';

// Hooks
import { useTheme } from './hooks/useTheme';
import { useEvents } from './hooks/useEvents';
import { usePopulate } from './hooks/usePopulate';

// Utils
import { CONTINENTS, DEFAULT_DATE_RANGE } from './utils/constants';

// ============================================================================
// THEME SWITCHER COMPONENT
// ============================================================================
const ThemeSwitcher = ({ theme, setTheme }) => {
  const buttons = [
    { value: 'light', icon: Sun },
    { value:  'dark', icon: Moon },
    { value: 'system', icon: Monitor }
  ];

  return (
    <div className="flex flex-col gap-2 mb-4 bg-slate-700/50 p-2 rounded-lg">
      {buttons.map(({ value, icon:  Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`p-2 rounded ${
            theme === value 
              ? 'bg-white text-slate-900' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Icon size={18} />
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
function App() {
  const { theme, setTheme } = useTheme();
  
  // Filter States
  const [dateRange, setDateRange] = useState(DEFAULT_DATE_RANGE);
  const [selectedContinent, setSelectedContinent] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  
  // UI States
  const [viewMode, setViewMode] = useState("map");
  const [focusPosition, setFocusPosition] = useState(null);
  const [isAddingMode, setIsAddingMode] = useState(false);
  
  // Modal States
  const [showEventModal, setShowEventModal] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // Form State
  const [newEvent, setNewEvent] = useState({
    name: "",
    description: "",
    content: "",
    year_start: "",
    latitude: 0,
    longitude: 0,
    continent: "Outro"
  });

  // Custom Hooks
  const { 
    mapEvents, 
    refresh:  refreshEvents, 
    createEvent, 
    deleteEvent,
    filterEvents 
  } = useEvents(dateRange, selectedContinent);

  const {
    isPopulating,
    logs:  populateLogs,
    showModal:  showPopulateModal,
    setShowModal:  setShowPopulateModal,
    startExtraction,
    startSeed,
    stop:  stopPopulate
  } = usePopulate((notif) => {
    setNotification(notif);
    refreshEvents();
  });

  // Filtered Events
  const filteredEvents = filterEvents(searchTerm);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleAddStart = useCallback(() => {
    if (! showEventModal && !isAddingMode) {
      setNewEvent({
        name: "",
        description: "",
        content: "",
        year_start: "",
        latitude: 0,
        longitude:  0,
        continent: "Outro"
      });
    }
    
    if (viewMode === 'map') {
      setIsAddingMode(prev => !prev);
    } else {
      setModalMode("create");
      setShowEventModal(true);
    }
  }, [showEventModal, isAddingMode, viewMode]);

  const handleMapClick = useCallback((latlng) => {
    setIsAddingMode(false);
    setNewEvent(prev => ({ 
      ...prev, 
      latitude:  latlng.lat, 
      longitude: latlng.lng 
    }));
    setModalMode("create");
    setShowEventModal(true);
  }, []);

  const handleMarkerClick = useCallback((eventData) => {
    setSelectedEvent(eventData);
    setModalMode("view");
    setShowEventModal(true);
  }, []);

  const handleEventClick = useCallback((evt) => {
    setSelectedEvent(evt);
    setModalMode("view");
    setShowEventModal(true);
    setFocusPosition([evt.latitude, evt.longitude]);
  }, []);

  const handleSaveEvent = useCallback(async () => {
    if (!newEvent.name || ! newEvent.year_start) {
      setNotification({ 
        type: 'warning', 
        title: 'Atenção', 
        message: 'Preencha nome e ano.' 
      });
      return;
    }

    const result = await createEvent({
      ...newEvent,
      year_start: parseInt(newEvent.year_start),
      source: "manual"
    });

    if (result.success) {
      setNotification({ 
        type: 'success', 
        title: 'Salvo!', 
        message: 'Evento registrado com sucesso.' 
      });
      setShowEventModal(false);
    } else {
      setNotification({ 
        type: 'error', 
        title: 'Erro', 
        message: 'Falha ao salvar.' 
      });
    }
  }, [newEvent, createEvent]);

  const handleRequestDelete = useCallback((evt) => {
    if (evt.source !== 'manual') {
      setNotification({
        type: 'warning',
        title: 'Ação Bloqueada',
        message: 'Apenas eventos criados manualmente podem ser excluídos.'
      });
      return;
    }
    setDeleteData({ id: evt.id, name: evt.name });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (! deleteData) return;

    const result = await deleteEvent(deleteData.id);
    
    if (result.success) {
      setNotification({ 
        type:  'success', 
        title: 'Apagado', 
        message:  'Registro removido.' 
      });
    } else {
      setNotification({ 
        type: 'error', 
        title: 'Erro', 
        message: 'Falha ao apagar.' 
      });
    }
    
    setDeleteData(null);
  }, [deleteData, deleteEvent]);

  const handlePickFromMap = useCallback(() => {
    setShowEventModal(false);
    setViewMode('map');
    setIsAddingMode(true);
  }, []);

  const handleRunSeed = useCallback(async () => {
    const result = await startSeed();
    if (! result.success) {
      setNotification({ 
        type: 'error', 
        title:  'Erro', 
        message:  'Falha ao iniciar preset.' 
      });
    }
  }, [startSeed]);

  const handleRunPopulate = useCallback(async (config) => {
    const result = await startExtraction(config);
    if (!result.success) {
      setNotification({ 
        type:  'error', 
        title: 'Erro', 
        message: 'Falha ao iniciar extração.' 
      });
    }
  }, [startExtraction]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Left Sidebar - Navigation */}
      <nav className="w-20 bg-slate-800 dark:bg-slate-950 flex flex-col items-center py-6 gap-6 z-[1000] shadow-xl">
        {/* Logo */}
        <div className="p-3 bg-brand-600 rounded-xl shadow-lg shadow-brand-500/30">
          <span className="text-2xl">🌍</span>
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex-1 flex flex-col gap-4 w-full px-2">
          <NavButton 
            active={viewMode === 'map'} 
            onClick={() => { setViewMode('map'); setIsAddingMode(false); }} 
            icon={<MapIcon size={24} />} 
            label="Mapa" 
          />
          <NavButton 
            active={viewMode === 'table'} 
            onClick={() => { setViewMode('table'); setIsAddingMode(false); }} 
            icon={<List size={24} />} 
            label="Lista" 
          />
          <NavButton 
            active={isAddingMode} 
            onClick={handleAddStart} 
            icon={isAddingMode ? <X size={24} className="text-red-400" /> : <Plus size={24} />} 
            label={isAddingMode ?  "Cancelar" : "Novo"} 
          />
        </div>

        {/* Theme Switcher */}
        <ThemeSwitcher theme={theme} setTheme={setTheme} />
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col">
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

        {/* Populate Indicator */}
        {isPopulating && (
          <PopulateIndicator 
            lastLog={populateLogs[populateLogs.length - 1]}
            onMaximize={() => setShowPopulateModal(true)}
            onStop={stopPopulate}
          />
        )}

        {/* View Content */}
        <div className="flex-1 relative overflow-hidden">
          {viewMode === 'map' ?  (
            <MainMap 
              events={mapEvents}
              focusPosition={focusPosition}
              isAddingMode={isAddingMode}
              setIsAddingMode={setIsAddingMode}
              onMapClick={handleMapClick}
              onMarkerClick={handleMarkerClick}
            />
          ) : (
            <ListView 
              events={filteredEvents}
              onViewDetails={handleEventClick}
              onDelete={handleRequestDelete}
            />
          )}
        </div>
      </main>

      {/* Right Sidebar */}
      <Sidebar 
        events={filteredEvents}
        onEventClick={handleEventClick}
        onRunSeed={handleRunSeed}
        onOpenPopulate={() => setShowPopulateModal(true)}
      />

      {/* Modals */}
      <EventModal 
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        mode={modalMode}
        eventData={selectedEvent}
        newEvent={newEvent}
        setNewEvent={setNewEvent}
        onSave={handleSaveEvent}
        onPickFromMap={handlePickFromMap}
        continents={CONTINENTS}
      />
      
      <ConfirmModal 
        isOpen={!! deleteData}
        onClose={() => setDeleteData(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Registro?"
        message={`Você está prestes a apagar permanentemente "${deleteData?.name}".`}
      />
      
      <PopulateModal 
        isOpen={showPopulateModal}
        onClose={() => setShowPopulateModal(false)}
        onConfirm={handleRunPopulate}
        isLoading={isPopulating}
        logs={populateLogs}
        onStop={stopPopulate}
      />

      <NotificationModal 
        notification={notification}
        onClose={() => setNotification(null)}
      />
    </div>
  );
}

export default App;