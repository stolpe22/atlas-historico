import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, LayersControl, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import axios from 'axios'
import 'leaflet/dist/leaflet.css'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'
import L from 'leaflet'
import MapFix from './MapFix'
import FlyTo from './FlyTo'
import { useTheme } from './useTheme'
import { 
  Map as MapIcon, List, Plus, Search, Settings, Moon, Sun, Monitor, 
  Database, Download, X, MapPin, Trash2, AlertTriangle, 
  CheckCircle, Info, XCircle // <--- NOVOS ÍCONES
} from 'lucide-react'
// --- Ícones Leaflet ---
const createLabelIcon = (name, year) => {
  const yearDisplay = year < 0 ? `${Math.abs(year)} a.C.` : `${year}`;
  return L.divIcon({
    className: 'custom-map-label', 
    html: `<div class="label-content">
             <span class="block bg-brand-600 text-white rounded px-1 text-[10px] mb-1">${yearDisplay}</span>
             <span>${name}</span>
           </div>`,
    iconSize: [180, 50],
    iconAnchor: [90, 50]
  });
};

const createClusterCustomIcon = function (cluster) {
  return L.divIcon({
    html: `<span class="cluster-icon">${cluster.getChildCount()}</span>`,
    className: 'custom-marker-cluster',
    iconSize: L.point(33, 33, true),
  })
}

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 transform scale-100 transition-all">
        <div className="flex items-center gap-4 mb-4 text-red-500">
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
            <AlertTriangle size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h3>
        </div>
        
        <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
          {message}
        </p>

        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-500/30 transition flex items-center gap-2"
          >
            Sim, apagar
          </button>
        </div>
      </div>
    </div>
  );
};

const NotificationModal = ({ notification, onClose }) => {
  if (!notification) return null;

  const { type, title, message } = notification;

  // Configuração visual baseada no tipo
  const config = {
    success: { icon: <CheckCircle size={28} />, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30", btn: "bg-green-600 hover:bg-green-700 shadow-green-500/30" },
    error:   { icon: <XCircle size={28} />,     color: "text-red-500",   bg: "bg-red-100 dark:bg-red-900/30",     btn: "bg-red-600 hover:bg-red-700 shadow-red-500/30" },
    warning: { icon: <AlertTriangle size={28} />, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/30", btn: "bg-amber-600 hover:bg-amber-700 shadow-amber-500/30" },
    info:    { icon: <Info size={28} />,        color: "text-blue-500",  bg: "bg-blue-100 dark:bg-blue-900/30",   btn: "bg-brand-600 hover:bg-brand-700 shadow-brand-500/30" }
  };

  const style = config[type] || config.info;

  // Fecha automaticamente após 3 segundos se for sucesso (opcional)
  // useEffect(() => { if(type === 'success') setTimeout(onClose, 3000); }, []);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 transform scale-100 transition-all" onClick={e => e.stopPropagation()}>
        <div className={`flex items-center gap-4 mb-4 ${style.color}`}>
          <div className={`p-3 rounded-full ${style.bg}`}>
            {style.icon}
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h3>
        </div>
        
        <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex justify-end">
          <button 
            onClick={onClose}
            className={`px-6 py-2.5 rounded-lg text-white font-bold shadow-lg transition flex items-center gap-2 ${style.btn}`}
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
};

// --- CONTROLLER ---
const AddEventController = ({ isAddingMode, onMapClick }) => {
  useMapEvents({
    click(e) {
      if (isAddingMode) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
};

function App() {
  const { theme, setTheme } = useTheme();
  const [focusPosition, setFocusPosition] = useState(null)
  const [isAddingMode, setIsAddingMode] = useState(false) 
  const [viewMode, setViewMode] = useState("map") 
  const [allEvents, setAllEvents] = useState([])
  const [mapEvents, setMapEvents] = useState(null)
  const [dateRange, setDateRange] = useState([-3000, 2025])
  const [selectedContinent, setSelectedContinent] = useState("Todos")
  const [searchTerm, setSearchTerm] = useState("")
  
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState("view")
  const [selectedEvent, setSelectedEvent] = useState(null)

  
  const [deleteData, setDeleteData] = useState(null); // Guarda { id, name } do evento a ser apagado
  const [isDeleting, setIsDeleting] = useState(false); // Para mostrar loading se quiser

  const [notification, setNotification] = useState(null); // { type: 'success'|'error'|'info', title: '', message: '' }
  
  const [newEvent, setNewEvent] = useState({ 
      name: "", description: "", content: "", 
      year_start: "", latitude: 0, longitude: 0, continent: "Outro" 
  })
  
  const [isPopulating, setIsPopulating] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const fileInputRef = useRef(null)

  const continents = ["Todos", "América do Sul", "América do Norte", "Europa", "África", "Ásia", "Oceania", "Antártida"]

  // --- DATA FETCHING ---
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

  // --- HANDLERS LÓGICOS ---

  // 1. INICIAR CRIAÇÃO (Botão +)
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

  // 2. ESCOLHER NO MAPA (Vindo do Modal)
  const handlePickFromMap = () => {
    setShowModal(false); // Esconde o modal temporariamente
    setViewMode('map');  // Força ir para o mapa
    setIsAddingMode(true); // Ativa a mira
  };

  // 3. CLIQUE NO MAPA
  const handleMapClick = (latlng) => {
    setIsAddingMode(false);
    // IMPORTANTE: Mantém os dados que o usuário já digitou (...prev), só atualiza lat/lon
    setNewEvent(prev => ({ 
        ...prev, 
        latitude: latlng.lat, 
        longitude: latlng.lng 
    }));
    setModalMode("create");
    setShowModal(true); // Reabre o modal
  };

  const handleSaveEvent = async () => {
    // Validação básica (opcional)
    if (!newEvent.name || !newEvent.year_start) {
        setNotification({ type: 'warning', title: 'Atenção', message: 'Preencha pelo menos o nome e o ano.' });
        return;
    }

    try {
      await axios.post('http://localhost:8000/events', newEvent);
      
      // SUCESSO LINDO
      setNotification({ type: 'success', title: 'Salvo!', message: 'O evento foi registrado no catálogo histórico com sucesso.' });
      
      setShowModal(false);
      refreshData();
    } catch (error) { 
      // ERRO LINDO
      setNotification({ type: 'error', title: 'Erro', message: 'Não foi possível salvar o evento. Verifique a conexão.' });
    }
  };

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setModalMode("view");
    setShowModal(true);
  };

  const handleWikiPopulate = async (mode) => {
    setShowMenu(false);
    setIsPopulating(true);
    try {
        await axios.post(`http://localhost:8000/populate?mode=${mode}`);
        
        // INFO LINDO
        setNotification({ type: 'info', title: 'Processando em Background', message: 'O robô está buscando dados no Wikidata e na Wikipédia. Isso pode levar alguns minutos. Os eventos aparecerão automaticamente.' });
        
        setTimeout(() => { setIsPopulating(false); refreshData(); }, 5000);
    } catch(e) { 
        setIsPopulating(false); 
        setNotification({ type: 'error', title: 'Falha na Conexão', message: 'Não foi possível iniciar o processo de população.' });
    }
  };

  // 1. O usuário clica na lixeira -> Abre o Modal
  const requestDelete = (evt) => {
    if (!evt.is_manual) {
        // AVISO LINDO
        setNotification({ type: 'warning', title: 'Ação Bloqueada', message: 'Este evento é protegido (origem Wikipédia) e não pode ser apagado.' });
        return;
    }
    setDeleteData({ id: evt.id, name: evt.name });
  };

  // 2. O usuário confirma no Modal -> Chama a API
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
      
      // SUCESSO DELEÇÃO
      setNotification({ type: 'success', title: 'Registro Apagado', message: 'O evento foi removido permanentemente da base de dados.' });

    } catch (error) {
      setNotification({ type: 'error', title: 'Erro', message: 'Houve um problema ao tentar apagar o registro.' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* SIDEBAR */}
      <nav className="w-20 bg-slate-800 dark:bg-slate-950 flex flex-col items-center py-6 gap-6 z-[1000] shadow-xl">
        <div className="p-3 bg-brand-600 rounded-xl shadow-lg shadow-brand-500/30"><span className="text-2xl">🌍</span></div>
        <div className="flex-1 flex flex-col gap-4 w-full px-2">
            <NavBtn active={viewMode === 'map'} onClick={() => { setViewMode('map'); setIsAddingMode(false); }} icon={<MapIcon size={24}/>} label="Mapa" />
            <NavBtn active={viewMode === 'table'} onClick={() => { setViewMode('table'); setIsAddingMode(false); }} icon={<List size={24}/>} label="Lista" />
            <NavBtn 
                active={isAddingMode} 
                onClick={handleAddStart} 
                icon={isAddingMode ? <X size={24} className="text-red-400"/> : <Plus size={24}/>} 
                label={isAddingMode ? "Cancelar" : "Novo"} 
            />
        </div>
        <div className="flex flex-col gap-2 mb-4 bg-slate-700/50 p-2 rounded-lg">
            <button onClick={() => setTheme('light')} className="p-2 text-slate-400 hover:text-white"><Sun size={18}/></button>
            <button onClick={() => setTheme('dark')} className="p-2 text-slate-400 hover:text-white"><Moon size={18}/></button>
        </div>
      </nav>

      {/* CONTEÚDO */}
      <main className="flex-1 relative flex flex-col">
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-6 gap-6 shadow-sm z-10">
           <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg">
             <Search size={18} className="text-slate-400"/>
             <input type="text" placeholder="Filtrar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-sm w-48 text-slate-700 dark:text-slate-200 placeholder-slate-400" />
           </div>
           <select value={selectedContinent} onChange={e => setSelectedContinent(e.target.value)} className="bg-slate-100 dark:bg-slate-700 border-none rounded-lg px-4 py-2 text-sm font-medium outline-none cursor-pointer">
             {continents.map(c => <option key={c} value={c}>{c}</option>)}
           </select>

            {/* --- NOVO: CONTADOR DE EVENTOS --- */}
            <div className="flex flex-col items-center leading-tight bg-brand-50 dark:bg-slate-900/50 px-3 py-1 rounded border border-brand-100 dark:border-slate-600">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Exibindo</span>
              <span className="text-sm font-black text-brand-600 dark:text-brand-400">
                {filteredEvents.length} eventos
              </span>
            </div>
            {/* -------------------------------- */}

           <div className="flex-1 px-4 flex items-center gap-4">
             <span className="text-xs font-bold text-slate-500">{dateRange[0]}</span>
             <Slider range min={-3000} max={2025} value={dateRange} onChange={setDateRange} trackStyle={[{ backgroundColor: '#0ea5e9' }]} handleStyle={[{ borderColor: '#0ea5e9', backgroundColor: '#fff', opacity: 1 }, { borderColor: '#0ea5e9', backgroundColor: '#fff', opacity: 1 }]} railStyle={{ backgroundColor: '#94a3b8' }} />
             <span className="text-xs font-bold text-slate-500">{dateRange[1]}</span>
           </div>
        </header>

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
                         click: () => { if (!isAddingMode) handleViewDetails(feature.properties); }
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
                                {evt.name}
                                {/* Indicador visual de manual (opcional, um pontinho verde) */}
                                {evt.is_manual && <span className="w-2 h-2 rounded-full bg-green-500" title="Inserido Manualmente"></span>}
                            </td>
                            <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{evt.period}</td>
                            <td className="p-4"><span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs font-bold">{evt.continent}</span></td>

                            {/* COLUNA DE AÇÕES */}
                            <td className="p-4 flex items-center gap-3">
                              <button onClick={() => handleViewDetails(evt)} className="text-sm text-brand-600 hover:text-brand-700 font-semibold hover:underline">
                                Ver detalhes
                              </button>

                              {/* SÓ MOSTRA O LIXO SE FOR MANUAL */}
                              {evt.is_manual && (
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); // Impede que abra o modal de detalhes ao clicar no lixo
                                    requestDelete(evt);  // <--- CHAMA A NOVA FUNÇÃO AQUI
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
                      </tbody>
                    </table>
                 </div>
               </div>
            </div>
          )}
        </div>
      </main>

      <aside className="w-96 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col z-20 shadow-xl">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
           <h2 className="font-bold text-lg">Cronologia</h2>
           <div className="relative">
             <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition"><Settings size={20}/></button>
             {showMenu && (
                <div className="absolute right-0 top-10 w-56 bg-white dark:bg-slate-700 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-600 p-2 flex flex-col gap-1 z-50">
                    <MenuBtn onClick={() => handleWikiPopulate('fast')} icon={<Download size={16}/>} label="Modo Turbo" />
                    <MenuBtn onClick={() => handleWikiPopulate('detailed')} icon={<Database size={16}/>} label="Varredura" />
                    <div className="h-px bg-slate-100 dark:bg-slate-600 my-1"></div>
                    <MenuBtn onClick={() => fileInputRef.current.click()} icon={<Plus size={16}/>} label="Importar JSON" />
                    <input type="file" accept=".json" ref={fileInputRef} className="hidden" onChange={() => {}} />
                </div>
             )}
           </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
           {filteredEvents.map((evt) => (
             <div key={evt.id} onClick={() => { handleViewDetails(evt); setFocusPosition([evt.latitude, evt.longitude]); }} className="group bg-white dark:bg-slate-700/30 p-4 rounded-xl border border-slate-100 hover:border-brand-500 cursor-pointer transition shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 group-hover:bg-brand-500 transition-colors"></div>
                <div className="pl-3"><h3 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-600">{evt.name}</h3><div className="flex items-center gap-2 mt-2"><span className="text-xs font-bold bg-brand-50 text-brand-600 px-2 py-0.5 rounded">{evt.year_start}</span><span className="text-xs text-slate-400 uppercase">{evt.continent}</span></div></div>
             </div>
           ))}
        </div>
      </aside>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
           <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold">{modalMode === 'view' ? 'Detalhes' : 'Novo Registro'}</h2>
                 <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">✕</button>
              </div>
              
              {modalMode === 'view' && selectedEvent ? (
                <div className="space-y-4">
                   <div className="flex items-baseline justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
                      <h1 className="text-2xl font-black text-brand-600 dark:text-brand-400">{selectedEvent.name}</h1>
                      <span className="font-mono text-lg font-bold text-slate-400">{selectedEvent.year_start}</span>
                   </div>
                   <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg"><span className="block text-xs text-slate-400 uppercase mb-1">Período</span><span className="font-semibold">{selectedEvent.period}</span></div>
                      <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg"><span className="block text-xs text-slate-400 uppercase mb-1">Continente</span><span className="font-semibold">{selectedEvent.continent}</span></div>
                   </div>
                   <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">{selectedEvent.description}</p>
                   {selectedEvent.content && <div className="bg-brand-50 dark:bg-slate-900/50 p-4 rounded-lg text-sm text-slate-700 dark:text-slate-300 leading-relaxed border border-brand-100 dark:border-slate-700 max-h-60 overflow-y-auto">{selectedEvent.content}</div>}
                </div>
              ) : (
                <div className="space-y-4">
                   <div><label className="block text-sm font-medium mb-1">Nome</label><input type="text" className="w-full p-2 rounded border dark:bg-slate-700 dark:border-slate-600" value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} /></div>
                   <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium mb-1">Ano</label><input type="number" className="w-full p-2 rounded border dark:bg-slate-700 dark:border-slate-600" value={newEvent.year_start} onChange={e => setNewEvent({...newEvent, year_start: e.target.value})} /></div>
                      <div><label className="block text-sm font-medium mb-1">Continente</label>
                        <select className="w-full p-2 rounded border dark:bg-slate-700 dark:border-slate-600" value={newEvent.continent} onChange={e => setNewEvent({...newEvent, continent: e.target.value})}>
                             {continents.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                   </div>
                   <div><label className="block text-sm font-medium mb-1">Descrição Curta</label><input type="text" className="w-full p-2 rounded border dark:bg-slate-700 dark:border-slate-600" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} /></div>
                   <div><label className="block text-sm font-medium mb-1">Resumo / História Completa</label><textarea rows="6" className="w-full p-2 rounded border dark:bg-slate-700 dark:border-slate-600" value={newEvent.content} onChange={e => setNewEvent({...newEvent, content: e.target.value})}></textarea></div>
                   
                   {/* ÁREA DE LOCALIZAÇÃO INTELIGENTE */}
                   <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                      <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-bold text-slate-500">Localização Geográfica</span>
                          {/* BOTÃO PARA SELECIONAR NO MAPA */}
                          <button onClick={handlePickFromMap} className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded hover:bg-brand-200 flex items-center gap-1">
                             <MapPin size={12}/> Selecionar no Mapa
                          </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                          <div><label>Latitude</label><input type="number" step="any" className="w-full p-1 rounded border" value={newEvent.latitude} onChange={e => setNewEvent({...newEvent, latitude: e.target.value})} /></div>
                          <div><label>Longitude</label><input type="number" step="any" className="w-full p-1 rounded border" value={newEvent.longitude} onChange={e => setNewEvent({...newEvent, longitude: e.target.value})} /></div>
                      </div>
                   </div>

                   <button onClick={handleSaveEvent} className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold shadow-lg shadow-brand-500/30 transition">💾 Salvar Registro</button>
                </div>
              )}
           </div>
        </div>
      )}
      <ConfirmModal 
        isOpen={!!deleteData} // Abre se tiver dados para deletar
        onClose={() => setDeleteData(null)}
        onConfirm={confirmDelete}
        title="Excluir Registro?"
        message={`Você está prestes a apagar permanentemente o evento histórico "${deleteData?.name}". Esta ação não pode ser desfeita.`}
      />

      <NotificationModal 
         notification={notification} 
         onClose={() => setNotification(null)} 
      />

    </div>
  )
}

const NavBtn = ({ active, onClick, icon, label }) => (
    <button onClick={onClick} className={`w-full aspect-square flex flex-col items-center justify-center gap-1 rounded-xl transition ${active ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
    </button>
)

const MenuBtn = ({ onClick, icon, label }) => (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg text-left transition">
        {icon} {label}
    </button>
)

export default App