import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { ETLProvider } from './context/ETLContext';
import GlobalETLModal from './components/modals/GlobalETLModal';
import 'leaflet/dist/leaflet.css';

// Importe o hook CORRETO (verifique qual dos dois arquivos você quer manter)
import { useTheme } from './hooks/useTheme'; 

import AppNavigation from './components/layout/AppNavigation';
import MainPage from './pages/MainPage';
import SettingsPage from './pages/SettingsPage';

// Componente Wrapper para garantir que os hooks rodem DENTRO dos Providers
const AppContent = () => {
  // Agora sim, useTheme está DENTRO do ToastProvider e ETLProvider
  const { theme, setTheme } = useTheme();

  return (
    <BrowserRouter>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-300">
        <AppNavigation theme={theme} setTheme={setTheme} />
        
        <main className="flex-1 flex flex-col relative overflow-hidden">
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>

          <GlobalETLModal />
        </main>
      </div>
    </BrowserRouter>
  );
};

function App() {
  return (
    <ToastProvider>
      <ETLProvider>
        <AppContent />
      </ETLProvider>
    </ToastProvider>
  );
}

export default App;