import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';

export function Header() {
  const navigate = useNavigate();
  const { currentView, isConnected } = useAppStore();

  return (
    <header className="bg-gray-50 border-b border-gray-200 px-6 py-2.5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 hover:opacity-70 transition-opacity"
        >
          <img src="/mockingbird.svg" alt="Mockingbird" className="w-5 h-5" />
          <h1 className="text-sm font-normal text-gray-800">Mockingbird</h1>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className={`px-2 py-1 text-xs font-normal rounded transition-colors ${
              currentView === 'traffic'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Traffic
          </button>

          <button
            onClick={() => navigate('/rules')}
            className={`px-2 py-1 text-xs font-normal rounded transition-colors ${
              currentView === 'rules'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            title="Rules"
          >
            ⚙️
          </button>

          <button
            onClick={() => navigate('/stats')}
            className={`px-2 py-1 text-xs font-normal rounded transition-colors ${
              currentView === 'stats'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            title="Statistics"
          >
            📊
          </button>

          <button
            onClick={() => navigate('/config')}
            className={`px-2 py-1 text-xs font-normal rounded transition-colors ${
              currentView === 'config'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            title="Configuration"
          >
            🔧
          </button>

          <div
            className={`flex items-center gap-1.5 text-xs ${
              isConnected ? 'text-green-600' : 'text-red-600'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </div>
    </header>
  );
}
