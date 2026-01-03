import L from 'leaflet';

export const createLabelIcon = (name, year) => {
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

export const createClusterCustomIcon = (cluster) => {
  return L.divIcon({
    html: `<span class="cluster-icon">${cluster.getChildCount()}</span>`,
    className: 'custom-marker-cluster',
    iconSize: L.point(33, 33, true),
  });
};