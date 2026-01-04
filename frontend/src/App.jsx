import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Styles
import 'leaflet/dist/leaflet.css';
import 'rc-slider/assets/index.css';

// Hooks
import { useTheme } from './hooks/useTheme';

// Layout
import AppNavigation from './components/layout/AppNavigation';

// Pages
import MainPage from './pages/MainPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  const { theme, setTheme } = useTheme();

  return (
    <BrowserRouter>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-300">
        
        {/* Navegação Global (Barra Esquerda) */}
        <AppNavigation theme={theme} setTheme={setTheme} />

        {/* Área de Conteúdo (Muda conforme a rota) */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
        
      </div>
    </BrowserRouter>
  );
}

export default App;