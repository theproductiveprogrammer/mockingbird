import { Toaster } from 'react-hot-toast';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Header } from './components/layout/Header';
import { FilterBar } from './components/layout/FilterBar';
import { TrafficStream } from './components/traffic/TrafficStream';
import { TrafficDetails } from './components/traffic/TrafficDetails';
import { RulesView } from './components/rules/RulesView';
import { ConfigView } from './components/config/ConfigView';
import { StatsView } from './components/stats/StatsView';
import { useAppStore } from './stores/appStore';
import { useTrafficSSE } from './hooks/useTrafficSSE';
import { api } from './utils/api';

function App() {
  const location = useLocation();
  const { setCurrentView, setConfig } = useAppStore();

  // Connect to SSE stream
  useTrafficSSE();

  // Load config on app startup
  useEffect(() => {
    api.getConfig().then(setConfig).catch(console.error);
  }, [setConfig]);

  // Derive currentView from URL (single source of truth)
  const currentView = (() => {
    const path = location.pathname;
    if (path === '/rules') return 'rules';
    if (path === '/config') return 'config';
    if (path === '/stats') return 'stats';
    return 'traffic'; // Default for / and /traffic/:id
  })();

  // Sync store with derived view
  useEffect(() => {
    setCurrentView(currentView);
  }, [currentView, setCurrentView]);

  return (
    <div className="h-screen flex flex-col bg-white">
      <Header />

      {currentView === 'traffic' && <FilterBar />}

      <div className="flex-1 overflow-hidden flex flex-col bg-white">
        <Routes>
          <Route path="/" element={<TrafficStream />} />
          <Route path="/traffic/:id" element={<TrafficDetails />} />
          <Route path="/rules" element={<RulesView />} />
          <Route path="/config" element={<ConfigView />} />
          <Route path="/stats" element={<StatsView />} />
        </Routes>
      </div>

      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;
