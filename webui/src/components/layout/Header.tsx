import { useAppStore } from '../../stores/appStore';

export function Header() {
  const { currentView, setCurrentView, isConnected } = useAppStore();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">🐦 Mockingbird</h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentView('traffic')}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              currentView === 'traffic'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Traffic
          </button>

          <button
            onClick={() => setCurrentView('rules')}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              currentView === 'rules'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Rules"
          >
            ⚙️
          </button>

          <button
            onClick={() => setCurrentView('stats')}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              currentView === 'stats'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Statistics"
          >
            📊
          </button>

          <button
            onClick={() => setCurrentView('config')}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              currentView === 'config'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Configuration"
          >
            🔧
          </button>

          <div
            className={`flex items-center gap-2 text-sm ${
              isConnected ? 'text-green-600' : 'text-red-600'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current"></span>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </div>
    </header>
  );
}
