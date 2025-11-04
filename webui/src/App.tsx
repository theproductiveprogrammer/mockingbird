import { Toaster } from 'react-hot-toast';
import { Header } from './components/layout/Header';
import { FilterBar } from './components/layout/FilterBar';
import { TrafficStream } from './components/traffic/TrafficStream';
import { TrafficDetails } from './components/traffic/TrafficDetails';
import { useAppStore } from './stores/appStore';
import { useTrafficSSE } from './hooks/useTrafficSSE';

function App() {
  const { currentView, selectedTrafficId } = useAppStore();

  // Connect to SSE stream
  useTrafficSSE();

  return (
    <div className="h-screen flex flex-col bg-white">
      <Header />

      {currentView === 'traffic' && <FilterBar />}

      <div className="flex-1 overflow-hidden">
        {currentView === 'traffic' && (
          <>
            {selectedTrafficId ? <TrafficDetails /> : <TrafficStream />}
          </>
        )}

        {currentView === 'rules' && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Rules view - Coming soon</p>
          </div>
        )}

        {currentView === 'stats' && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Stats view - Coming soon</p>
          </div>
        )}

        {currentView === 'config' && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Config view - Coming soon</p>
          </div>
        )}
      </div>

      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;
