import { useMap } from 'react-leaflet';
import { useEffect } from 'react';

function FlyTo({ position, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      // O número 1.5 é a velocidade da animação (quanto maior, mais lento/suave)
      map.flyTo(position, zoom, {
        duration: 1.5
      });
    }
  }, [position, zoom, map]);

  return null;
}

export default FlyTo;