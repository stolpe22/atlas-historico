import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, LayersControl } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import axios from 'axios'
import 'leaflet/dist/leaflet.css'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'
import './App.css'
import L from 'leaflet'
import MapFix from './MapFix'
import FlyTo from './FlyTo'

// --- Ícones Customizados ---
const createLabelIcon = (name, year) => {
  const yearDisplay = year < 0 ? `${Math.abs(year)} a.C.` : `${year}`;
  return L.divIcon({
    className: 'custom-map-label', 
    html: `<div class="label-content">
             <span class="map-label-year">${yearDisplay}</span>
             <span class="map-label-name">${name}</span>
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

function App() {
  const [mapEvents, setMapEvents] = useState(null)
  const [allEvents, setAllEvents] = useState([])
  const [dateRange, setDateRange] = useState([1500, 2025]) 
  const [focusPosition, setFocusPosition] = useState(null)
  const [selectedContinent, setSelectedContinent] = useState("Todos")
  const [searchTerm, setSearchTerm] = useState("")
  
  // Controle de Loading, Menu e Sincronização
  const [isPopulating, setIsPopulating] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false) // <--- NOVO: Controla a barra de progresso
  const [showMenu, setShowMenu] = useState(false)
  const fileInputRef = useRef(null)

  const continents = ["Todos", "América do Sul", "América do Norte", "Europa", "África", "Ásia", "Oceania", "Antártida"]

  // --- LÓGICA DE FILTRAGEM ---
  const filteredEvents = allEvents.filter(e => {
    const matchesContinent = selectedContinent === "Todos" || e.continent === selectedContinent;
    const matchesDate = e.year_start >= dateRange[0] && e.year_start <= dateRange[1];
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
        e.name.toLowerCase().includes(searchLower) || 
        e.year_start.toString().includes(searchLower);

    return matchesContinent && matchesDate && matchesSearch;
  });

  // Função auxiliar para atualizar dados
  const refreshData = () => {
    // 1. Atualiza lista lateral
    axios.get('http://localhost:8000/events/all')
      .then(res => setAllEvents(res.data))
      .catch(err => console.error("Erro lista:", err));

    // 2. Atualiza mapa
    let url = `http://localhost:8000/events?start_year=${dateRange[0]}&end_year=${dateRange[1]}`
    if (selectedContinent !== "Todos") {
      url += `&continent=${selectedContinent}`
    }
    axios.get(url)
      .then(res => setMapEvents(res.data))
      .catch(err => console.error("Erro mapa:", err));
  };

  // Carga Inicial
  useEffect(() => {
    refreshData();
  }, []) // Apenas na montagem

  // Atualiza mapa quando filtros mudam
  useEffect(() => {
    let url = `http://localhost:8000/events?start_year=${dateRange[0]}&end_year=${dateRange[1]}`
    if (selectedContinent !== "Todos") {
      url += `&continent=${selectedContinent}`
    }
    axios.get(url)
      .then(res => setMapEvents(res.data))
      .catch(err => console.error("Erro mapa:", err))
  }, [dateRange, selectedContinent])

  const handleEventClick = (event) => {
    setFocusPosition([event.latitude, event.longitude]);
    if (event.year_start < dateRange[0] || event.year_start > dateRange[1]) {
       setDateRange([event.year_start - 50, event.year_start + 50])
    }
  }

  const handleInputChange = (index, value) => {
    const newRange = [...dateRange];
    newRange[index] = value === '' ? '' : Number(value);
    setDateRange(newRange);
  };

  // --- FUNÇÕES DO MENU ---

  // 1. WIKIDATA (Com Polling Automático)
  const handleWikiPopulate = async () => {
    setShowMenu(false);
    
    // Dispara o backend
    try {
      setIsPopulating(true);
      await axios.post('http://localhost:8000/populate');
      
      // Inicia o Modo Sincronização
      setIsSyncing(true);
      
      // Polling: Atualiza o mapa a cada 2.5 segundos
      const intervalId = setInterval(() => {
         refreshData(); // Puxa dados novos do backend
         console.log("🔄 Sincronizando dados...");
      }, 2500);

      // Para de atualizar depois de 45 segundos (tempo estimado)
      setTimeout(() => {
        clearInterval(intervalId);
        setIsSyncing(false);
        setIsPopulating(false);
        alert("✅ Sincronização concluída! Os novos eventos já estão no mapa.");
      }, 45000);

    } catch (error) {
      console.error(error);
      alert("Erro ao conectar com servidor.");
      setIsPopulating(false);
    }
  };

  // 2. IMPORTAÇÃO JSON
  const handleJsonUpload = (e) => {
    setShowMenu(false);
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        if (!Array.isArray(jsonData)) {
          alert("Erro: O JSON deve ser uma lista [].");
          return;
        }

        setIsPopulating(true);
        const res = await axios.post('http://localhost:8000/events/import', jsonData);
        
        // MENSAGEM MELHORADA
        alert(
            `✅ Processamento Concluído!\n\n` +
            `📥 Importados (Novos): ${res.data.imported_count}\n` +
            `⏭️ Pulados (Duplicados): ${res.data.skipped_count}`
        );
        
        refreshData();
        
      } catch (err) {
        console.error(err);
        alert("Erro no JSON.");
      } finally {
        setIsPopulating(false);
      }
    };
    reader.readAsText(file);
    e.target.value = null; 
  };

  return (
    <div className="app-container">
      
      <div className="sidebar">
        <h2>
          Atlas Histórico
          <span className="event-count-badge">
            {filteredEvents.length} eventos
          </span>
        </h2>
        
        {/* --- MENU DROPDOWN --- */}
        <div className="actions-container">
          
          {/* Se estiver sincronizando, mostra barra de loading. Se não, mostra botão. */}
          {isSyncing ? (
            <div className="sync-status-bar">
              <div className="spinner"></div>
              <span>Buscando na Wikidata... (Aguarde)</span>
            </div>
          ) : (
            <button 
              className="action-btn" 
              onClick={() => setShowMenu(!showMenu)}
              disabled={isPopulating}
            >
              {isPopulating ? "⏳ Iniciando..." : "⚙️ Gerenciar Dados ▾"}
            </button>
          )}

          {showMenu && !isSyncing && (
            <div className="dropdown-menu">
              <button onClick={handleWikiPopulate}>
                🌍 Baixar da Wikidata (Auto)
              </button>
              <button onClick={() => fileInputRef.current.click()}>
                📂 Importar JSON Manual
              </button>
              <input 
                type="file" 
                accept=".json" 
                ref={fileInputRef} 
                style={{display: 'none'}} 
                onChange={handleJsonUpload}
              />
            </div>
          )}
        </div>

        <div className="search-container">
          <input 
            type="text" 
            placeholder="🔍 Buscar evento ou ano..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sidebar-search"
          />
        </div>

        <div className="event-list">
          {filteredEvents.map((evt) => (
            <div key={evt.id} className="event-item" onClick={() => handleEventClick(evt)}>
              <div className="event-name">{evt.name}</div>
              <div className="event-meta">
                <span className="meta-year">
                    📅 {evt.year_start < 0 ? `${Math.abs(evt.year_start)} a.C.` : `${evt.year_start}`}
                </span>
                {evt.continent && <span className="meta-continent">{evt.continent}</span>}
              </div>
            </div>
          ))}
          {filteredEvents.length === 0 && (
            <div style={{padding: '20px', textAlign: 'center', color: '#94a3b8'}}>
              {isSyncing ? "Chegando dados..." : "Nenhum evento encontrado."}
            </div>
          )}
        </div>
      </div>

      <div className="map-wrapper">
        <div className="controls-range">
          <select 
            value={selectedContinent} 
            onChange={(e) => setSelectedContinent(e.target.value)}
            className="compact-select"
          >
            {continents.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <div className="divider"></div>

          <div className="date-inputs-wrapper">
            <div className="input-group">
                <label>De:</label>
                <input 
                    type="number" 
                    value={dateRange[0]} 
                    onChange={(e) => handleInputChange(0, e.target.value)}
                    className="year-input"
                />
            </div>
            <div className="slider-wrapper">
                <Slider 
                    range 
                    min={-3000} 
                    max={2025} 
                    value={dateRange}
                    onChange={setDateRange}
                    trackStyle={[{ backgroundColor: '#3498db' }]}
                    handleStyle={[{ borderColor: '#3498db', height: 18, width: 18, marginTop: -7 }, { borderColor: '#3498db', height: 18, width: 18, marginTop: -7 }]}
                    railStyle={{ backgroundColor: '#e2e8f0', height: 4 }}
                />
            </div>
            <div className="input-group">
                <label>Até:</label>
                <input 
                    type="number" 
                    value={dateRange[1]} 
                    onChange={(e) => handleInputChange(1, e.target.value)}
                    className="year-input"
                />
            </div>
          </div>
        </div>

        <MapContainer center={[-14.23, -51.92]} zoom={4} maxZoom={18}>
          <MapFix />
          <FlyTo position={focusPosition} zoom={14} /> 

          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Mapa Limpo">
              <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"/>
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satélite">
              <TileLayer attribution='Tiles &copy; Esri' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"/>
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Modo Escuro">
              <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"/>
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Topográfico (Atlas)">
              <TileLayer attribution='Tiles &copy; Esri' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"/>
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="National Geographic">
              <TileLayer attribution='Tiles &copy; Esri &mdash; National Geographic' url="https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}"/>
            </LayersControl.BaseLayer>
          </LayersControl>
          
          <MarkerClusterGroup 
            chunkedLoading 
            iconCreateFunction={createClusterCustomIcon}
            maxClusterRadius={40}
            spiderfyOnMaxZoom={true}
            spiderfyDistanceMultiplier={3}
          >
            {mapEvents && mapEvents.features.map((feature) => (
              <Marker 
                  key={feature.properties.id}
                  position={[feature.geometry.coordinates[1], feature.geometry.coordinates[0]]}
                  icon={createLabelIcon(feature.properties.name, feature.properties.year)}
              >
                <Popup>
                  <strong>{feature.properties.name}</strong><br />
                  {feature.properties.description}<br />
                  <hr style={{margin: '5px 0', opacity: 0.5}}/>
                  <em>{feature.properties.year} - {feature.properties.continent}</em>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>
    </div>
  )
}

export default App