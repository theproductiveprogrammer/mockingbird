import { Toaster } from 'react-hot-toast';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
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

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentView, setCurrentView } = useAppStore();

  // Connect to SSE stream
  useTrafficSSE();

  // Sync currentView with URL
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/traffic')) {
      setCurrentView('traffic');
    } else if (path === '/rules') {
      setCurrentView('rules');
    } else if (path === '/config') {
      setCurrentView('config');
    } else if (path === '/stats') {
      setCurrentView('stats');
    } else if (path === '/') {
      setCurrentView('traffic');
    }
  }, [location.pathname, setCurrentView]);

  // Sync URL with currentView
  useEffect(() => {
    if (currentView === 'traffic' && location.pathname === '/') {
      // Already on traffic view
      return;
    }
    if (currentView === 'rules' && location.pathname !== '/rules') {
      navigate('/rules');
    } else if (currentView === 'config' && location.pathname !== '/config') {
      navigate('/config');
    } else if (currentView === 'stats' && location.pathname !== '/stats') {
      navigate('/stats');
    }
  }, [currentView, location.pathname, navigate]);

  return (
    <div className="h-screen flex flex-col bg-white">
      <Header />

      {currentView === 'traffic' && <FilterBar />}

      <div className="flex-1 overflow-hidden flex flex-col">
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
