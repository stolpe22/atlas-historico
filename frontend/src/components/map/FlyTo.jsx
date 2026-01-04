import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { MAP_CONFIG } from '../../utils/constants';

const FlyTo = ({ position, zoom = MAP_CONFIG.flyToZoom }) => {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, zoom, { duration: 1.5 });
    }
  }, [position, zoom, map]);

  return null;
};

export default FlyTo;