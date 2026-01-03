import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, LayersControl, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import axios from 'axios'
import 'leaflet/dist/leaflet.css'
import 'rc-slider/assets/index.css'

// Imports Locais
import { createLabelIcon, createClusterCustomIcon } from './utils/mapHelpers'
import { useTheme } from './useTheme'
import MapFix from './MapFix' // Assumindo que você tem esses
import FlyTo from './FlyTo' // Assumindo que você tem esses

// Componentes Refatorados
import Header from './components/layout/Header'
import EventModal from './components/modals/EventModal'
import { ConfirmModal, NotificationModal, PopulateModal } from './components/modals/SupportModals'

// Ícones UI
import { Map as MapIcon, List, Plus, Settings, Moon, Sun, Download, Database, X, Trash2 } from 'lucide-react'

// --- CONTROLLER DO MAPA (Pode ir pra pasta map/ se quiser) ---
const AddEventController = ({ isAddingMode, onMapClick }) => {
  useMapEvents({
    click(e) { if (isAddingMode) onMapClick(e.latlng); },
  });
  return null;
};

// Componentes de Botão (Pequenos)
const NavBtn = ({ active, onClick, icon, label }) => (
    <button onClick={onClick} className={`w-full aspect-square flex flex-col items-center justify-center gap-1 rounded-xl transition ${active ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
        {icon} <span className="text-[10px] font-medium">{label}</span>
    </button>
)
const MenuBtn = ({ onClick, icon, label }) => (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg text-left transition">
        {icon} {label}
    </button>
)

function App() {
  const { theme, setTheme } = useTheme();
  
  // --- ESTADOS DE DADOS ---
  const [allEvents, setAllEvents] = useState([])
  const [mapEvents, setMapEvents] = useState(null)
  
  // --- ESTADOS DE FILTRO ---
  const [dateRange, setDateRange] = useState([-3000, 2025])
  const [selectedContinent, setSelectedContinent] = useState("Todos")
  const [searchTerm, setSearchTerm] = useState("")
  
  // --- ESTADOS DE UI/CONTROLE ---
  const [viewMode, setViewMode] = useState("map") 
  const [focusPosition, setFocusPosition] = useState(null)
  const [isAddingMode, setIsAddingMode] = useState(false) 
  const [showMenu, setShowMenu] = useState(false)
  const [populateStatus, setPopulateStatus] = useState(""); 
  const [isPopulating, setIsPopulating] = useState(false)
  
  // --- ESTADOS DE MODAL ---
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState("view")
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showPopulateModal, setShowPopulateModal] = useState(false);
  const [populateMode, setPopulateMode] = useState("fast");
  
  // --- ESTADOS DE NOTIFICAÇÃO/DELEÇÃO ---
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState(null); 

  const [newEvent, setNewEvent] = useState({ name: "", description: "", content: "", year_start: "", latitude: 0, longitude: 0, continent: "Outro" })
  const fileInputRef = useRef(null)
  const continents = ["Todos", "América do Sul", "América do Norte", "Europa", "África", "Ásia", "Oceania", "Antártida"]

  // --- LÓGICA DE DADOS ---
  const refreshData = () => {
    axios.get('http://localhost:8000/events/all').then(res => setAllEvents(res.data));
    let url = `http://localhost:8000/events?start_year=${dateRange[0]}&end_year=${dateRange[1]}`
    if (selectedContinent !== "Todos") url += `&continent=${selectedContinent}`;
    axios.get(url).then(res => setMapEvents(res.data));
  };

  useEffect(() => { refreshData(); }, [dateRange, selectedContinent]);

  const filteredEvents = allEvents.filter(e => {
    const matchesContinent = selectedContinent === "Todos" || e.continent === selectedContinent;
    const matchesDate = e.year_start >= dateRange[0] && e.year_start <= dateRange[1];
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = e.name.toLowerCase().includes(searchLower);
    return matchesContinent && matchesDate && matchesSearch;
  });

  // --- LÓGICA DE POPULAÇÃO ---
  useEffect(() => {
    let interval;
    if (isPopulating) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get('http://localhost:8000/populate/status');
          setPopulateStatus(res.data.message);
          refreshData();
          if (res.data.is_running === false) {
             setIsPopulating(false);
             setPopulateStatus(""); 
             setNotification({ type: 'success', title: 'Concluído!', message: res.data.message });
             refreshData();
          }
        } catch (e) { console.error(e); }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isPopulating, dateRange, selectedContinent]);

  const openPopulateConfig = (mode) => {
    setPopulateMode(mode);
    setShowMenu(false);
    setShowPopulateModal(true);
  };

  const runPopulate = async (config) => {
    setShowPopulateModal(false);
    try {
        await axios.post('http://localhost:8000/populate', {
            mode: populateMode, continents: config.continents, start_year: config.start_year, end_year: config.end_year
        });
        setIsPopulating(true);
        setPopulateStatus("Enviando configuração...");
        setNotification({ type: 'info', title: 'Iniciando', message: 'O robô iniciou a busca.' });
    } catch (error) {
        setNotification({ type: 'error', title: 'Erro', message: 'Falha ao iniciar.' });
    }
  };

  // --- HANDLERS ---
  const handleAddStart = () => {
    if (!showModal && !isAddingMode) {
        setNewEvent({ name: "", description: "", content: "", year_start: "", latitude: 0, longitude: 0, continent: "Outro" });
    }
    if (viewMode === 'map') {
        setIsAddingMode(!isAddingMode);
    } else {
        setModalMode("create");
        setShowModal(true);
    }
  };

  const handleMapClick = (latlng) => {
    setIsAddingMode(false);
    setNewEvent(prev => ({ ...prev, latitude: latlng.lat, longitude: latlng.lng }));
    setModalMode("create");
    setShowModal(true);
  };

  const handleSaveEvent = async () => {
    if (!newEvent.name || !newEvent.year_start) {
        setNotification({ type: 'warning', title: 'Atenção', message: 'Preencha nome e ano.' });
        return;
    }
    try {
      await axios.post('http://localhost:8000/events', newEvent);
      setNotification({ type: 'success', title: 'Salvo!', message: 'Evento registrado.' });
      setShowModal(false);
      refreshData();
    } catch (error) { 
      setNotification({ type: 'error', title: 'Erro', message: 'Falha ao salvar.' });
    }
  };

  const requestDelete = (evt) => {
    if (!evt.is_manual) {
        setNotification({ type: 'warning', title: 'Bloqueado', message: 'Eventos importados não podem ser apagados.' });
        return;
    }
    setDeleteData({ id: evt.id, name: evt.name });
  };

  const confirmDelete = async () => {
    if (!deleteData) return;
    setIsDeleting(true);
    try {
      await axios.delete(`http://localhost:8000/events/${deleteData.id}`);
      setAllEvents(prev => prev.filter(e => e.id !== deleteData.id));
      setDeleteData(null); 
      setMapEvents(prev => {
          if(!prev) return null;
          return { ...prev, features: prev.features.filter(f => f.properties.id !== deleteData.id) }
      });
      setNotification({ type: 'success', title: 'Apagado', message: 'Registro removido.' });
    } catch (error) {
      setNotification({ type: 'error', title: 'Erro', message: 'Falha ao apagar.' });
    } finally { setIsDeleting(false); }
  };

  // --- RENDER ---
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* SIDEBAR ESQUERDA */}
      <nav className="w-20 bg-slate-800 dark:bg-slate-950 flex flex-col items-center py-6 gap-6 z-[1000] shadow-xl">
        <div className="p-3 bg-brand-600 rounded-xl shadow-lg shadow-brand-500/30"><span className="text-2xl">🌍</span></div>
        <div className="flex-1 flex flex-col gap-4 w-full px-2">
            <NavBtn active={viewMode === 'map'} onClick={() => { setViewMode('map'); setIsAddingMode(false); }} icon={<MapIcon size={24}/>} label="Mapa" />
            <NavBtn active={viewMode === 'table'} onClick={() => { setViewMode('table'); setIsAddingMode(false); }} icon={<List size={24}/>} label="Lista" />
            <NavBtn active={isAddingMode} onClick={handleAddStart} icon={isAddingMode ? <X size={24} className="text-red-400"/> : <Plus size={24}/>} label={isAddingMode ? "Cancelar" : "Novo"} />
        </div>
        <div className="flex flex-col gap-2 mb-4 bg-slate-700/50 p-2 rounded-lg">
            <button onClick={() => setTheme('light')} className="p-2 text-slate-400 hover:text-white"><Sun size={18}/></button>
            <button onClick={() => setTheme('dark')} className="p-2 text-slate-400 hover:text-white"><Moon size={18}/></button>
        </div>
      </nav>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 relative flex flex-col">
        <Header 
            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            selectedContinent={selectedContinent} setSelectedContinent={setSelectedContinent}
            dateRange={dateRange} setDateRange={setDateRange}
            filteredCount={filteredEvents.length} continents={continents}
        />

        {isPopulating && (
            <div className="bg-blue-600 text-white text-sm font-bold py-2 px-4 text-center shadow-md animate-pulse flex justify-center items-center gap-3 z-50">
               <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
               {populateStatus || "Processando dados..."}
            </div>
        )}

        <div className="flex-1 relative overflow-hidden">
          {isAddingMode && viewMode === 'map' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[5000] bg-brand-600 text-white px-6 py-3 rounded-full shadow-xl font-bold animate-bounce cursor-default flex items-center gap-3">
                <MapIcon size={20} /> Clique no mapa para definir o local
                <button onClick={() => setIsAddingMode(false)} className="bg-white/20 hover:bg-white/40 rounded-full p-1 ml-2"><X size={14}/></button>
            </div>
          )}

          {viewMode === 'map' ? (
             <MapContainer center={[20, 0]} zoom={2} className={`h-full w-full outline-none ${isAddingMode ? 'cursor-crosshair' : ''}`}>
                 <MapFix />
                 <FlyTo position={focusPosition} zoom={6} />
                 <LayersControl position="topright">
                    <LayersControl.BaseLayer checked name="Claro"><TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"/></LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Escuro"><TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"/></LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Satélite"><TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"/></LayersControl.BaseLayer>
                 </LayersControl>
                 <AddEventController isAddingMode={isAddingMode} onMapClick={handleMapClick} />
                 <MarkerClusterGroup chunkedLoading iconCreateFunction={createClusterCustomIcon}>
                   {mapEvents && mapEvents.features.map((feature) => (
                     <Marker 
                       key={feature.properties.id} position={[feature.geometry.coordinates[1], feature.geometry.coordinates[0]]} icon={createLabelIcon(feature.properties.name, feature.properties.year)}
                       eventHandlers={{
                         click: () => { if (!isAddingMode) { setSelectedEvent(feature.properties); setModalMode("view"); setShowModal(true); } }
                       }}
                     />
                   ))}
                 </MarkerClusterGroup>
             </MapContainer>
          ) : (
            <div className="p-8 h-full overflow-auto bg-slate-50 dark:bg-slate-900">
               <div className="max-w-5xl mx-auto">
                 <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><List /> Catálogo Histórico <span className="bg-brand-100 text-brand-700 text-xs px-2 py-1 rounded-full">{filteredEvents.length}</span></h2>
                 <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                        <tr><th className="p-4 border-b border-slate-200 dark:border-slate-700">Ano</th><th className="p-4 border-b border-slate-200 dark:border-slate-700">Evento</th><th className="p-4 border-b border-slate-200 dark:border-slate-700">Período</th><th className="p-4 border-b border-slate-200 dark:border-slate-700">Continente</th><th className="p-4 border-b border-slate-200 dark:border-slate-700">Ação</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredEvents.map(evt => (
                          <tr key={evt.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                            <td className="p-4 font-mono text-brand-600 font-bold">{evt.year_start}</td>
                            <td className="p-4 font-medium flex items-center gap-2">
                                {evt.name} {evt.is_manual && <span className="w-2 h-2 rounded-full bg-green-500" title="Manual"></span>}
                            </td>
                            <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{evt.period}</td>
                            <td className="p-4"><span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs font-bold">{evt.continent}</span></td>
                            <td className="p-4 flex items-center gap-3">
                              <button onClick={() => { setSelectedEvent(evt); setModalMode("view"); setShowModal(true); }} className="text-sm text-brand-600 hover:underline">Ver detalhes</button>
                              {evt.is_manual && (
                                <button onClick={(e) => { e.stopPropagation(); requestDelete(evt); }} className="p-2 text-red-400 hover:bg-red-50 rounded-full"><Trash2 size={18} /></button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* SIDEBAR DIREITA */}
      <aside className="w-96 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col z-20 shadow-xl">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
           <h2 className="font-bold text-lg">Cronologia</h2>
           <div className="relative">
             <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition"><Settings size={20}/></button>
             {showMenu && (
                <div className="absolute right-0 top-10 w-56 bg-white dark:bg-slate-700 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-600 p-2 flex flex-col gap-1 z-50">
                    <MenuBtn onClick={() => openPopulateConfig('fast')} icon={<Download size={16}/>} label="Modo Turbo" />
                    <MenuBtn onClick={() => openPopulateConfig('detailed')} icon={<Database size={16}/>} label="Varredura" />
                    <div className="h-px bg-slate-100 dark:bg-slate-600 my-1"></div>
                    <MenuBtn onClick={() => fileInputRef.current.click()} icon={<Plus size={16}/>} label="Importar JSON" />
                    <input type="file" accept=".json" ref={fileInputRef} className="hidden" onChange={() => {}} />
                </div>
             )}
           </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
           {filteredEvents.map((evt) => (
             <div key={evt.id} onClick={() => { setSelectedEvent(evt); setModalMode("view"); setShowModal(true); setFocusPosition([evt.latitude, evt.longitude]); }} className="group bg-white dark:bg-slate-700/30 p-4 rounded-xl border border-slate-100 hover:border-brand-500 cursor-pointer transition shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 group-hover:bg-brand-500 transition-colors"></div>
                <div className="pl-3"><h3 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-600">{evt.name}</h3><div className="flex items-center gap-2 mt-2"><span className="text-xs font-bold bg-brand-50 text-brand-600 px-2 py-0.5 rounded">{evt.year_start}</span><span className="text-xs text-slate-400 uppercase">{evt.continent}</span></div></div>
             </div>
           ))}
        </div>
      </aside>

      {/* MODAIS ORGANIZADOS */}
      <EventModal 
        isOpen={showModal} onClose={() => setShowModal(false)}
        mode={modalMode} eventData={selectedEvent}
        newEvent={newEvent} setNewEvent={setNewEvent}
        onSave={handleSaveEvent}
        onPickFromMap={() => { setShowModal(false); setViewMode('map'); setIsAddingMode(true); }}
        continents={continents}
      />
      
      <ConfirmModal isOpen={!!deleteData} onClose={() => setDeleteData(null)} onConfirm={confirmDelete} title="Excluir?" message={`Deseja apagar "${deleteData?.name}"?`} />
      <NotificationModal notification={notification} onClose={() => setNotification(null)} />
      <PopulateModal isOpen={showPopulateModal} onClose={() => setShowPopulateModal(false)} onConfirm={runPopulate} />

    </div>
  )
}

export default App