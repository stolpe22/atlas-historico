import React from 'react';
import { MapContainer, TileLayer, Marker, LayersControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Map as MapIcon, X } from 'lucide-react';

import MapFix from './MapFix';
import FlyTo from './FlyTo';
import MapController from './MapController';
import { createLabelIcon, createClusterCustomIcon } from '../../utils/mapHelpers';
import { MAP_CONFIG } from '../../utils/constants';

import 'leaflet/dist/leaflet.css';

const MAP_LAYERS = {
  light: {
    name: "Claro",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  dark:  {
    name:  "Escuro",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  satellite: {
    name: "Satélite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:  'Tiles &copy; Esri'
  }
};

const MainMap = ({ 
  events, 
  focusPosition, 
  isAddingMode, 
  onMapClick, 
  onMarkerClick 
}) => {
  const mapContainerClasses = `
    relative h-full w-full bg-slate-200 dark:bg-slate-900
    [&_.leaflet-control-layers]:bg-white 
    [&_.leaflet-control-layers]:text-slate-800
    [&_.leaflet-control-layers]:shadow-lg
    [&_.leaflet-control-layers]: border-slate-200
    [&_.leaflet-control-zoom-in]:bg-white
    [&_.leaflet-control-zoom-in]:text-slate-800
    [&_.leaflet-control-zoom-in]:border-slate-300
    [&_.leaflet-control-zoom-out]:bg-white
    [&_.leaflet-control-zoom-out]:text-slate-800
    [&_.leaflet-control-zoom-out]: border-slate-300
    [&_.leaflet-control-layers]:dark:bg-slate-800 
    [&_.leaflet-control-layers]:dark:text-slate-200
    [&_.leaflet-control-layers]:dark:border-none
    [&_.leaflet-control-zoom-in]:dark: bg-slate-800
    [&_.leaflet-control-zoom-in]:dark:text-slate-200
    [&_.leaflet-control-zoom-in]:dark:border-slate-600
    [&_.leaflet-control-zoom-out]:dark:bg-slate-800
    [&_.leaflet-control-zoom-out]: dark:text-slate-200
    [&_.leaflet-control-zoom-out]:dark: border-slate-600
    [&_.leaflet-control-layers-toggle]:dark:invert
  `;

  return (
    <div className={mapContainerClasses}>
      
      <MapContainer 
        center={MAP_CONFIG.center} 
        zoom={MAP_CONFIG.zoom} 
        className={`h-full w-full outline-none ${isAddingMode ? 'cursor-crosshair' : ''}`}
      >
        <MapFix />
        <FlyTo position={focusPosition} />
        
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name={MAP_LAYERS.light.name}>
            <TileLayer 
              attribution={MAP_LAYERS.light.attribution}
              url={MAP_LAYERS.light.url}
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer name={MAP_LAYERS.dark.name}>
            <TileLayer 
              attribution={MAP_LAYERS.dark.attribution}
              url={MAP_LAYERS.dark.url}
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer name={MAP_LAYERS.satellite.name}>
            <TileLayer 
              attribution={MAP_LAYERS.satellite.attribution}
              url={MAP_LAYERS.satellite.url}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <MapController isAddingMode={isAddingMode} onMapClick={onMapClick} />

        <MarkerClusterGroup 
          chunkedLoading 
          iconCreateFunction={createClusterCustomIcon}
          maxClusterRadius={MAP_CONFIG.clusterRadius}
          spiderfyOnMaxZoom={true}
        >
          {events?.features?.map((feature) => (
            <Marker 
              key={feature.properties.id} 
              position={[
                feature.geometry.coordinates[1], 
                feature.geometry.coordinates[0]
              ]} 
              icon={createLabelIcon(
                feature.properties.name, 
                feature.properties.year,      // Backend manda como 'year'
                feature.properties.year_end   // Backend agora manda 'year_end'
              )}
              eventHandlers={{
                click: () => {
                  if (! isAddingMode) {
                    onMarkerClick(feature.properties);
                  }
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