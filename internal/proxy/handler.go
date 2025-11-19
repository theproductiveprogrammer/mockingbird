package proxy

import (
	"bytes"
	"compress/gzip"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/theproductiveprogrammer/mockingbird.git/internal/config"
	"github.com/theproductiveprogrammer/mockingbird.git/internal/dsl"
	"github.com/theproductiveprogrammer/mockingbird.git/internal/matcher"
	"github.com/theproductiveprogrammer/mockingbird.git/internal/models"
	"github.com/theproductiveprogrammer/mockingbird.git/internal/plugin"
	"github.com/theproductiveprogrammer/mockingbird.git/internal/render"
	"github.com/theproductiveprogrammer/mockingbird.git/internal/store"
)

// Handler handles proxy requests
type Handler struct {
	config           *config.Config
	workspaceManager *store.WorkspaceManager
	renderer         *render.Renderer
	pluginManager    *plugin.Manager
}

// NewHandler creates a new proxy handler
func NewHandler(cfg *config.Config, wm *store.WorkspaceManager, pm *plugin.Manager) *Handler {
	return &Handler{
		config:           cfg,
		workspaceManager: wm,
		renderer:         render.NewRenderer(cfg),
		pluginManager:    pm,
	}
}

// ServeHTTP handles incoming requests
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	start := time.Now()

	// Parse workspace from URL: /w/{workspace}/{path}
	workspace := "default" // default
	path := r.URL.Path

	if strings.HasPrefix(path, "/w/") {
		// Extract workspace and strip prefix
		parts := strings.SplitN(path[3:], "/", 2)
		if len(parts) >= 1 && parts[0] != "" {
			workspace = parts[0]
			if len(parts) >= 2 {
				path = "/" + parts[1]
			} else {
				path = "/"
			}
		}
	}

	// Get workspace store
	st, err := h.workspaceManager.GetStore(workspace)
	if err != nil {
		http.Error(w, fmt.Sprintf("Workspace %s not found", workspace), http.StatusNotFound)
		return
	}

	// Update request path (strip workspace prefix)
	r.URL.Path = path

	// Extract service name from path
	service := extractService(path)

	// Parse request body
	body := h.parseRequestBody(r)

	// Create request context
	ctx := &models.RequestContext{
		Method:       r.Method,
		Path:         path,
		PathSegments: strings.Split(strings.Trim(path, "/"), "/"),
		QueryParams:  r.URL.Query(),
		Headers:      r.Header,
		Body:         body,
	}

	// Check if any plugin wants to handle this request
	if h.pluginManager != nil {
		pluginResp, err := h.pluginManager.HandleRequest(ctx)
		if err != nil {
			fmt.Printf("Plugin error: %v\n", err)
		} else if pluginResp != nil {
			// Plugin handled the request
			for k, v := range pluginResp.Headers {
				w.Header().Set(k, v)
			}
			w.WriteHeader(pluginResp.Status)
			w.Write([]byte(pluginResp.Body))

			// Record traffic
			entry := models.TrafficEntry{
				ID:          uuid.New().String(),
				Timestamp:   start,
				Service:     service,
				Method:      r.Method,
				Path:        path,
				QueryParams: r.URL.Query(),
				Headers:     r.Header,
				Body:        body,
				Response: &models.Response{
					StatusCode: pluginResp.Status,
					Headers:    pluginResp.Headers,
					Body:       pluginResp.Body,
					DelayMS:    time.Since(start).Milliseconds(),
				},
				RuleType: "plugin",
			}
			maskBackendKeys(&entry, h.config)
			st.AddTraffic(entry)
			return
		}
	}

	// Get rules for service
	rules := st.GetRules(service)

	// Match request against rules
	rule, ruleIndex := matcher.Match(rules, ctx)

	var response *models.Response
	var ruleType string

	if rule != nil {
		// Rule matched
		if rule.ProxyTo != "" {
			// Proxy to upstream
			response = h.handleProxy(w, r, rule, ctx)
			ruleType = "proxy"
		} else if rule.Response != "" {
			// Return mocked response
			response = h.handleMock(w, r, rule, ctx)
			ruleType = "mock"
		}
	} else {
		// No match - return 504 Gateway Timeout
		response = h.handleTimeout(w, r)
		ruleType = "timeout"
	}

	// Record traffic
	entry := models.TrafficEntry{
		ID:          uuid.New().String(),
		Timestamp:   start,
		Service:     service,
		Method:      r.Method,
		Path:        path, // Use stripped path
		QueryParams: r.URL.Query(),
		Headers:     r.Header,
		Body:        body,
		Response:    response,
		RuleType:    ruleType,
	}

	if ruleIndex >= 0 {
		entry.MatchedRule = &ruleIndex
	}

	// Mask backend keys before storing (replace config values with key names)
	maskBackendKeys(&entry, h.config)

	st.AddTraffic(entry)
}

// extractService extracts the service name from the path
// e.g., "/servicex/users" -> "servicex"
func extractService(path string) string {
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) > 0 {
		return parts[0]
	}
	return ""
}

// parseRequestBody attempts to parse the request body as JSON
func (h *Handler) parseRequestBody(r *http.Request) interface{} {
	if r.Body == nil {
		return nil
	}

	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil || len(bodyBytes) == 0 {
		return nil
	}

	// Recreate the body for downstream handlers (important for proxy)
	r.Body = io.NopCloser(strings.NewReader(string(bodyBytes)))
	r.ContentLength = int64(len(bodyBytes))

	// Try to parse as JSON
	var jsonBody interface{}
	if err := json.Unmarshal(bodyBytes, &jsonBody); err == nil {
		return jsonBody
	}

	// Fall back to string
	return string(bodyBytes)
}

// handleProxy proxies the request to upstream
func (h *Handler) handleProxy(w http.ResponseWriter, r *http.Request, rule *models.Rule, ctx *models.RequestContext) *models.Response {
	// Replace localhost with container URL if running in Docker
	proxyTo := replaceLocalhostURL(rule.ProxyTo)

	// Render template with request context
	renderedProxyTo, err := h.renderer.Render(proxyTo, ctx)
	if err != nil {
		fmt.Printf("Error rendering proxyTo URL: %v\n", err)
		renderedProxyTo = proxyTo // Fall back to original
	}

	upstreamURL, err := url.Parse(renderedProxyTo)
	if err != nil {
		http.Error(w, "Invalid upstream URL", http.StatusInternalServerError)
		return &models.Response{
			StatusCode: http.StatusInternalServerError,
			Body:       "Invalid upstream URL",
		}
	}

	// Create reverse proxy
	proxy := httputil.NewSingleHostReverseProxy(upstreamURL)

	// Modify request
	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)

		// Remove service prefix from path
		service := extractService(req.URL.Path)
		req.URL.Path = strings.TrimPrefix(req.URL.Path, "/"+service)

		// Remove hop-by-hop headers that cause issues with HTTPS proxying
		// The h2c upgrade is invalid for HTTPS targets (they use ALPN instead)
		req.Header.Del("Upgrade")
		req.Header.Del("Connection")
		req.Header.Del("Http2-Settings")

		// Set Host header to match the target for proper routing
		req.Host = req.URL.Host

		// Inject headers from rule
		for key, value := range rule.Headers {
			// Render header value with templates
			renderedValue, err := h.renderer.Render(value, ctx)
			if err != nil {
				fmt.Printf("Error rendering header %s: %v\n", key, err)
				renderedValue = value
			}
			req.Header.Set(key, renderedValue)
		}
	}

	// Capture response
	rec := &responseRecorder{ResponseWriter: w, statusCode: 200, body: &strings.Builder{}}

	start := time.Now()
	proxy.ServeHTTP(rec, r)
	duration := time.Since(start)

	// Decompress body if gzipped
	body := rec.body.String()
	if rec.Header().Get("Content-Encoding") == "gzip" {
		decompressed, err := decompressGzip([]byte(body))
		if err != nil {
			fmt.Printf("Error decompressing gzip response: %v\n", err)
		} else {
			body = string(decompressed)
			// Remove Content-Encoding header since body is now decompressed
			rec.Header().Del("Content-Encoding")
		}
	}

	return &models.Response{
		StatusCode: rec.statusCode,
		Headers:    flattenHeaders(rec.Header()),
		Body:       body,
		DelayMS:    duration.Milliseconds(),
	}
}

// handleMock returns a mocked response
func (h *Handler) handleMock(w http.ResponseWriter, r *http.Request, rule *models.Rule, ctx *models.RequestContext) *models.Response {
	// Parse .mock template
	parsed, err := dsl.Parse(rule.Response)
	if err != nil {
		http.Error(w, "Failed to parse mock template", http.StatusInternalServerError)
		return &models.Response{
			StatusCode: http.StatusInternalServerError,
			Body:       "Failed to parse mock template",
		}
	}

	// Apply delay if specified
	if parsed.Delay > 0 {
		time.Sleep(parsed.Delay)
	}

	// Render headers
	renderedHeaders := make(map[string]string)
	for key, value := range parsed.Headers {
		rendered, err := h.renderer.Render(value, ctx)
		if err != nil {
			fmt.Printf("Error rendering header %s: %v\n", key, err)
			rendered = value
		}
		renderedHeaders[key] = rendered
		w.Header().Set(key, rendered)
	}

	// Render body
	renderedBody, err := h.renderer.Render(parsed.Body, ctx)
	if err != nil {
		fmt.Printf("Error rendering body: %v\n", err)
		renderedBody = parsed.Body
	}

	// Write response
	w.WriteHeader(parsed.StatusCode)
	w.Write([]byte(renderedBody))

	return &models.Response{
		StatusCode: parsed.StatusCode,
		Headers:    renderedHeaders,
		Body:       renderedBody,
		DelayMS:    parsed.Delay.Milliseconds(),
	}
}

// handleTimeout returns a 504 Gateway Timeout
func (h *Handler) handleTimeout(w http.ResponseWriter, r *http.Request) *models.Response {
	w.WriteHeader(http.StatusGatewayTimeout)
	body := "No matching rule found"
	w.Write([]byte(body))

	return &models.Response{
		StatusCode: http.StatusGatewayTimeout,
		Body:       body,
	}
}

// responseRecorder captures response details
type responseRecorder struct {
	http.ResponseWriter
	statusCode int
	body       *strings.Builder
}

func (r *responseRecorder) WriteHeader(statusCode int) {
	r.statusCode = statusCode
	r.ResponseWriter.WriteHeader(statusCode)
}

func (r *responseRecorder) Write(b []byte) (int, error) {
	r.body.Write(b)
	return r.ResponseWriter.Write(b)
}

// flattenHeaders converts http.Header to map[string]string
func flattenHeaders(headers http.Header) map[string]string {
	result := make(map[string]string)
	for key, values := range headers {
		if len(values) > 0 {
			result[key] = values[0]
		}
	}
	return result
}

// decompressGzip decompresses gzip-encoded data
func decompressGzip(data []byte) ([]byte, error) {
	reader, err := gzip.NewReader(bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	defer reader.Close()

	return io.ReadAll(reader)
}

// maskBackendKeys replaces config values with their key names in traffic entry
// This ensures secrets are never stored to disk or sent to frontend
func maskBackendKeys(entry *models.TrafficEntry, cfg *config.Config) {
	// Get all config values (unmasked)
	configValues := cfg.GetAll(false)
	if len(configValues) == 0 {
		return
	}

	// Mask request headers
	for headerName, headerValues := range entry.Headers {
		for i, value := range headerValues {
			for key, configValue := range configValues {
				if len(configValue) > 0 && strings.Contains(value, configValue) {
					entry.Headers[headerName][i] = strings.ReplaceAll(value, configValue, key)
				}
			}
		}
	}

	// Mask request body
	if entry.Body != nil {
		// If body is a string, mask directly
		if bodyStr, ok := entry.Body.(string); ok {
			for key, configValue := range configValues {
				if len(configValue) > 0 && strings.Contains(bodyStr, configValue) {
					bodyStr = strings.ReplaceAll(bodyStr, configValue, key)
				}
			}
			entry.Body = bodyStr
		} else {
			// If body is JSON object, serialize, mask, and parse back
			bodyBytes, err := json.Marshal(entry.Body)
			if err == nil {
				bodyStr := string(bodyBytes)
				for key, configValue := range configValues {
					if len(configValue) > 0 && strings.Contains(bodyStr, configValue) {
						bodyStr = strings.ReplaceAll(bodyStr, configValue, key)
					}
				}
				// Try to unmarshal back to maintain structure
				var maskedBody interface{}
				if err := json.Unmarshal([]byte(bodyStr), &maskedBody); err == nil {
					entry.Body = maskedBody
				} else {
					entry.Body = bodyStr
				}
			}
		}
	}
}

// replaceLocalhostURL replaces localhost/127.0.0.1 references with the container URL
// if LOCALHOST_CONTAINER_URL environment variable is set
func replaceLocalhostURL(proxyURL string) string {
	containerURL := os.Getenv("LOCALHOST_CONTAINER_URL")
	if containerURL == "" {
		return proxyURL // No replacement needed
	}

	// Replace localhost (case-insensitive)
	result := strings.ReplaceAll(proxyURL, "://localhost", "://"+containerURL)
	result = strings.ReplaceAll(result, "://localhost:", "://"+containerURL+":")
	result = strings.ReplaceAll(result, "://LOCALHOST", "://"+containerURL)
	result = strings.ReplaceAll(result, "://LOCALHOST:", "://"+containerURL+":")

	// Replace 127.0.0.1
	result = strings.ReplaceAll(result, "://127.0.0.1", "://"+containerURL)
	result = strings.ReplaceAll(result, "://127.0.0.1:", "://"+containerURL+":")

	return result
}
