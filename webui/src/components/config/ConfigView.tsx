import { useEffect, useState } from "react";
import { useAppStore } from "../../stores/appStore";
import { api } from "../../utils/api";
import { Button } from "../ui/Button";
import { toast } from "react-hot-toast";

export function ConfigView() {
  const { config, setConfig } = useAppStore();
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [adding, setAdding] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [needsRestart, setNeedsRestart] = useState(false);

  useEffect(() => {
    api.getConfig().then(setConfig);
  }, [setConfig]);

  if (!config) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Loading configuration...</p>
      </div>
    );
  }

  const maskValue = (value: string): string => {
    if (value.length <= 4) return "***";
    return value.substring(0, 4) + "***";
  };

  const startEdit = (key: string, value: string) => {
    setEditing(key);
    setEditValue(value);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditValue("");
  };

  const saveEdit = async (key: string) => {
    try {
      await api.setConfigValue(key, editValue);
      toast.success("Config value updated");
      setNeedsRestart(true);
      const newConfig = await api.getConfig();
      setConfig(newConfig);
      setEditing(null);
      setEditValue("");
    } catch (error) {
      toast.error("Failed to update config value");
      console.error(error);
    }
  };

  const deleteValue = async (key: string) => {
    if (!confirm(`Delete config value "${key}"?`)) return;

    try {
      await api.deleteConfigValue(key);
      toast.success("Config value deleted");
      setNeedsRestart(true);
      const newConfig = await api.getConfig();
      setConfig(newConfig);
    } catch (error) {
      toast.error("Failed to delete config value");
      console.error(error);
    }
  };

  const saveNew = async () => {
    if (!newKey.trim()) {
      toast.error("Key cannot be empty");
      return;
    }

    try {
      await api.setConfigValue(newKey, newValue);
      toast.success("Config value added");
      setNeedsRestart(true);
      const newConfig = await api.getConfig();
      setConfig(newConfig);
      setAdding(false);
      setNewKey("");
      setNewValue("");
    } catch (error) {
      toast.error("Failed to add config value");
      console.error(error);
    }
  };

  const configValues = Object.entries(config.values);

  return (
    <div className="h-full overflow-y-auto">
      {/* Server Info */}
      {config.version && (
        <div className="mb-2">
          <div className="p-5 border-b pb-10">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/mockingbird.svg"
                alt="Mockingbird"
                className="w-8 h-8"
              />
              <div>
                <p className="text-base font-mono font-bold text-gray-900">
                  {config.version}
                </p>
                {config.build_name && (
                  <p className="text-sm font-medium text-gray-600 italic">
                    '{config.build_name.replace("_", " ")}'
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs bg-gray-50 rounded-md p-3 border border-gray-200">
              {config.build_time && (
                <div>
                  <p className="text-gray-600 mb-1 font-medium">Built</p>
                  <p className="font-mono text-gray-800">
                    {new Date(config.build_time).toLocaleString()}
                  </p>
                </div>
              )}
              {config.commit_hash && (
                <div>
                  <p className="text-gray-600 mb-1 font-medium">Commit</p>
                  <p className="font-mono text-gray-800">
                    {config.commit_hash}
                  </p>
                </div>
              )}
              {config.go_version && (
                <div>
                  <p className="text-gray-600 mb-1 font-medium">Go Version</p>
                  <p className="font-mono text-gray-800">{config.go_version}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Restart Warning Banner */}
        {needsRestart && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-xs text-yellow-800">
              <strong>⚠️ Server restart required:</strong> Configuration changes
              have been saved but won't take effect until you restart the
              Mockingbird server.
            </p>
          </div>
        )}

        {/* Server Settings */}
        <div className="mb-6">
          <h2 className="text-xs font-medium text-gray-600 mb-3 uppercase tracking-wider">
            Server Settings
          </h2>
          <div className="border border-gray-200 rounded divide-y divide-gray-200">
            <div className="p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-normal text-gray-800">Proxy Port</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Main proxy server for intercepting requests
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-gray-800 bg-gray-50 px-2 py-0.5 rounded">
                  {config.proxy_port}
                </code>
                <span className="text-xs text-gray-500">
                  http://localhost:{config.proxy_port}
                </span>
              </div>
            </div>

            <div className="p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-normal text-gray-800">Admin Port</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Admin API and dashboard server
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-gray-800 bg-gray-50 px-2 py-0.5 rounded">
                  {config.admin_port}
                </code>
                <span className="text-xs text-gray-500">
                  http://localhost:{config.admin_port}
                </span>
              </div>
            </div>

            <div className="p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-normal text-gray-800">
                  Config Directory
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Location for rules and config files
                </p>
              </div>
              <code className="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-0.5 rounded">
                {config.config_dir}
              </code>
            </div>
          </div>
        </div>

        {/* Backend Keys */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium text-gray-600 uppercase tracking-wider">
              Backend Keys
            </h2>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setAdding(true)}
              className="text-xs"
            >
              + Add New
            </Button>
          </div>

          {configValues.length === 0 && !adding ? (
            <div className="border border-gray-200 rounded p-6 text-center text-gray-600">
              <p className="text-xs">No backend keys defined</p>
              <p className="text-xs mt-1 text-gray-500">
                Click "Add New" to create your first backend key
              </p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded divide-y divide-gray-200">
              {/* Add New Row */}
              {adding && (
                <div className="p-3 bg-blue-50">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="KEY_NAME"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value.toUpperCase())}
                      className="text-xs font-mono px-2 py-1 border border-gray-300 rounded flex-1"
                    />
                    <input
                      type="text"
                      placeholder="value"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      className="text-xs font-mono px-2 py-1 border border-gray-300 rounded flex-1"
                    />
                    <Button variant="primary" size="sm" onClick={saveNew}>
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAdding(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Existing Values */}
              {configValues.map(([key, value]) => (
                <div key={key} className="p-3">
                  {editing === key ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <p className="text-xs font-mono text-gray-600 mb-1">
                          {key}
                        </p>
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="text-xs font-mono px-2 py-1 border border-gray-300 rounded w-full"
                          autoFocus
                        />
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => saveEdit(key)}
                      >
                        Save
                      </Button>
                      <Button variant="ghost" size="sm" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-normal text-gray-800 font-mono">
                          {key}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Use in templates: {`{{ config \`${key}\` }}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-gray-800 bg-gray-50 px-2 py-0.5 rounded">
                          {maskValue(value)}
                        </code>
                        <button
                          onClick={() => startEdit(key, value)}
                          className="text-xs text-gray-600 hover:text-gray-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteValue(key)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-gray-50 border border-gray-200 rounded p-3">
          <p className="text-xs text-gray-600">
            <strong>Note:</strong> Backend keys are stored in{" "}
            <code className="bg-gray-100 px-1 rounded">config.json</code> and
            injected into requests via templates. Changes made here are saved
            immediately, but you must restart the Mockingbird server for them to
            take effect.
          </p>
        </div>
      </div>
    </div>
  );
}
