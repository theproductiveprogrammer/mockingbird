import { useNavigate, useLocation } from "react-router-dom";
import { useAppStore } from "../../stores/appStore";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentView, workspace } = useAppStore();

  // Helper to generate nav path with workspace prefix
  const navTo = (path: string) => {
    if (workspace) {
      return `/w/${workspace}${path}`;
    }
    return path;
  };

  return (
    <header className="bg-gray-50 border-b border-gray-200 px-6 py-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            onClick={() => navigate(navTo("/"))}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity cursor-pointer"
          >
            <img src="/mockingbird.svg" alt="Mockingbird" className="w-5 h-5" />
            <h1 className="text-sm font-normal text-gray-800">Mockingbird</h1>
          </div>

          {/* Workspace Badge */}
          {workspace && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400">/</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                {workspace}
              </span>
              {(() => {
                // Check if we're on the main traffic page (workspace root)
                const isOnTrafficList = location.pathname === `/w/${workspace}` || location.pathname === `/w/${workspace}/`;
                const backLabel = isOnTrafficList ? "← All Workspaces" : "← Traffic";
                const backPath = isOnTrafficList ? "/" : navTo("/");
                const backTitle = isOnTrafficList ? "Go to workspace selection" : "Back to traffic list";

                return (
                  <button
                    onClick={() => navigate(backPath)}
                    className="text-xs text-gray-600 hover:text-gray-900 hover:underline"
                    title={backTitle}
                  >
                    {backLabel}
                  </button>
                );
              })()}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(navTo("/"))}
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
            onClick={() => navigate(navTo("/rules"))}
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
            onClick={() => navigate(navTo("/stats"))}
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
            onClick={() => navigate(navTo("/config"))}
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
