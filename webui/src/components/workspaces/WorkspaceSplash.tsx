import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, Workspace } from '../../utils/api';
import toast from 'react-hot-toast';

export function WorkspaceSplash() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      const data = await api.getWorkspaces();
      setWorkspaces(data);
    } catch (error) {
      console.error('Failed to load workspaces:', error);
      toast.error('Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    try {
      await api.createWorkspace(newWorkspaceName.trim());
      toast.success(`Workspace "${newWorkspaceName}" created`);
      setNewWorkspaceName('');
      setCreating(false);
      loadWorkspaces();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create workspace');
    }
  };

  const handleOpenWorkspace = (workspaceName: string) => {
    navigate(`/w/${workspaceName}/`);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-gray-500">Loading workspaces...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-8 py-4 flex items-center justify-between bg-white">
        <h1 className="text-2xl font-normal text-gray-900 tracking-wide">Mockingbird</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setCreating(true)}
            className="px-5 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors"
          >
            + New Workspace
          </button>
          <button
            onClick={() => selectedWorkspace && handleOpenWorkspace(selectedWorkspace)}
            disabled={!selectedWorkspace}
            className="px-5 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Open
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Bird Illustration */}
        <div className="w-[320px] bg-gray-50 border-r border-gray-200 flex items-center justify-center p-8">
          <img
            src="/img/w/splash-bird.png"
            alt="Mockingbird"
            className="w-full h-auto max-w-[280px] object-contain"
          />
        </div>

        {/* Right Side - Workspace List */}
        <div className="flex-1 overflow-auto">
          {workspaces.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-xl font-medium text-gray-900 mb-2">No workspaces yet</h2>
                <p className="text-gray-500 mb-6">Create your first workspace to get started</p>
                <button
                  onClick={() => setCreating(true)}
                  className="px-6 py-2.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Workspace
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8">
              <div className="space-y-1">
                {workspaces.map((workspace) => (
                  <div
                    key={workspace.name}
                    onClick={() => setSelectedWorkspace(workspace.name)}
                    onDoubleClick={() => handleOpenWorkspace(workspace.name)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                      selectedWorkspace === workspace.name
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Bird Icon */}
                    <img
                      src={`/img/w/${workspace.bird_icon}`}
                      alt={workspace.name}
                      className="w-12 h-12 flex-shrink-0"
                    />

                    {/* Workspace Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-medium text-gray-900 truncate">
                        {workspace.name}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {workspace.rule_count} rules • {workspace.traffic_count} requests
                      </p>
                    </div>

                    {/* Context Menu */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Context menu would go here
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                        <circle cx="8" cy="3" r="1.5"/>
                        <circle cx="8" cy="8" r="1.5"/>
                        <circle cx="8" cy="13" r="1.5"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Workspace Modal */}
      {creating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Workspace</h2>
            <form onSubmit={handleCreateWorkspace}>
              <input
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="Workspace name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                autoFocus
              />
              <div className="flex gap-3 mt-6 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false);
                    setNewWorkspaceName('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newWorkspaceName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
