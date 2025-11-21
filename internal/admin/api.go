package admin

import (
	"encoding/json"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"gopkg.in/yaml.v3"

	"github.com/theproductiveprogrammer/mockingbird.git/internal/config"
	"github.com/theproductiveprogrammer/mockingbird.git/internal/dsl"
	"github.com/theproductiveprogrammer/mockingbird.git/internal/matcher"
	"github.com/theproductiveprogrammer/mockingbird.git/internal/models"
	"github.com/theproductiveprogrammer/mockingbird.git/internal/plugin"
	"github.com/theproductiveprogrammer/mockingbird.git/internal/store"
)

// API provides the admin REST API
type API struct {
	config           *config.Config
	workspaceManager *store.WorkspaceManager
	pluginManager    *plugin.Manager
	router           chi.Router
}

// NewAPI creates a new admin API
func NewAPI(cfg *config.Config, wm *store.WorkspaceManager, pm *plugin.Manager) *API {
	api := &API{
		config:           cfg,
		workspaceManager: wm,
		pluginManager:    pm,
		router:           chi.NewRouter(),
	}

	api.setupRoutes()
	return api
}

// setupRoutes configures API routes
func (a *API) setupRoutes() {
	r := a.router

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(corsMiddleware)

	// Health check
	r.Get("/health", a.handleHealth)

	// Root-level workspace management API (no workspace in URL)
	r.Route("/api/workspaces", func(r chi.Router) {
		r.Get("/", a.handleGetWorkspaces)
		r.Post("/", a.handleCreateWorkspace)
		r.Delete("/{name}", a.handleDisableWorkspace)
		r.Post("/{name}/enable", a.handleEnableWorkspace)
		r.Post("/{name}/duplicate", a.handleDuplicateWorkspace)
	})

	// Workspace-specific API routes: /api/w/{workspace}/...
	r.Route("/api/w/{workspace}", func(r chi.Router) {
		// Traffic
		r.Get("/traffic", a.handleGetTraffic)
		r.Get("/traffic/stream", a.handleTrafficStream)
		r.Get("/traffic/{id}", a.handleGetTrafficByID)
		r.Post("/traffic/{id}/generate-rule", a.handleGenerateRule)

		// Rules
		r.Get("/rules", a.handleGetAllRules)
		r.Get("/rules/{service}", a.handleGetServiceRules)
		r.Get("/rules/{service}/raw", a.handleGetRawRules)
		r.Post("/rules/{service}", a.handleCreateRule)
		r.Put("/rules/{service}/{index}", a.handleUpdateRule)
		r.Delete("/rules/{service}/{index}", a.handleDeleteRule)
		r.Post("/rules/{service}/{index}/move", a.handleMoveRule)
		r.Delete("/rules/{service}", a.handleDeleteService)

		// Config
		r.Get("/config", a.handleGetConfig)
		r.Get("/config/{key}", a.handleGetConfigValue)
		r.Put("/config/{key}", a.handleSetConfigValue)
		r.Delete("/config/{key}", a.handleDeleteConfigValue)

		// Stats
		r.Get("/stats", a.handleGetStats)

		// Plugins
		r.Get("/plugins", a.handleGetPlugins)
		r.Get("/plugins/{plugin}/ui", a.handleGetPluginUI)
		r.Get("/plugins/{plugin}/component.js", a.handleGetPluginComponent)
		r.Post("/plugins/{plugin}/action", a.handlePluginAction)
		r.Post("/plugins/{plugin}/toggle", a.handleTogglePlugin)
	})

	// Static image assets: /img/w/...
	r.Handle("/img/w/*", http.StripPrefix("/img", http.FileServer(http.Dir("./webui/public"))))

	// Workspace UI routes: /w/{workspace}/...
	r.Route("/w/{workspace}", func(r chi.Router) {
		r.Handle("/*", a.serveWorkspaceUI())
	})

	// Serve splash page and static files at root
	fileServer := http.FileServer(http.Dir("./webui/dist"))
	r.Handle("/*", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Check if file exists
		filePath := "./webui/dist" + r.URL.Path
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			// File doesn't exist, serve index.html for SPA routing (splash page)
			r.URL.Path = "/"
		}
		fileServer.ServeHTTP(w, r)
	}))
}

// ServeHTTP implements http.Handler
func (a *API) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	a.router.ServeHTTP(w, r)
}

// handleHealth returns health status
func (a *API) handleHealth(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":      "ok",
		"version":     a.config.Version,
		"build_name":  a.config.BuildName,
		"build_time":  a.config.BuildTime,
		"commit_hash": a.config.CommitHash,
		"go_version":  a.config.GoVersion,
	})
}

// handleGetTraffic returns traffic history
func (a *API) handleGetTraffic(w http.ResponseWriter, r *http.Request) {
	st, err := a.getWorkspaceStore(r)
	if err != nil {
		respondError(w, http.StatusNotFound, "Workspace not found", "WORKSPACE_NOT_FOUND")
		return
	}

	limitStr := r.URL.Query().Get("limit")
	limit := 100
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil {
			limit = l
		}
	}

	service := r.URL.Query().Get("service")
	entries := st.GetTraffic(limit, service)

	// Compute current matched rule for each entry
	for i := range entries {
		entry := &entries[i]

		// Get current rules for this service
		rules := st.GetRules(entry.Service)

		// Create request context from entry
		ctx := &models.RequestContext{
			Method:      entry.Method,
			Path:        entry.Path,
			QueryParams: entry.QueryParams,
			Headers:     entry.Headers,
			Body:        entry.Body,
		}

		// Match against current rules
		_, ruleIndex := matcher.Match(rules, ctx)

		// Set current matched rule (nil if no match)
		if ruleIndex >= 0 {
			entry.CurrentMatchedRule = &ruleIndex
		}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"entries":  entries,
		"returned": len(entries),
		"total":    st.GetTotalTrafficCount(service),
	})
}

// handleTrafficStream streams traffic via SSE
func (a *API) handleTrafficStream(w http.ResponseWriter, r *http.Request) {
	st, err := a.getWorkspaceStore(r)
	if err != nil {
		respondError(w, http.StatusNotFound, "Workspace not found", "WORKSPACE_NOT_FOUND")
		return
	}
	streamTraffic(w, r, st)
}

// handleGetTrafficByID returns a specific traffic entry
func (a *API) handleGetTrafficByID(w http.ResponseWriter, r *http.Request) {
	st, err := a.getWorkspaceStore(r)
	if err != nil {
		respondError(w, http.StatusNotFound, "Workspace not found", "WORKSPACE_NOT_FOUND")
		return
	}

	id := chi.URLParam(r, "id")
	entry := st.GetTrafficByID(id)

	if entry == nil {
		respondError(w, http.StatusNotFound, "Traffic entry not found", "NOT_FOUND")
		return
	}

	// Compute current matched rule
	rules := st.GetRules(entry.Service)
	ctx := &models.RequestContext{
		Method:      entry.Method,
		Path:        entry.Path,
		QueryParams: entry.QueryParams,
		Headers:     entry.Headers,
		Body:        entry.Body,
	}
	_, ruleIndex := matcher.Match(rules, ctx)
	if ruleIndex >= 0 {
		entry.CurrentMatchedRule = &ruleIndex
	}

	respondJSON(w, http.StatusOK, entry)
}

// handleGenerateRule generates a rule from a traffic entry
func (a *API) handleGenerateRule(w http.ResponseWriter, r *http.Request) {
	st, err := a.getWorkspaceStore(r)
	if err != nil {
		respondError(w, http.StatusNotFound, "Workspace not found", "WORKSPACE_NOT_FOUND")
		return
	}

	id := chi.URLParam(r, "id")
	entry := st.GetTrafficByID(id)

	if entry == nil {
		respondError(w, http.StatusNotFound, "Traffic entry not found", "NOT_FOUND")
		return
	}

	// Generate rule template
	rule := generateRuleFromTraffic(entry)

	// Convert to YAML
	data, err := yaml.Marshal(rule)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to generate YAML", "YAML_ERROR")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"service":   entry.Service,
		"rule_yaml": string(data),
	})
}

// handleGetAllRules returns all rules
func (a *API) handleGetAllRules(w http.ResponseWriter, r *http.Request) {
	st, err := a.getWorkspaceStore(r)
	if err != nil {
		respondError(w, http.StatusNotFound, "Workspace not found", "WORKSPACE_NOT_FOUND")
		return
	}

	allRules := st.GetAllRules()

	services := make(map[string]interface{})
	for service, rules := range allRules {
		indexed := make([]map[string]interface{}, len(rules))
		for i, rule := range rules {
			indexed[i] = map[string]interface{}{
				"index": i,
				"match": rule.Match,
			}
			if rule.ProxyTo != "" {
				indexed[i]["proxyto"] = rule.ProxyTo
				indexed[i]["headers"] = rule.Headers
			}
			if rule.Response != "" {
				indexed[i]["response"] = rule.Response
			}
			if rule.Enabled != nil {
				indexed[i]["enabled"] = *rule.Enabled
			}
		}

		services[service] = map[string]interface{}{
			"service": service,
			"file":    service + ".yaml",
			"rules":   indexed,
		}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"services": services,
	})
}

// handleGetServiceRules returns rules for a service
func (a *API) handleGetServiceRules(w http.ResponseWriter, r *http.Request) {
	st, err := a.getWorkspaceStore(r)
	if err != nil {
		respondError(w, http.StatusNotFound, "Workspace not found", "WORKSPACE_NOT_FOUND")
		return
	}

	service := chi.URLParam(r, "service")
	rules := st.GetRules(service)

	indexed := make([]map[string]interface{}, len(rules))
	for i, rule := range rules {
		indexed[i] = map[string]interface{}{
			"index": i,
			"match": rule.Match,
		}
		if rule.ProxyTo != "" {
			indexed[i]["proxyto"] = rule.ProxyTo
			indexed[i]["headers"] = rule.Headers
		}
		if rule.Response != "" {
			indexed[i]["response"] = rule.Response
		}
		if rule.Enabled != nil {
			indexed[i]["enabled"] = *rule.Enabled
		}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"service": service,
		"rules":   indexed,
	})
}

// handleGetRawRules returns raw YAML for a service
func (a *API) handleGetRawRules(w http.ResponseWriter, r *http.Request) {
	st, err := a.getWorkspaceStore(r)
	if err != nil {
		respondError(w, http.StatusNotFound, "Workspace not found", "WORKSPACE_NOT_FOUND")
		return
	}

	service := chi.URLParam(r, "service")
	rules := st.GetRules(service)

	serviceRules := models.ServiceRules{Rules: rules}
	data, err := yaml.Marshal(serviceRules)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to marshal YAML", "YAML_ERROR")
		return
	}

	w.Header().Set("Content-Type", "text/yaml")
	w.Write(data)
}

// handleCreateRule creates a new rule
func (a *API) handleCreateRule(w http.ResponseWriter, r *http.Request) {
	st, err := a.getWorkspaceStore(r)
	if err != nil {
		respondError(w, http.StatusNotFound, "Workspace not found", "WORKSPACE_NOT_FOUND")
		return
	}

	service := chi.URLParam(r, "service")

	var rule models.Rule
	if err := json.NewDecoder(r.Body).Decode(&rule); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON", "INVALID_JSON")
		return
	}

	if err := st.AddRule(service, rule); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error(), "ADD_FAILED")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"service": service,
		"message": "Rule created successfully",
	})
}

// handleUpdateRule updates an existing rule
func (a *API) handleUpdateRule(w http.ResponseWriter, r *http.Request) {
	st, err := a.getWorkspaceStore(r)
	if err != nil {
		respondError(w, http.StatusNotFound, "Workspace not found", "WORKSPACE_NOT_FOUND")
		return
	}

	service := chi.URLParam(r, "service")
	indexStr := chi.URLParam(r, "index")

	index, err := strconv.Atoi(indexStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid index", "INVALID_INDEX")
		return
	}

	var rule models.Rule
	if err := json.NewDecoder(r.Body).Decode(&rule); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON", "INVALID_JSON")
		return
	}

	if err := st.UpdateRule(service, index, rule); err != nil {
		respondError(w, http.StatusNotFound, err.Error(), "RULE_NOT_FOUND")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"service": service,
		"index":   index,
		"message": "Rule updated successfully",
	})
}

// handleDeleteRule deletes a rule
func (a *API) handleDeleteRule(w http.ResponseWriter, r *http.Request) {
	st, err := a.getWorkspaceStore(r)
	if err != nil {
		respondError(w, http.StatusNotFound, "Workspace not found", "WORKSPACE_NOT_FOUND")
		return
	}

	service := chi.URLParam(r, "service")
	indexStr := chi.URLParam(r, "index")

	index, err := strconv.Atoi(indexStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid index", "INVALID_INDEX")
		return
	}

	if err := st.DeleteRule(service, index); err != nil {
		respondError(w, http.StatusNotFound, err.Error(), "RULE_NOT_FOUND")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"service": service,
		"index":   index,
		"message": "Rule deleted successfully",
	})
}

// handleDeleteService deletes an entire service
func (a *API) handleDeleteService(w http.ResponseWriter, r *http.Request) {
	st, err := a.getWorkspaceStore(r)
	if err != nil {
		respondError(w, http.StatusNotFound, "Workspace not found", "WORKSPACE_NOT_FOUND")
		return
	}

	service := chi.URLParam(r, "service")

	if err := st.DisableService(service); err != nil {
		respondError(w, http.StatusNotFound, err.Error(), "SERVICE_NOT_FOUND")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"service": service,
		"message": "Service deleted successfully",
	})
}

// handleMoveRule moves a rule up or down
func (a *API) handleMoveRule(w http.ResponseWriter, r *http.Request) {
	st, err := a.getWorkspaceStore(r)
	if err != nil {
		respondError(w, http.StatusNotFound, "Workspace not found", "WORKSPACE_NOT_FOUND")
		return
	}

	service := chi.URLParam(r, "service")
	indexStr := chi.URLParam(r, "index")

	index, err := strconv.Atoi(indexStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid index", "INVALID_INDEX")
		return
	}

	var req struct {
		Direction string `json:"direction"` // "up" or "down"
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON", "INVALID_JSON")
		return
	}

	if err := st.MoveRule(service, index, req.Direction); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "MOVE_FAILED")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"service": service,
		"message": "Rule moved successfully",
	})
}

// handleGetConfig returns configuration
func (a *API) handleGetConfig(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"proxy_port":  a.config.ProxyPort,
		"admin_port":  a.config.AdminPort,
		"config_dir":  a.config.ConfigDir,
		"values":      a.config.GetAll(true), // Masked
		"version":     a.config.Version,
		"build_name":  a.config.BuildName,
		"build_time":  a.config.BuildTime,
		"commit_hash": a.config.CommitHash,
		"go_version":  a.config.GoVersion,
	})
}

// handleGetConfigValue returns a specific config value
func (a *API) handleGetConfigValue(w http.ResponseWriter, r *http.Request) {
	key := chi.URLParam(r, "key")
	value := a.config.Get(key)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"key":   key,
		"value": value,
	})
}

// handleSetConfigValue sets a config value
func (a *API) handleSetConfigValue(w http.ResponseWriter, r *http.Request) {
	key := chi.URLParam(r, "key")

	var req struct {
		Value string `json:"value"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON", "INVALID_JSON")
		return
	}

	a.config.Set(key, req.Value)

	// Save to disk
	if err := a.config.Save(); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to save config", "SAVE_FAILED")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"key":     key,
		"message": "Config value updated successfully",
	})
}

// handleDeleteConfigValue deletes a config value
func (a *API) handleDeleteConfigValue(w http.ResponseWriter, r *http.Request) {
	key := chi.URLParam(r, "key")
	a.config.Delete(key)

	// Save to disk
	if err := a.config.Save(); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to save config", "SAVE_FAILED")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"key":     key,
		"message": "Config value deleted successfully",
	})
}

// handleGetStats returns system statistics
func (a *API) handleGetStats(w http.ResponseWriter, r *http.Request) {
	st, err := a.getWorkspaceStore(r)
	if err != nil {
		respondError(w, http.StatusNotFound, "Workspace not found", "WORKSPACE_NOT_FOUND")
		return
	}

	allRules := st.GetAllRules()
	allTraffic := st.GetTraffic(1000, "")

	totalRules := 0
	services := make(map[string]interface{})

	for service, rules := range allRules {
		totalRules += len(rules)

		// Count traffic for this service
		trafficCount := 0
		for _, entry := range allTraffic {
			if entry.Service == service {
				trafficCount++
			}
		}

		services[service] = map[string]interface{}{
			"rules":    len(rules),
			"requests": trafficCount,
		}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"total_requests": len(allTraffic),
		"total_rules":    totalRules,
		"services":       services,
	})
}

// generateRuleFromTraffic creates a rule template from a traffic entry
func generateRuleFromTraffic(entry *models.TrafficEntry) models.Rule {
	rule := models.Rule{
		Match: models.MatchCondition{
			Method: []string{entry.Method},
			Path:   entry.Path,
		},
	}

	if entry.Response != nil {
		// Create .mock template from response
		parsed := &models.ParsedTemplate{
			StatusCode: entry.Response.StatusCode,
			Headers:    entry.Response.Headers,
			Body:       entry.Response.Body,
			Delay:      time.Duration(entry.Response.DelayMS) * time.Millisecond,
		}
		rule.Response = dsl.Format(parsed)
	}

	return rule
}

// Helper functions

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message, code string) {
	respondJSON(w, status, map[string]interface{}{
		"error": message,
		"code":  code,
	})
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// getWorkspaceStore gets the store for the workspace in the URL
func (a *API) getWorkspaceStore(r *http.Request) (*store.Store, error) {
	workspace := chi.URLParam(r, "workspace")
	if workspace == "" {
		workspace = "default" // default
	}
	return a.workspaceManager.GetStore(workspace)
}

// serveWorkspaceUI returns a handler for serving the workspace-specific UI
func (a *API) serveWorkspaceUI() http.Handler {
	fileServer := http.FileServer(http.Dir("./webui/dist"))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Strip /w/{workspace} prefix for file serving
		// e.g., /w/Dave/traffic -> /traffic
		workspace := chi.URLParam(r, "workspace")
		if workspace != "" {
			// Remove /w/{workspace} from path
			r.URL.Path = strings.TrimPrefix(r.URL.Path, "/w/"+workspace)
		}

		// Check if file exists
		filePath := "./webui/dist" + r.URL.Path
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			// File doesn't exist, serve index.html for SPA routing
			r.URL.Path = "/"
		}
		fileServer.ServeHTTP(w, r)
	})
}

// Workspace Management Handlers

func (a *API) handleGetWorkspaces(w http.ResponseWriter, r *http.Request) {
	workspaces, err := a.workspaceManager.GetWorkspaces()
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error(), "WORKSPACE_LIST_FAILED")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"workspaces": workspaces,
	})
}

func (a *API) handleCreateWorkspace(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON", "INVALID_JSON")
		return
	}

	if err := a.workspaceManager.CreateWorkspace(req.Name); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "WORKSPACE_CREATE_FAILED")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"name":    req.Name,
		"message": "Workspace created successfully",
	})
}

func (a *API) handleDisableWorkspace(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")

	if err := a.workspaceManager.DisableWorkspace(name); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "WORKSPACE_DISABLE_FAILED")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"name":    name,
		"message": "Workspace disabled successfully",
	})
}

func (a *API) handleEnableWorkspace(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")

	if err := a.workspaceManager.EnableWorkspace(name); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "WORKSPACE_ENABLE_FAILED")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"name":    name,
		"message": "Workspace enabled successfully",
	})
}

func (a *API) handleDuplicateWorkspace(w http.ResponseWriter, r *http.Request) {
	source := chi.URLParam(r, "name")

	var req struct {
		Dest string `json:"dest"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON", "INVALID_JSON")
		return
	}

	if err := a.workspaceManager.DuplicateWorkspace(source, req.Dest); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "WORKSPACE_DUPLICATE_FAILED")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"source":  source,
		"dest":    req.Dest,
		"message": "Workspace duplicated successfully",
	})
}

// handleGetPlugins returns a list of all loaded plugins
func (a *API) handleGetPlugins(w http.ResponseWriter, r *http.Request) {
	if a.pluginManager == nil {
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"plugins": []interface{}{},
		})
		return
	}

	plugins := a.pluginManager.GetPlugins()
	pluginList := make([]map[string]interface{}, 0, len(plugins))

	for _, p := range plugins {
		pluginList = append(pluginList, map[string]interface{}{
			"name":          p.Name,
			"version":       p.Version,
			"routes":        p.Routes,
			"enabled":       p.Enabled,
			"has_component": p.HasComponent,
		})
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"plugins": pluginList,
	})
}

// handleTogglePlugin toggles a plugin's enabled state
func (a *API) handleTogglePlugin(w http.ResponseWriter, r *http.Request) {
	if a.pluginManager == nil {
		respondError(w, http.StatusNotFound, "Plugin manager not initialized", "NO_PLUGIN_MANAGER")
		return
	}

	pluginName := chi.URLParam(r, "plugin")

	var req struct {
		Enabled bool `json:"enabled"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body", "INVALID_REQUEST")
		return
	}

	if err := a.pluginManager.TogglePlugin(pluginName, req.Enabled); err != nil {
		respondError(w, http.StatusNotFound, err.Error(), "PLUGIN_NOT_FOUND")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"enabled": req.Enabled,
	})
}

// handleGetPluginUI returns the UI definition for a plugin
func (a *API) handleGetPluginUI(w http.ResponseWriter, r *http.Request) {
	if a.pluginManager == nil {
		respondError(w, http.StatusNotFound, "Plugin manager not initialized", "NO_PLUGIN_MANAGER")
		return
	}

	pluginName := chi.URLParam(r, "plugin")
	plugin := a.pluginManager.GetPlugin(pluginName)
	if plugin == nil {
		respondError(w, http.StatusNotFound, "Plugin not found", "PLUGIN_NOT_FOUND")
		return
	}

	ui, err := plugin.GetPluginUI()
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error(), "PLUGIN_UI_ERROR")
		return
	}

	if ui == nil {
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"type":  "empty",
			"items": []interface{}{},
		})
		return
	}

	respondJSON(w, http.StatusOK, ui)
}

// handlePluginAction handles a plugin action request
func (a *API) handlePluginAction(w http.ResponseWriter, r *http.Request) {
	if a.pluginManager == nil {
		respondError(w, http.StatusNotFound, "Plugin manager not initialized", "NO_PLUGIN_MANAGER")
		return
	}

	pluginName := chi.URLParam(r, "plugin")
	plugin := a.pluginManager.GetPlugin(pluginName)
	if plugin == nil {
		respondError(w, http.StatusNotFound, "Plugin not found", "PLUGIN_NOT_FOUND")
		return
	}

	var req struct {
		Action string                 `json:"action"`
		ID     string                 `json:"id"`
		Data   map[string]interface{} `json:"data"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body", "INVALID_REQUEST")
		return
	}

	result, err := plugin.HandleAction(req.Action, req.ID, req.Data)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error(), "PLUGIN_ACTION_ERROR")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"result":  result,
	})
}

// handleGetPluginComponent serves the plugin's React component bundle
func (a *API) handleGetPluginComponent(w http.ResponseWriter, r *http.Request) {
	if a.pluginManager == nil {
		respondError(w, http.StatusNotFound, "Plugin manager not initialized", "NO_PLUGIN_MANAGER")
		return
	}

	pluginName := chi.URLParam(r, "plugin")
	plugin := a.pluginManager.GetPlugin(pluginName)
	if plugin == nil {
		respondError(w, http.StatusNotFound, "Plugin not found", "PLUGIN_NOT_FOUND")
		return
	}

	componentPath, err := plugin.GetComponentPath()
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error(), "COMPONENT_NOT_FOUND")
		return
	}

	// Read the component file
	content, err := os.ReadFile(componentPath)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to read component file", "READ_ERROR")
		return
	}

	// Set appropriate headers for JavaScript module
	w.Header().Set("Content-Type", "application/javascript")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(http.StatusOK)
	w.Write(content)
}
