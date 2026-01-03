import React from 'react';
import { MapContainer, TileLayer, Marker, LayersControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import { Map as MapIcon, X } from 'lucide-react';

// Ajuste os caminhos conforme sua estrutura
import MapFix from '../../MapFix'; 
import FlyTo from '../../FlyTo';
import { createLabelIcon, createClusterCustomIcon } from '../../utils/mapHelpers';
import MapController from './MapController';

const MainMap = ({ 
  events,           // Lista de geojson/eventos
  focusPosition,    // Onde focar
  isAddingMode,     // Estado de adição
  setIsAddingMode,  // Função para cancelar adição
  onMapClick,       // Função ao clicar no mapa (adicionar)
  onMarkerClick     // Função ao clicar no marcador (ver detalhes)
}) => {

  return (
    <div className="relative h-full w-full
      {/* --- ESTILIZAÇÃO PROFUNDA DO LEAFLET (OVERRIDES) --- */}
      {/* Fundo e Texto do Controle de Camadas */}
      [&_.leaflet-control-layers]:dark:bg-slate-800 
      [&_.leaflet-control-layers]:dark:text-slate-200
      [&_.leaflet-control-layers]:border-none
      [&_.leaflet-control-layers]:shadow-xl
      
      /* Inverte a cor do ícone de camadas (quadradinho) para ficar branco no dark mode */
      [&_.leaflet-control-layers-toggle]:dark:invert
      
      /* Ajusta os Radio Buttons nativos */
      [&_input[type='radio']]:dark:accent-blue-500
      
      /* Ajusta os controles de Zoom (+ e -) */
      [&_.leaflet-control-zoom-in]:dark:bg-slate-800
      [&_.leaflet-control-zoom-in]:dark:text-slate-200
      [&_.leaflet-control-zoom-in]:dark:border-slate-600
      [&_.leaflet-control-zoom-out]:dark:bg-slate-800
      [&_.leaflet-control-zoom-out]:dark:text-slate-200
      [&_.leaflet-control-zoom-out]:dark:border-slate-600
    ">
      
      {/* AVISO FLUTUANTE DE MODO DE INSERÇÃO */}
      {isAddingMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[5000] bg-brand-600 text-white px-6 py-3 rounded-full shadow-xl font-bold animate-bounce cursor-default flex items-center gap-3">
            <MapIcon size={20} /> Clique no mapa para definir o local
            <button onClick={() => setIsAddingMode(false)} className="bg-white/20 hover:bg-white/40 rounded-full p-1 ml-2">
                <X size={14}/>
            </button>
        </div>
      )}

      {/* COMPONENTE DO MAPA */}
      <MapContainer 
        center={[20, 0]} 
        zoom={2} 
        className={`h-full w-full outline-none ${isAddingMode ? 'cursor-crosshair' : ''}`}
      >
         <MapFix />
         <FlyTo position={focusPosition} zoom={6} />
         
         <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Claro">
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"/>
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Escuro">
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"/>
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satélite">
                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"/>
            </LayersControl.BaseLayer>
         </LayersControl>

         {/* Controlador de Cliques */}
         <MapController isAddingMode={isAddingMode} onMapClick={onMapClick} />

         {/* Clusters e Marcadores */}
         <MarkerClusterGroup chunkedLoading iconCreateFunction={createClusterCustomIcon}>
           {events && events.features.map((feature) => (
             <Marker 
               key={feature.properties.id} 
               position={[feature.geometry.coordinates[1], feature.geometry.coordinates[0]]} 
               icon={createLabelIcon(feature.properties.name, feature.properties.year)}
               eventHandlers={{
                 click: () => { 
                    if (!isAddingMode) onMarkerClick(feature.properties); 
                 }
               }}
             />
           ))}
         </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};

export default MainMap;