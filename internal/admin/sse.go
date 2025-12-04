package admin

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/theproductiveprogrammer/mockingbird.git/internal/matcher"
	"github.com/theproductiveprogrammer/mockingbird.git/internal/models"
	"github.com/theproductiveprogrammer/mockingbird.git/internal/store"
)

// streamTraffic handles Server-Sent Events for live traffic
func streamTraffic(w http.ResponseWriter, r *http.Request, st *store.Store, workspace string, wm *store.WorkspaceManager) {
	// Set SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Get flusher
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming not supported", http.StatusInternalServerError)
		return
	}

	// Subscribe to traffic updates
	trafficChan := st.SubscribeTraffic()

	// Stream events
	for {
		select {
		case entry, ok := <-trafficChan:
			if !ok {
				// Channel closed, server shutting down
				return
			}

			// Compute current matched rule for this entry
			rules := st.GetRules(entry.Service)
			ctx := &models.RequestContext{
				Method:      entry.Method,
				Path:        entry.Path,
				QueryParams: entry.QueryParams,
				Headers:     entry.Headers,
				Body:        entry.Body,
			}
			_, ruleIndex := matcher.Match(rules, ctx)
			matchedWorkspace := workspace

			// Fallback to default workspace if no match
			if ruleIndex < 0 && workspace != "default" {
				if defaultStore, err := wm.GetStore("default"); err == nil {
					defaultRules := defaultStore.GetRules(entry.Service)
					_, ruleIndex = matcher.Match(defaultRules, ctx)
					if ruleIndex >= 0 {
						matchedWorkspace = "default"
					}
				}
			}

			if ruleIndex >= 0 {
				entry.CurrentMatchedRule = &ruleIndex
				entry.CurrentMatchedWorkspace = matchedWorkspace
			}

			// Marshal entry to JSON
			data, err := json.Marshal(entry)
			if err != nil {
				fmt.Printf("Error marshaling traffic entry: %v\n", err)
				continue
			}

			// Send SSE event
			fmt.Fprintf(w, "data: %s\n\n", data)
			flusher.Flush()

		case <-r.Context().Done():
			// Client disconnected or server shutting down
			return
		}
	}
}
