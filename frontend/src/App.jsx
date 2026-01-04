import { useState, useEffect, useRef } from 'react'
import api from './services/api';

import 'leaflet/dist/leaflet.css'
import 'rc-slider/assets/index.css'

// --- COMPONENTES ---
import Header from './components/layout/Header'
import MainMap from './components/map/MainMap' 
import ListView from './components/list/ListView'
import EventModal from './components/modals/EventModal'
import { ConfirmModal, NotificationModal } from './components/modals/SupportModals'
import { PopulateModal } from './components/modals/PopulateModal' // Importando do arquivo novo

// --- HOOKS E UTILITÁRIOS ---
import { useTheme } from './useTheme'

// --- ÍCONES UI (Adicionado Square para o botão de Stop) ---
import { Map as MapIcon, List, Plus, Settings, Moon, Sun, Download, Database, X, Monitor, Square } from 'lucide-react'

// ============================================================================
// COMPONENTES AUXILIARES (BOTÕES DA SIDEBAR)
// ============================================================================
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

// ============================================================================
// COMPONENTE PRINCIPAL (APP)
// ============================================================================
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
  
  // --- NOVO SISTEMA DE LOGS DO ROBÔ ---
  const [populateLogs, setPopulateLogs] = useState([]); // Array para o terminal
  const [isPopulating, setIsPopulating] = useState(false)
  
  // --- ESTADOS DE MODAIS ---
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState("view")
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showPopulateModal, setShowPopulateModal] = useState(false);
  const [populateMode, setPopulateMode] = useState("fast");
  
  // --- ESTADOS DE NOTIFICAÇÃO/DELEÇÃO ---
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState(null); 

  // --- FORMULÁRIO ---
  const [newEvent, setNewEvent] = useState({ name: "", description: "", content: "", year_start: "", latitude: 0, longitude: 0, continent: "Outro" })
  const fileInputRef = useRef(null)
  
  const continents = ["Todos", "América do Sul", "América do Norte", "Europa", "África", "Ásia", "Oceania", "Antártida"]

  // ==========================================================================
  // CARREGAMENTO DE DADOS (FETCHING)
  // ==========================================================================
  const refreshData = () => {
    api.get('/events/all').then(res => setAllEvents(res.data));
    
    let url = `/events?start_year=${dateRange[0]}&end_year=${dateRange[1]}`
    if (selectedContinent !== "Todos") url += `&continent=${selectedContinent}`;
    api.get(url).then(res => setMapEvents(res.data));
  };

  useEffect(() => { refreshData(); }, [dateRange, selectedContinent]);

  const filteredEvents = allEvents.filter(e => {
    const matchesContinent = selectedContinent === "Todos" || e.continent === selectedContinent;
    const matchesDate = e.year_start >= dateRange[0] && e.year_start <= dateRange[1];
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = e.name.toLowerCase().includes(searchLower);
    return matchesContinent && matchesDate && matchesSearch;
  });

  // ==========================================================================
  // LÓGICA DE POPULAÇÃO (ROBÔ - POLLING)
  // ==========================================================================
  useEffect(() => {
    let interval;
    if (isPopulating) {
      interval = setInterval(async () => {
        try {
          const res = await api.get('/populate/status');
          const newMessage = res.data.message;
          
          // Adiciona ao log apenas se for mensagem nova
          setPopulateLogs(prevLogs => {
             const lastLog = prevLogs[prevLogs.length - 1];
             if (newMessage && newMessage !== lastLog) {
                 return [...prevLogs, newMessage];
             }
             return prevLogs;
          });

          refreshData(); 

          if (res.data.is_running === false) {
             setIsPopulating(false);
             // Fecha modal e reseta logs no final
             setShowPopulateModal(false); 
             setNotification({ type: 'success', title: 'Concluído!', message: res.data.message });
             refreshData(); 
          }
        } catch (e) { console.error(e); }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPopulating]);

  // Abre Modal
  const openPopulateConfig = (mode) => {
    setPopulateMode(mode);
    setShowMenu(false);
    setShowPopulateModal(true);
  };

  // Iniciar Extração
  const runPopulate = async (config) => {
    // NÃO FECHAR O MODAL AQUI. Deixe ele aberto para ver o log.
    try {
        await api.post('/populate', {
            mode: populateMode, 
            continents: config.continents, 
            start_year: config.start_year, 
            end_year: config.end_year
        });
        
        setIsPopulating(true);
        setPopulateLogs(["🚀 Inicializando subsistemas...", "⏳ Enviando configuração ao servidor..."]);
    } catch (error) {
        setNotification({ type: 'error', title: 'Erro', message: 'Falha ao iniciar o processo.' });
        setIsPopulating(false);
    }
  };

  // NOVA FUNÇÃO: Dispara o Preset
  const handleRunSeed = async () => {
    setShowMenu(false); // Fecha o menu
    try {
      await api.post('/populate/seed');
      
      // Ativa o modo de "Populating" para mostrar o feedback visual no canto da tela
      setIsPopulating(true);
      setPopulateLogs(["📂 Iniciando carga de dados padrão...", "Aguarde..."]);
    } catch (error) {
      setNotification({ type: 'error', title: 'Erro', message: 'Falha ao iniciar preset.' });
    }
  };

  // Parar Extração
  // Parar Extração
  const handleStopPopulate = async () => {
    try {
      // Feedback visual imediato no log antes mesmo da requisição ir
      setPopulateLogs(prev => [...prev, "🛑 Enviando sinal de parada..."]); 
      
      await api.post('/populate/stop');
      
      setPopulateLogs(prev => [...prev, "⏳ Aguardando a Wikidata liberar o processo..."]);
    } catch (error) {
      console.error("Erro ao tentar parar:", error);
      setNotification({ type: 'error', title: 'Erro', message: 'Não foi possível parar.' });
    }
  };

  // ==========================================================================
  // HANDLERS GERAIS
  // ==========================================================================

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

  const handleMarkerClick = (eventData) => {
    setSelectedEvent(eventData);
    setModalMode("view");
    setShowModal(true);
  };

  const handleSaveEvent = async () => {
    if (!newEvent.name || !newEvent.year_start) {
        setNotification({ type: 'warning', title: 'Atenção', message: 'Preencha nome e ano.' });
        return;
    }
    try {
      await api.post('/events', newEvent);
      setNotification({ type: 'success', title: 'Salvo!', message: 'Evento registrado com sucesso.' });
      setShowModal(false);
      refreshData();
    } catch (error) { 
      setNotification({ type: 'error', title: 'Erro', message: 'Falha ao salvar.' });
    }
  };

  const requestDelete = (evt) => {
    if (evt.source !== 'manual') {
        setNotification({ 
            type: 'warning', 
            title: 'Ação Bloqueada', 
            message: 'Apenas eventos criados manualmente podem ser excluídos. Registros oficiais (Wikidata/Fixo) são protegidos.' 
        });
        return;
    }
    setDeleteData({ id: evt.id, name: evt.name });
  };

  const confirmDelete = async () => {
    if (!deleteData) return;
    setIsDeleting(true);
    try {
      await api.delete(`/events/${deleteData.id}`);
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

  // ==========================================================================
  // RENDERIZAÇÃO
  // ==========================================================================
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* 1. SIDEBAR ESQUERDA */}
      <nav className="w-20 bg-slate-800 dark:bg-slate-950 flex flex-col items-center py-6 gap-6 z-[1000] shadow-xl">
        <div className="p-3 bg-brand-600 rounded-xl shadow-lg shadow-brand-500/30">
            <span className="text-2xl">🌍</span>
        </div>
        
        <div className="flex-1 flex flex-col gap-4 w-full px-2">
            <NavBtn active={viewMode === 'map'} onClick={() => { setViewMode('map'); setIsAddingMode(false); }} icon={<MapIcon size={24}/>} label="Mapa" />
            <NavBtn active={viewMode === 'table'} onClick={() => { setViewMode('table'); setIsAddingMode(false); }} icon={<List size={24}/>} label="Lista" />
            <NavBtn active={isAddingMode} onClick={handleAddStart} icon={isAddingMode ? <X size={24} className="text-red-400"/> : <Plus size={24}/>} label={isAddingMode ? "Cancelar" : "Novo"} />
        </div>

        <div className="flex flex-col gap-2 mb-4 bg-slate-700/50 p-2 rounded-lg">
            <button onClick={() => setTheme('light')} className={`p-2 rounded ${theme === 'light' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}><Sun size={18}/></button>
            <button onClick={() => setTheme('dark')} className={`p-2 rounded ${theme === 'dark' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}><Moon size={18}/></button>
            <button onClick={() => setTheme('system')} className={`p-2 rounded ${theme === 'system' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}><Monitor size={18}/></button>
        </div>
      </nav>

      {/* 2. ÁREA PRINCIPAL */}
      <main className="flex-1 relative flex flex-col">
        <Header 
            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            selectedContinent={selectedContinent} setSelectedContinent={setSelectedContinent}
            dateRange={dateRange} setDateRange={setDateRange}
            filteredCount={filteredEvents.length} continents={continents}
        />

        {/* --- MINI PLAYER FLUTUANTE (CANTO INFERIOR DIREITO) --- */}
        {isPopulating && (
            <div className="absolute bottom-6 right-6 z-[2000] animate-in slide-in-from-bottom-4 duration-300">
               <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs py-2 px-3 rounded-lg shadow-2xl border border-slate-700 flex flex-col gap-2 min-w-[300px] max-w-[350px]">
                  
                  {/* Topo do Mini-Player */}
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                     <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-wider">
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-400 border-t-transparent"></div>
                        Extraindo Dados
                     </div>
                     <div className="flex gap-1">
                        <button onClick={() => setShowPopulateModal(true)} title="Maximizar" className="p-1 hover:bg-slate-700 rounded"><Monitor size={14}/></button>
                        <button onClick={handleStopPopulate} title="Parar" className="p-1 hover:bg-red-900/50 text-red-400 rounded"><Square size={14} fill="currentColor"/></button>
                     </div>
                  </div>

                  {/* Última linha do Log */}
                  <div className="font-mono text-slate-300 truncate">
                     {populateLogs[populateLogs.length - 1] || "Aguardando resposta..."}
                  </div>
               </div>
            </div>
        )}

        <div className="flex-1 relative overflow-hidden">
          {viewMode === 'map' ? (
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
               onViewDetails={(evt) => { setSelectedEvent(evt); setModalMode("view"); setShowModal(true); }}
               onDelete={requestDelete}
            />
          )}
        </div>
      </main>

      {/* 3. SIDEBAR DIREITA */}
      <aside className="...">
        <div className="p-6 border-b ... flex justify-between items-center ...">
           <h2 className="font-bold text-lg">Cronologia</h2>
           <div className="relative">
             <button onClick={() => setShowMenu(!showMenu)} className="..."><Settings size={20}/></button>
             
             {/* MENU DROPDOWN ATUALIZADO */}
             {showMenu && (
                <div className="absolute right-0 top-10 w-64 bg-white dark:bg-slate-700 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-600 p-2 flex flex-col gap-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    
                    {/* BOTÃO 1: DADOS PADRÃO */}
                    <MenuBtn 
                        onClick={handleRunSeed} 
                        icon={<Database size={16} className="text-purple-500"/>} 
                        label="Inserir Dados Padrão (Seed)" 
                    />
                    
                    <div className="h-px bg-slate-100 dark:bg-slate-600 my-1"></div>

                    {/* BOTÃO 2: WIKIDATA */}
                    <MenuBtn 
                        onClick={() => openPopulateConfig('fast')} 
                        icon={<Download size={16} className="text-blue-500"/>} 
                        label="Extrair da Wikidata (Robô)" 
                    />

                    <div className="h-px bg-slate-100 dark:bg-slate-600 my-1"></div>
                    
                    {/* BOTÃO 3: IMPORTAR JSON (Arquivo local) */}
                    <MenuBtn 
                        onClick={() => fileInputRef.current.click()} 
                        icon={<Plus size={16} className="text-green-500"/>} 
                        label="Importar Arquivo JSON" 
                    />
                    <input type="file" accept=".json" ref={fileInputRef} className="hidden" onChange={() => {}} />
                </div>
             )}
           </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
           {filteredEvents.map((evt) => (
             <div key={evt.id} 
                  onClick={() => { setSelectedEvent(evt); setModalMode("view"); setShowModal(true); setFocusPosition([evt.latitude, evt.longitude]); }} 
                  className="group bg-white dark:bg-slate-700/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-brand-500 cursor-pointer transition shadow-sm relative overflow-hidden"
             >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 group-hover:bg-brand-500 transition-colors"></div>
                <div className="pl-3">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-600">{evt.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-bold bg-brand-50 text-brand-600 px-2 py-0.5 rounded">{evt.year_start}</span>
                        <span className="text-xs text-slate-400 uppercase">{evt.continent}</span>
                    </div>
                </div>
             </div>
           ))}
        </div>
      </aside>

      {/* 4. MODAIS */}
      <EventModal 
        isOpen={showModal} onClose={() => setShowModal(false)}
        mode={modalMode} eventData={selectedEvent}
        newEvent={newEvent} setNewEvent={setNewEvent}
        onSave={handleSaveEvent}
        onPickFromMap={() => { setShowModal(false); setViewMode('map'); setIsAddingMode(true); }}
        continents={continents}
      />
      
      <ConfirmModal 
        isOpen={!!deleteData} onClose={() => setDeleteData(null)} 
        onConfirm={confirmDelete} 
        title="Excluir Registro?" 
        message={`Você está prestes a apagar permanentemente "${deleteData?.name}".`} 
      />
      
      <PopulateModal 
        isOpen={showPopulateModal} 
        onClose={() => setShowPopulateModal(false)}
        onConfirm={runPopulate} 
        isLoading={isPopulating} 
        logs={populateLogs} // <--- Passando o array de logs correto
        onStop={handleStopPopulate} 
      />

      <NotificationModal 
        notification={notification} onClose={() => setNotification(null)} 
      />

    </div>
  )
}

export default App