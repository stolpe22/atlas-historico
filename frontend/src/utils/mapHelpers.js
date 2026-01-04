import L from 'leaflet';
import { formatYearRange } from './formatters';

/**
 * Cria ícone de label para marcador no mapa
 */
export const createLabelIcon = (name, yearStart, yearEnd) => {
  const dateDisplay = formatYearRange(yearStart, yearEnd); // <--- Usa o formatador de intervalo
  
  const html = `
    <div class="flex flex-col items-center transform -translate-y-full cursor-pointer group">
      <div class="flex flex-col items-center shadow-lg transition-transform group-hover:scale-110 duration-200">
        <span class="bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-t-md w-full text-center tracking-wide border-b border-brand-700 whitespace-nowrap">
          ${dateDisplay} 
        </span>
        <span class="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold px-3 py-1.5 rounded-b-md border border-slate-300 dark:border-slate-600 whitespace-nowrap">
          ${name}
        </span>
      </div>
      <div class="w-0 h-0 
                  border-l-[6px] border-l-transparent 
                  border-r-[6px] border-r-transparent 
                  border-t-[8px] 
                  border-t-white dark:border-t-slate-800
                  filter drop-shadow-sm -mt-[1px]">
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'bg-transparent border-none',
    html,
    iconSize: [150, 60],
    iconAnchor: [75, 55]
  });
};

/**
 * Cria ícone customizado para cluster de marcadores
 */
export const createClusterCustomIcon = (cluster) => {
  const count = cluster.getChildCount();
  
  return L.divIcon({
    html: `
      <div class="w-10 h-10 rounded-full bg-brand-600/90 text-white flex items-center justify-center font-bold text-sm shadow-xl border-2 border-white dark:border-slate-800 ring-2 ring-brand-600/30">
        ${count}
      </div>
    `,
    className: 'bg-transparent border-none',
    iconSize: L.point(40, 40, true),
  });
};