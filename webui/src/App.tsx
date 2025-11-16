import { Toaster } from 'react-hot-toast';
import { Routes, Route, useLocation, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { Header } from './components/layout/Header';
import { FilterBar } from './components/layout/FilterBar';
import { TrafficStream } from './components/traffic/TrafficStream';
import { TrafficDetails } from './components/traffic/TrafficDetails';
import { RulesView } from './components/rules/RulesView';
import { ConfigView } from './components/config/ConfigView';
import { StatsView } from './components/stats/StatsView';
import { PluginsView } from './components/plugins/PluginsView';
import { WorkspaceSplash } from './components/workspaces/WorkspaceSplash';
import { useAppStore } from './stores/appStore';
import { useTrafficSSE } from './hooks/useTrafficSSE';
import { api } from './utils/api';

// Workspace UI wrapper - contains Header, FilterBar, and all workspace-specific views
function WorkspaceUI() {
  const location = useLocation();
  const { workspace } = useParams<{ workspace: string }>();
  const { setCurrentView, setConfig, setWorkspace, setWorkspaceBirdIcon } = useAppStore();

  // Set workspace in store and load workspace metadata (bird icon) when it changes
  useEffect(() => {
    setWorkspace(workspace || null);

    // Load workspace metadata to get bird icon
    if (workspace) {
      api.getWorkspaces().then(workspaces => {
        const currentWorkspace = workspaces.find(w => w.name === workspace);
        if (currentWorkspace) {
          setWorkspaceBirdIcon(currentWorkspace.bird_icon);
        }
      }).catch(console.error);
    } else {
      setWorkspaceBirdIcon(null);
    }
  }, [workspace, setWorkspace, setWorkspaceBirdIcon]);

  // Connect to SSE stream
  useTrafficSSE();

  // Load config on app startup
  useEffect(() => {
    api.getConfig().then(setConfig).catch(console.error);
  }, [setConfig]);

  // Derive currentView from URL (single source of truth)
  const currentView = (() => {
    const path = location.pathname;
    // Strip workspace prefix to get the actual view path
    const viewPath = path.replace(/^\/w\/[^\/]+/, '');
    if (viewPath === '/rules' || viewPath.startsWith('/rules')) return 'rules';
    if (viewPath === '/config' || viewPath.startsWith('/config')) return 'config';
    if (viewPath === '/stats' || viewPath.startsWith('/stats')) return 'stats';
    if (viewPath === '/plugins' || viewPath.startsWith('/plugins')) return 'plugins';
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
          <Route path="/plugins" element={<PluginsView />} />
        </Routes>
      </div>

      <Toaster position="bottom-right" />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<WorkspaceSplash />} />
      <Route path="/w/:workspace/*" element={<WorkspaceUI />} />
    </Routes>
  );
}

export default App;
