import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../stores/appStore";

export function Header() {
  const navigate = useNavigate();
  const { currentView } = useAppStore();

  return (
    <header className="bg-gray-50 border-b border-gray-200 px-6 py-2.5">
      <div className="flex items-center justify-between">
        <div
          onClick={() => navigate("/")}
          className="flex items-center gap-2 hover:opacity-70 transition-opacity cursor-pointer"
        >
          <img src="/mockingbird.svg" alt="Mockingbird" className="w-5 h-5" />
          <h1 className="text-sm font-normal text-gray-800">Mockingbird</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className={`px-2 py-1 text-xs font-normal rounded transition-colors flex items-center gap-1 ${
              currentView === "traffic"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <img src="/traffic.svg" alt="Traffic" className="w-3.5 h-3.5" />
            Traffic
          </button>

          <button
            onClick={() => navigate("/rules")}
            className={`px-2 py-1 text-xs font-normal rounded transition-colors flex items-center gap-1 ${
              currentView === "rules"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <img src="/rules.svg" alt="Rules" className="w-3.5 h-3.5" />
            Rules
          </button>

          <button
            onClick={() => navigate("/stats")}
            className={`px-2 py-1 text-xs font-normal rounded transition-colors flex items-center gap-1 ${
              currentView === "stats"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
            title="Statistics"
          >
            <img src="/statistics.svg" alt="Stats" className="w-3.5 h-3.5" />
            Stats
          </button>

          <button
            onClick={() => navigate("/config")}
            className={`px-2 py-1 text-xs font-normal rounded transition-colors flex items-center gap-1 ${
              currentView === "config"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
            title="Configuration"
          >
            <img src="/settings.svg" alt="Config" className="w-3.5 h-3.5" />
            Config
          </button>
        </div>
      </div>
    </header>
  );
}
