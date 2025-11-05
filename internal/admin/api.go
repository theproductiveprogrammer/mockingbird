package admin

import (
	"encoding/json"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"gopkg.in/yaml.v3"

	"github.com/theproductiveprogrammer/mockingbird.git/internal/config"
	"github.com/theproductiveprogrammer/mockingbird.git/internal/dsl"
	"github.com/theproductiveprogrammer/mockingbird.git/internal/models"
	"github.com/theproductiveprogrammer/mockingbird.git/internal/store"
)

// API provides the admin REST API
type API struct {
	config *config.Config
	store  *store.Store
	router chi.Router
}

// NewAPI creates a new admin API
func NewAPI(cfg *config.Config, st *store.Store) *API {
	api := &API{
		config: cfg,
		store:  st,
		router: chi.NewRouter(),
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

	// API routes
	r.Route("/api", func(r chi.Router) {
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
	})

	// Serve static files from webui/dist (SPA with fallback to index.html)
	fileServer := http.FileServer(http.Dir("./webui/dist"))
	r.Handle("/*", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Check if file exists
		filePath := "./webui/dist" + r.URL.Path
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			// File doesn't exist, serve index.html for SPA routing
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
		"status":  "ok",
		"version": "1.0.0",
	})
}

// handleGetTraffic returns traffic history
func (a *API) handleGetTraffic(w http.ResponseWriter, r *http.Request) {
	limitStr := r.URL.Query().Get("limit")
	limit := 100
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil {
			limit = l
		}
	}

	service := r.URL.Query().Get("service")
	entries := a.store.GetTraffic(limit, service)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"entries": entries,
		"total":   len(entries),
	})
}

// handleTrafficStream streams traffic via SSE
func (a *API) handleTrafficStream(w http.ResponseWriter, r *http.Request) {
	streamTraffic(w, r, a.store)
}

// handleGetTrafficByID returns a specific traffic entry
func (a *API) handleGetTrafficByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	entry := a.store.GetTrafficByID(id)

	if entry == nil {
		respondError(w, http.StatusNotFound, "Traffic entry not found", "NOT_FOUND")
		return
	}

	respondJSON(w, http.StatusOK, entry)
}

// handleGenerateRule generates a rule from a traffic entry
func (a *API) handleGenerateRule(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	entry := a.store.GetTrafficByID(id)

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
	allRules := a.store.GetAllRules()

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
	service := chi.URLParam(r, "service")
	rules := a.store.GetRules(service)

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
	service := chi.URLParam(r, "service")
	rules := a.store.GetRules(service)

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
	service := chi.URLParam(r, "service")

	var rule models.Rule
	if err := json.NewDecoder(r.Body).Decode(&rule); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON", "INVALID_JSON")
		return
	}

	if err := a.store.AddRule(service, rule); err != nil {
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

	if err := a.store.UpdateRule(service, index, rule); err != nil {
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
	service := chi.URLParam(r, "service")
	indexStr := chi.URLParam(r, "index")

	index, err := strconv.Atoi(indexStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid index", "INVALID_INDEX")
		return
	}

	if err := a.store.DeleteRule(service, index); err != nil {
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
	service := chi.URLParam(r, "service")

	if err := a.store.DisableService(service); err != nil {
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

	if err := a.store.MoveRule(service, index, req.Direction); err != nil {
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
		"proxy_port": a.config.ProxyPort,
		"admin_port": a.config.AdminPort,
		"config_dir": a.config.ConfigDir,
		"values":     a.config.GetAll(true), // Masked
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
	allRules := a.store.GetAllRules()
	allTraffic := a.store.GetTraffic(1000, "")

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
