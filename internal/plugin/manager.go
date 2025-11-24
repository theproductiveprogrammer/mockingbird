package plugin

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/dop251/goja"
	"github.com/theproductiveprogrammer/mockingbird.git/internal/config"
	"github.com/theproductiveprogrammer/mockingbird.git/internal/models"
)

// Plugin represents a loaded JavaScript plugin
type Plugin struct {
	Name         string   `json:"name"`
	Version      string   `json:"version"`
	Routes       []string `json:"routes"`
	ConfigEnv    string   `json:"config_env"`  // Environment variable prefix
	Enabled      bool     `json:"enabled"`     // Whether plugin is enabled
	HasComponent bool     `json:"has_component"` // Whether plugin has a React component
	PluginPath   string   `json:"-"`
	runtime      *goja.Runtime
	mu           sync.Mutex
}

// PluginResponse represents a response from a plugin
type PluginResponse struct {
	Status  int               `json:"status"`
	Headers map[string]string `json:"headers"`
	Body    string            `json:"body"`
}

// UIItem represents a single item in the plugin UI
type UIItem struct {
	ID       string                   `json:"id"`
	Title    string                   `json:"title"`
	Subtitle string                   `json:"subtitle"`
	Content  string                   `json:"content"` // Markdown content
	Actions  []map[string]interface{} `json:"actions"`
}

// PluginUI represents the UI definition from a plugin
type PluginUI struct {
	Type  string   `json:"type"`
	Items []UIItem `json:"items"`
}

// Manager manages all loaded plugins
type Manager struct {
	plugins   map[string]*Plugin
	config    *config.Config
	pluginDir string
	mu        sync.RWMutex
}

// NewManager creates a new plugin manager
func NewManager(cfg *config.Config) *Manager {
	pluginDir := filepath.Join(cfg.ConfigDir, "plugins")
	return &Manager{
		plugins:   make(map[string]*Plugin),
		config:    cfg,
		pluginDir: pluginDir,
	}
}

// LoadPlugins discovers and loads all plugins from the plugins directory
func (m *Manager) LoadPlugins() error {
	// Create plugins directory if it doesn't exist
	if err := os.MkdirAll(m.pluginDir, 0755); err != nil {
		return fmt.Errorf("failed to create plugins directory: %w", err)
	}

	// Scan plugins directory
	entries, err := os.ReadDir(m.pluginDir)
	if err != nil {
		return fmt.Errorf("failed to read plugins directory: %w", err)
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		pluginName := entry.Name()
		pluginPath := filepath.Join(m.pluginDir, pluginName)

		// Check for plugin.js
		scriptPath := filepath.Join(pluginPath, "plugin.js")
		if _, err := os.Stat(scriptPath); os.IsNotExist(err) {
			fmt.Printf("[Plugin] Skipping %s: no plugin.js found\n", pluginName)
			continue
		}

		// Load the plugin
		plugin, err := m.loadPlugin(pluginName, pluginPath, scriptPath)
		if err != nil {
			fmt.Printf("[Plugin] Failed to load %s: %v\n", pluginName, err)
			continue
		}

		m.mu.Lock()
		m.plugins[pluginName] = plugin
		m.mu.Unlock()

		fmt.Printf("[Plugin] Loaded %s v%s (routes: %v)\n", plugin.Name, plugin.Version, plugin.Routes)
	}

	return nil
}

// loadPlugin loads a single plugin from disk
func (m *Manager) loadPlugin(name, pluginPath, scriptPath string) (*Plugin, error) {
	// Read JavaScript file
	scriptContent, err := os.ReadFile(scriptPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read plugin script: %w", err)
	}

	// Create Goja runtime
	vm := goja.New()

	// Create exports object
	exports := vm.NewObject()
	vm.Set("exports", exports)

	// Set up plugin API
	pluginAPI := m.createPluginAPI(name, pluginPath, vm)
	vm.Set("plugin", pluginAPI)

	// Add utility functions
	vm.Set("uuid", func() string {
		return fmt.Sprintf("%d", os.Getpid()) // Simple for now, will improve
	})
	vm.Set("now", func() string {
		return fmt.Sprint(os.Getpid()) // Simple for now
	})
	vm.Set("console", map[string]interface{}{
		"log": func(args ...interface{}) {
			fmt.Printf("[Plugin:%s] %v\n", name, args)
		},
	})

	// Execute the script
	_, err = vm.RunString(string(scriptContent))
	if err != nil {
		return nil, fmt.Errorf("failed to execute plugin script: %w", err)
	}

	// Extract metadata from exports
	plugin := &Plugin{
		Name:       name,
		Version:    "1.0",
		Routes:     []string{},
		ConfigEnv:  strings.ToUpper(name) + "_PLUGIN_",
		Enabled:    true, // Default to enabled
		PluginPath: pluginPath,
		runtime:    vm,
	}

	// Get name if exported
	if nameVal := exports.Get("name"); nameVal != nil && !goja.IsUndefined(nameVal) {
		plugin.Name = nameVal.String()
	}

	// Get version if exported
	if versionVal := exports.Get("version"); versionVal != nil && !goja.IsUndefined(versionVal) {
		plugin.Version = versionVal.String()
	}

	// Get routes if exported
	if routesVal := exports.Get("routes"); routesVal != nil && !goja.IsUndefined(routesVal) {
		routesObj := routesVal.Export()
		if routes, ok := routesObj.([]interface{}); ok {
			for _, r := range routes {
				if routeStr, ok := r.(string); ok {
					plugin.Routes = append(plugin.Routes, routeStr)
				}
			}
		}
	}

	// Get config_env if exported
	if configEnvVal := exports.Get("config_env"); configEnvVal != nil && !goja.IsUndefined(configEnvVal) {
		plugin.ConfigEnv = configEnvVal.String()
	}

	// Load enabled state from plugin data (default to true for backward compatibility)
	dataFile := filepath.Join(pluginPath, "data.json")
	pluginData := m.loadPluginData(dataFile)
	if enabledVal, ok := pluginData["_enabled"]; ok {
		if enabled, ok := enabledVal.(bool); ok {
			plugin.Enabled = enabled
		}
	}

	// Check if plugin has a React component
	componentPath := filepath.Join(pluginPath, "ui", "dist", "component.js")
	if _, err := os.Stat(componentPath); err == nil {
		plugin.HasComponent = true
	}

	return plugin, nil
}

// createPluginAPI creates the plugin API object available to JavaScript
func (m *Manager) createPluginAPI(name, pluginPath string, vm *goja.Runtime) map[string]interface{} {
	dataFile := filepath.Join(pluginPath, "data.json")

	return map[string]interface{}{
		// Get data from plugin's data file
		"getData": func(key string) interface{} {
			data := m.loadPluginData(dataFile)
			if val, ok := data[key]; ok {
				return val
			}
			return nil
		},

		// Save data to plugin's data file
		"saveData": func(key string, value interface{}) {
			data := m.loadPluginData(dataFile)
			data[key] = value
			m.savePluginData(dataFile, data)
		},

		// Get all data
		"getAllData": func() map[string]interface{} {
			return m.loadPluginData(dataFile)
		},

		// Get config value (only matching prefix)
		"getConfig": func(key string) string {
			prefix := strings.ToUpper(name) + "_PLUGIN_"
			fullKey := prefix + key
			return m.config.Get(fullKey)
		},

		// Get all config values with matching prefix
		"getAllConfig": func() map[string]string {
			prefix := strings.ToUpper(name) + "_PLUGIN_"
			result := make(map[string]string)
			allConfig := m.config.GetAll(true)
			for k, v := range allConfig {
				if strings.HasPrefix(k, prefix) {
					// Strip prefix for plugin
					shortKey := strings.TrimPrefix(k, prefix)
					result[shortKey] = v
				}
			}
			return result
		},

		// Make HTTP request (for plugins that need to call external APIs)
		"httpRequest": func(method, url string, headers map[string]interface{}, body interface{}) map[string]interface{} {
			result := map[string]interface{}{
				"status":  0,
				"headers": map[string]interface{}{},
				"body":    "",
				"error":   "",
			}

			var reqBody io.Reader
			if body != nil {
				switch b := body.(type) {
				case string:
					reqBody = strings.NewReader(b)
				case map[string]interface{}, []interface{}:
					jsonBytes, err := json.Marshal(b)
					if err != nil {
						result["error"] = fmt.Sprintf("Failed to marshal body: %v", err)
						return result
					}
					reqBody = bytes.NewReader(jsonBytes)
				}
			}

			req, err := http.NewRequest(method, url, reqBody)
			if err != nil {
				result["error"] = fmt.Sprintf("Failed to create request: %v", err)
				return result
			}

			// Set headers
			if headers != nil {
				for k, v := range headers {
					req.Header.Set(k, fmt.Sprint(v))
				}
			}

			// Set default content-type if not specified
			if req.Header.Get("Content-Type") == "" && body != nil {
				req.Header.Set("Content-Type", "application/json")
			}

			client := &http.Client{Timeout: 30 * time.Second}
			resp, err := client.Do(req)
			if err != nil {
				result["error"] = fmt.Sprintf("Request failed: %v", err)
				return result
			}
			defer resp.Body.Close()

			result["status"] = resp.StatusCode

			// Convert headers
			respHeaders := make(map[string]interface{})
			for k, v := range resp.Header {
				if len(v) == 1 {
					respHeaders[k] = v[0]
				} else {
					respHeaders[k] = v
				}
			}
			result["headers"] = respHeaders

			// Read body
			bodyBytes, err := io.ReadAll(resp.Body)
			if err != nil {
				result["error"] = fmt.Sprintf("Failed to read response: %v", err)
				return result
			}

			// Try to parse as JSON
			var jsonBody interface{}
			if err := json.Unmarshal(bodyBytes, &jsonBody); err == nil {
				result["body"] = jsonBody
			} else {
				result["body"] = string(bodyBytes)
			}

			return result
		},
	}
}

// loadPluginData loads the plugin's data.json file
func (m *Manager) loadPluginData(dataFile string) map[string]interface{} {
	data := make(map[string]interface{})

	content, err := os.ReadFile(dataFile)
	if err != nil {
		return data // Return empty map if file doesn't exist
	}

	json.Unmarshal(content, &data)
	return data
}

// savePluginData saves data to the plugin's data.json file
func (m *Manager) savePluginData(dataFile string, data map[string]interface{}) error {
	content, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(dataFile, content, 0644)
}

// GetPlugins returns a list of all loaded plugins
func (m *Manager) GetPlugins() []*Plugin {
	m.mu.RLock()
	defer m.mu.RUnlock()

	plugins := make([]*Plugin, 0, len(m.plugins))
	for _, p := range m.plugins {
		plugins = append(plugins, p)
	}

	// Sort plugins alphabetically by name for consistent ordering
	sort.Slice(plugins, func(i, j int) bool {
		return plugins[i].Name < plugins[j].Name
	})

	return plugins
}

// GetPlugin returns a specific plugin by name
func (m *Manager) GetPlugin(name string) *Plugin {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.plugins[name]
}

// TogglePlugin enables or disables a plugin
func (m *Manager) TogglePlugin(name string, enabled bool) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	plugin, ok := m.plugins[name]
	if !ok {
		return fmt.Errorf("plugin not found: %s", name)
	}

	plugin.Enabled = enabled

	// Persist the enabled state to plugin's data file
	dataFile := filepath.Join(plugin.PluginPath, "data.json")
	data := m.loadPluginData(dataFile)
	data["_enabled"] = enabled
	m.savePluginData(dataFile, data)

	fmt.Printf("[Plugin] %s %s\n", name, map[bool]string{true: "enabled", false: "disabled"}[enabled])

	return nil
}

// HandleRequest checks if any plugin should handle the request
func (m *Manager) HandleRequest(ctx *models.RequestContext) (*PluginResponse, error) {
	m.mu.RLock()
	plugins := make([]*Plugin, 0, len(m.plugins))
	for _, p := range m.plugins {
		plugins = append(plugins, p)
	}
	m.mu.RUnlock()

	for _, plugin := range plugins {
		// Skip disabled plugins
		if !plugin.Enabled {
			continue
		}
		if plugin.matchesRoute(ctx.Path) {
			resp, err := plugin.handleRequest(ctx)
			if err != nil {
				return nil, err
			}
			if resp != nil {
				return resp, nil
			}
		}
	}

	return nil, nil // No plugin handled the request
}

// matchesRoute checks if a path matches any of the plugin's routes
func (p *Plugin) matchesRoute(path string) bool {
	for _, route := range p.Routes {
		if matchRoute(route, path) {
			return true
		}
	}
	return false
}

// matchRoute checks if a path matches a route pattern
func matchRoute(pattern, path string) bool {
	// Handle wildcard patterns
	if strings.HasSuffix(pattern, "/**") {
		prefix := strings.TrimSuffix(pattern, "/**")
		return strings.HasPrefix(path, prefix)
	}

	if strings.HasSuffix(pattern, "/*") {
		prefix := strings.TrimSuffix(pattern, "/*")
		if !strings.HasPrefix(path, prefix) {
			return false
		}
		rest := strings.TrimPrefix(path, prefix)
		// Should have exactly one more segment
		return strings.Count(rest, "/") <= 1
	}

	return path == pattern
}

// handleRequest calls the plugin's handleRequest function
func (p *Plugin) handleRequest(ctx *models.RequestContext) (*PluginResponse, error) {
	p.mu.Lock()
	defer p.mu.Unlock()

	exports := p.runtime.Get("exports").ToObject(p.runtime)
	handleReqFn := exports.Get("handleRequest")

	if handleReqFn == nil || goja.IsUndefined(handleReqFn) {
		return nil, nil // No handler defined
	}

	callable, ok := goja.AssertFunction(handleReqFn)
	if !ok {
		return nil, fmt.Errorf("handleRequest is not a function")
	}

	// Convert context to JavaScript object
	ctxObj := p.runtime.NewObject()
	ctxObj.Set("method", ctx.Method)
	ctxObj.Set("path", ctx.Path)
	ctxObj.Set("pathSegments", ctx.PathSegments)
	ctxObj.Set("query", ctx.QueryParams)
	ctxObj.Set("headers", ctx.Headers)
	ctxObj.Set("body", ctx.Body)

	result, err := callable(goja.Undefined(), ctxObj)
	if err != nil {
		return nil, fmt.Errorf("plugin handleRequest error: %w", err)
	}

	if result == nil || goja.IsUndefined(result) || goja.IsNull(result) {
		return nil, nil // Plugin chose not to handle
	}

	// Convert result to PluginResponse
	respObj := result.Export()
	respMap, ok := respObj.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("handleRequest must return an object or null")
	}

	resp := &PluginResponse{
		Status:  200,
		Headers: make(map[string]string),
		Body:    "",
	}

	if status, ok := respMap["status"].(int64); ok {
		resp.Status = int(status)
	}
	if status, ok := respMap["status"].(float64); ok {
		resp.Status = int(status)
	}

	if headers, ok := respMap["headers"].(map[string]interface{}); ok {
		for k, v := range headers {
			resp.Headers[k] = fmt.Sprint(v)
		}
	}

	if body, ok := respMap["body"].(string); ok {
		resp.Body = body
	}

	return resp, nil
}

// GetPluginUI gets the UI definition from a plugin
func (p *Plugin) GetPluginUI() (*PluginUI, error) {
	p.mu.Lock()
	defer p.mu.Unlock()

	exports := p.runtime.Get("exports").ToObject(p.runtime)
	getUIFn := exports.Get("getUI")

	if getUIFn == nil || goja.IsUndefined(getUIFn) {
		return nil, nil // No UI defined
	}

	callable, ok := goja.AssertFunction(getUIFn)
	if !ok {
		return nil, fmt.Errorf("getUI is not a function")
	}

	result, err := callable(goja.Undefined())
	if err != nil {
		return nil, fmt.Errorf("plugin getUI error: %w", err)
	}

	if result == nil || goja.IsUndefined(result) {
		return nil, nil
	}

	// Convert result to PluginUI
	uiObj := result.Export()
	uiMap, ok := uiObj.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("getUI must return an object")
	}

	ui := &PluginUI{
		Type:  "list",
		Items: []UIItem{},
	}

	if uiType, ok := uiMap["type"].(string); ok {
		ui.Type = uiType
	}

	if items, ok := uiMap["items"].([]interface{}); ok {
		for _, item := range items {
			if itemMap, ok := item.(map[string]interface{}); ok {
				uiItem := UIItem{
					Actions: []map[string]interface{}{},
				}
				if id, ok := itemMap["id"].(string); ok {
					uiItem.ID = id
				}
				if title, ok := itemMap["title"].(string); ok {
					uiItem.Title = title
				}
				if subtitle, ok := itemMap["subtitle"].(string); ok {
					uiItem.Subtitle = subtitle
				}
				if content, ok := itemMap["content"].(string); ok {
					uiItem.Content = content
				}
				if actions, ok := itemMap["actions"].([]interface{}); ok {
					for _, action := range actions {
						if actionMap, ok := action.(map[string]interface{}); ok {
							uiItem.Actions = append(uiItem.Actions, actionMap)
						}
					}
				}
				ui.Items = append(ui.Items, uiItem)
			}
		}
	}

	return ui, nil
}

// HandleAction calls a plugin's action handler
func (p *Plugin) HandleAction(action string, id string, data map[string]interface{}) (interface{}, error) {
	p.mu.Lock()
	defer p.mu.Unlock()

	exports := p.runtime.Get("exports").ToObject(p.runtime)
	handleActionFn := exports.Get("handleAction")

	if handleActionFn == nil || goja.IsUndefined(handleActionFn) {
		return nil, fmt.Errorf("plugin does not have handleAction function")
	}

	callable, ok := goja.AssertFunction(handleActionFn)
	if !ok {
		return nil, fmt.Errorf("handleAction is not a function")
	}

	result, err := callable(goja.Undefined(), p.runtime.ToValue(action), p.runtime.ToValue(id), p.runtime.ToValue(data))
	if err != nil {
		return nil, fmt.Errorf("plugin handleAction error: %w", err)
	}

	if result == nil || goja.IsUndefined(result) {
		return nil, nil
	}

	return result.Export(), nil
}

// GetComponentPath returns the path to the plugin's React component bundle
func (p *Plugin) GetComponentPath() (string, error) {
	componentPath := filepath.Join(p.PluginPath, "ui", "dist", "component.js")
	if _, err := os.Stat(componentPath); os.IsNotExist(err) {
		return "", fmt.Errorf("plugin does not have a React component")
	}
	return componentPath, nil
}
