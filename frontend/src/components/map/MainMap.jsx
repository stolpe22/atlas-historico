import React from 'react';
import { MapContainer, TileLayer, Marker, LayersControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import { Map as MapIcon, X } from 'lucide-react';

import MapFix from '../../MapFix'; 
import FlyTo from '../../FlyTo';
import { createLabelIcon, createClusterCustomIcon } from '../../utils/mapHelpers';
import MapController from './MapController';

const MainMap = ({ 
  events, focusPosition, isAddingMode, setIsAddingMode, onMapClick, onMarkerClick 
}) => {

  return (
    <div className="relative h-full w-full bg-slate-200 dark:bg-slate-900 
      
      {/* --- ESTILIZAÇÃO DOS CONTROLES DO LEAFLET --- */}
      
      {/* MODO CLARO (Default): Fundo Branco, Texto Escuro */}
      [&_.leaflet-control-layers]:bg-white 
      [&_.leaflet-control-layers]:text-slate-800
      [&_.leaflet-control-layers]:shadow-lg
      [&_.leaflet-control-layers]:border-slate-200
      
      [&_.leaflet-control-zoom-in]:bg-white
      [&_.leaflet-control-zoom-in]:text-slate-800
      [&_.leaflet-control-zoom-in]:border-slate-300
      [&_.leaflet-control-zoom-out]:bg-white
      [&_.leaflet-control-zoom-out]:text-slate-800
      [&_.leaflet-control-zoom-out]:border-slate-300

      {/* MODO ESCURO (Dark): Fundo Escuro, Texto Claro */}
      [&_.leaflet-control-layers]:dark:bg-slate-800 
      [&_.leaflet-control-layers]:dark:text-slate-200
      [&_.leaflet-control-layers]:dark:border-none
      
      [&_.leaflet-control-zoom-in]:dark:bg-slate-800
      [&_.leaflet-control-zoom-in]:dark:text-slate-200
      [&_.leaflet-control-zoom-in]:dark:border-slate-600
      [&_.leaflet-control-zoom-out]:dark:bg-slate-800
      [&_.leaflet-control-zoom-out]:dark:text-slate-200
      [&_.leaflet-control-zoom-out]:dark:border-slate-600

      {/* Ícone de Camadas Invertido no Dark Mode para ficar Branco */}
      [&_.leaflet-control-layers-toggle]:dark:invert
    ">
      
      {/* AVISO FLUTUANTE */}
      {isAddingMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[5000] bg-brand-600 text-white px-6 py-3 rounded-full shadow-xl font-bold animate-bounce cursor-default flex items-center gap-3">
            <MapIcon size={20} /> Clique no mapa para definir o local
            <button onClick={() => setIsAddingMode(false)} className="bg-white/20 hover:bg-white/40 rounded-full p-1 ml-2"><X size={14}/></button>
        </div>
      )}

      <MapContainer 
        center={[20, 0]} 
        zoom={2} 
        className={`h-full w-full outline-none ${isAddingMode ? 'cursor-crosshair' : ''}`}
      >
         <MapFix />
         <FlyTo position={focusPosition} zoom={6} />
         
         <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Claro">
                {/* CartoDB Voyager é o melhor para tema claro */}
                <TileLayer 
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
            </LayersControl.BaseLayer>
            
            <LayersControl.BaseLayer name="Escuro">
                {/* CartoDB Dark Matter para tema escuro */}
                <TileLayer 
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
            </LayersControl.BaseLayer>
            
            <LayersControl.BaseLayer name="Satélite">
                <TileLayer 
                    attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
            </LayersControl.BaseLayer>
         </LayersControl>

         <MapController isAddingMode={isAddingMode} onMapClick={onMapClick} />

         <MarkerClusterGroup 
            chunkedLoading 
            iconCreateFunction={createClusterCustomIcon}
            maxClusterRadius={60} // Aumente um pouco para agrupar mais agressivamente e reduzir elementos na tela
            spiderfyOnMaxZoom={true}
        >
           {events && events.features.map((feature) => (
             <Marker 
               key={feature.properties.id} 
               position={[feature.geometry.coordinates[1], feature.geometry.coordinates[0]]} 
               icon={createLabelIcon(feature.properties.name, feature.properties.year)}
               eventHandlers={{
                 click: () => { if (!isAddingMode) onMarkerClick(feature.properties); }
               }}
             />
           ))}
         </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};

export default MainMap;