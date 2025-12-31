import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

const MapFix = () => {
  const map = useMap();

  useEffect(() => {
    // Espera um pouquinho para o CSS carregar e força o mapa a recalcular o tamanho
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 100); // 100ms é suficiente

    return () => clearTimeout(timeout);
  }, [map]);

  return null;
};

export default MapFix;