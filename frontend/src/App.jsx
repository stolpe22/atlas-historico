import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import 'rc-slider/assets/index.css';

import { useTheme } from './hooks/useTheme';
import AppNavigation from './components/layout/AppNavigation';
import MainPage from './pages/MainPage';
import SettingsPage from './pages/SettingsPage';

import { ToastProvider } from './context/ToastContext';

function App() {
  const { theme, setTheme } = useTheme();

  return (
    <ToastProvider>
      <BrowserRouter>
        <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-300">
          <AppNavigation theme={theme} setTheme={setTheme} />
          <main className="flex-1 flex flex-col relative overflow-hidden">
            <Routes>
              <Route path="/" element={<MainPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;