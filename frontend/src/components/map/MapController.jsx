import { useMapEvents } from 'react-leaflet';

const MapController = ({ isAddingMode, onMapClick }) => {
  useMapEvents({
    click(e) {
      if (isAddingMode) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
};

export default MapController;