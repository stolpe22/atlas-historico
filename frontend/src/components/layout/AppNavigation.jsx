import React from 'react';
import { Map as MapIcon, Settings, Sun, Moon, Monitor } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import NavButton from './NavButton';

const ThemeSwitcher = ({ theme, setTheme }) => {
  const buttons = [
    { value: 'light', icon: Sun },
    { value:  'dark', icon: Moon },
    { value: 'system', icon: Monitor }
  ];

  return (
    <div className="flex flex-col gap-2 mb-4 bg-slate-700/50 p-2 rounded-lg mx-2">
      {buttons.map(({ value, icon:  Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`p-2 rounded transition-colors ${
            theme === value 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <Icon size={18} />
        </button>
      ))}
    </div>
  );
};

const AppNavigation = ({ theme, setTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="w-20 bg-slate-800 dark:bg-slate-950 flex flex-col items-center py-6 gap-6 z-[1000] shadow-xl border-r border-slate-700">
      {/* Logo */}
      <div 
        className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30 cursor-pointer hover:scale-105 transition"
        onClick={() => navigate('/')}
      >
        <span className="text-2xl">🌍</span>
      </div>
      
      {/* Links de Navegação */}
      <div className="flex-1 flex flex-col gap-4 w-full px-2">
        <NavButton 
          active={location.pathname === '/'} 
          onClick={() => navigate('/')} 
          icon={<MapIcon size={24} />} 
          label="Atlas" 
        />
        
        <div className="mt-auto">
             {/* O botão de Settings agora fica fixo na navegação global */}
             <NavButton 
              active={location.pathname === '/settings'} 
              onClick={() => navigate('/settings')} 
              icon={<Settings size={24} />} 
              label="Config" 
            />
        </div>
      </div>

      {/* Theme Switcher */}
      <ThemeSwitcher theme={theme} setTheme={setTheme} />
    </nav>
  );
};

export default AppNavigation;