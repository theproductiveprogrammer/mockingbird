package store

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"gopkg.in/yaml.v3"

	"github.com/theproductiveprogrammer/mockingbird.git/internal/config"
	"github.com/theproductiveprogrammer/mockingbird.git/internal/models"
)

const maxBodySizeBytes = 1024 // 1KB limit for request/response bodies

// Store manages rules and traffic history
type Store struct {
	configDir   string
	config      *config.Config
	rules       map[string][]models.Rule // service name -> rules
	traffic     []models.TrafficEntry
	subscribers map[chan models.TrafficEntry]struct{} // Multiple SSE subscribers
	mu          sync.RWMutex
	watcher     *Watcher
	closed      bool
}

// New creates a new store
func New(configDir string, cfg *config.Config) (*Store, error) {
	s := &Store{
		configDir:   configDir,
		config:      cfg,
		rules:       make(map[string][]models.Rule),
		traffic:     make([]models.TrafficEntry, 0, cfg.MaxTrafficEntries),
		subscribers: make(map[chan models.TrafficEntry]struct{}),
	}

	// Ensure config directory exists
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create config directory: %w", err)
	}

	// Load rules from files
	if err := s.loadAllRules(); err != nil {
		return nil, fmt.Errorf("failed to load rules: %w", err)
	}

	// Load traffic history from file
	if err := s.loadTrafficFromFile(); err != nil {
		fmt.Printf("Note: Could not load traffic history: %v\n", err)
	}

	// Start file watcher
	watcher, err := NewWatcher(configDir, s.onFileChange)
	if err != nil {
		return nil, fmt.Errorf("failed to start file watcher: %w", err)
	}
	s.watcher = watcher

	return s, nil
}

// loadAllRules loads all YAML rule files from the config directory
func (s *Store) loadAllRules() error {
	files, err := filepath.Glob(filepath.Join(s.configDir, "*.yaml"))
	if err != nil {
		return err
	}

	for _, file := range files {
		service := getServiceName(file)
		if err := s.loadRulesFromFile(service, file); err != nil {
			fmt.Printf("Warning: Failed to load rules from %s: %v\n", file, err)
		}
	}

	return nil
}

// loadRulesFromFile loads rules for a service from a YAML file
func (s *Store) loadRulesFromFile(service, filePath string) error {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return err
	}

	var serviceRules models.ServiceRules
	if err := yaml.Unmarshal(data, &serviceRules); err != nil {
		return fmt.Errorf("failed to parse YAML: %w", err)
	}

	s.mu.Lock()
	s.rules[service] = serviceRules.Rules
	s.mu.Unlock()

	fmt.Printf("Loaded %d rule(s) for service '%s'\n", len(serviceRules.Rules), service)
	return nil
}

// onFileChange is called when a file changes
func (s *Store) onFileChange(filePath string) {
	service := getServiceName(filePath)
	fmt.Printf("Reloading rules for service '%s'\n", service)

	if err := s.loadRulesFromFile(service, filePath); err != nil {
		fmt.Printf("Error reloading rules for %s: %v\n", service, err)
	}
}

// getServiceName extracts the service name from a file path
// e.g., "/path/to/servicex.yaml" -> "servicex"
func getServiceName(filePath string) string {
	base := filepath.Base(filePath)
	return strings.TrimSuffix(base, filepath.Ext(base))
}

// GetRules returns all rules for a service
func (s *Store) GetRules(service string) []models.Rule {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if rules, ok := s.rules[service]; ok {
		// Return a copy
		result := make([]models.Rule, len(rules))
		copy(result, rules)
		return result
	}

	return []models.Rule{}
}

// GetAllRules returns all rules grouped by service
func (s *Store) GetAllRules() map[string][]models.Rule {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make(map[string][]models.Rule, len(s.rules))
	for service, rules := range s.rules {
		ruleCopy := make([]models.Rule, len(rules))
		copy(ruleCopy, rules)
		result[service] = ruleCopy
	}

	return result
}

// AddRule adds a rule to a service
func (s *Store) AddRule(service string, rule models.Rule) error {
	s.mu.Lock()
	s.rules[service] = append(s.rules[service], rule)
	rules := s.rules[service]
	s.mu.Unlock()

	// Save to file
	return s.saveRulesToFile(service, rules)
}

// UpdateRule updates a rule at a specific index
func (s *Store) UpdateRule(service string, index int, rule models.Rule) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	rules, ok := s.rules[service]
	if !ok || index < 0 || index >= len(rules) {
		return fmt.Errorf("rule not found")
	}

	rules[index] = rule
	return s.saveRulesToFile(service, rules)
}

// DeleteRule deletes a rule at a specific index
func (s *Store) DeleteRule(service string, index int) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	rules, ok := s.rules[service]
	if !ok || index < 0 || index >= len(rules) {
		return fmt.Errorf("rule not found")
	}

	// Remove rule
	rules = append(rules[:index], rules[index+1:]...)
	s.rules[service] = rules

	return s.saveRulesToFile(service, rules)
}

// MoveRule moves a rule up or down
func (s *Store) MoveRule(service string, index int, direction string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	rules, ok := s.rules[service]
	if !ok || index < 0 || index >= len(rules) {
		return fmt.Errorf("rule not found")
	}

	var newIndex int
	if direction == "up" {
		if index == 0 {
			return fmt.Errorf("rule is already at the top")
		}
		newIndex = index - 1
	} else if direction == "down" {
		if index == len(rules)-1 {
			return fmt.Errorf("rule is already at the bottom")
		}
		newIndex = index + 1
	} else {
		return fmt.Errorf("invalid direction: %s", direction)
	}

	// Swap rules
	rules[index], rules[newIndex] = rules[newIndex], rules[index]
	s.rules[service] = rules

	return s.saveRulesToFile(service, rules)
}

// DisableService disables a service by renaming its YAML file with a .disabled-timestamp extension
func (s *Store) DisableService(service string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Check if service exists
	if _, ok := s.rules[service]; !ok {
		return fmt.Errorf("service not found: %s", service)
	}

	// Get the file path
	filePath := filepath.Join(s.configDir, service+".yaml")

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return fmt.Errorf("service file not found: %s", filePath)
	}

	// Create new filename with timestamp
	timestamp := time.Now().Format("20060102-150405")
	newFilePath := filepath.Join(s.configDir, fmt.Sprintf("%s.yaml.disabled-%s", service, timestamp))

	// Rename the file
	if err := os.Rename(filePath, newFilePath); err != nil {
		return fmt.Errorf("failed to disable service: %w", err)
	}

	// Remove from in-memory store
	delete(s.rules, service)

	return nil
}

// saveRulesToFile saves rules to a YAML file
func (s *Store) saveRulesToFile(service string, rules []models.Rule) error {
	serviceRules := models.ServiceRules{Rules: rules}

	data, err := yaml.Marshal(serviceRules)
	if err != nil {
		return fmt.Errorf("failed to marshal YAML: %w", err)
	}

	filePath := filepath.Join(s.configDir, service+".yaml")
	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}

	return nil
}

// AddTraffic adds a traffic entry
func (s *Store) AddTraffic(entry models.TrafficEntry) {
	// Truncate request body
	entry.Body = truncateBody(entry.Body)

	// Truncate response body if present (it's always a string)
	if entry.Response != nil {
		entry.Response.Body = truncateStringBody(entry.Response.Body)
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	// Add to list
	s.traffic = append(s.traffic, entry)

	// Keep only last N entries (use config value)
	maxEntries := s.config.MaxTrafficEntries
	if len(s.traffic) > maxEntries {
		s.traffic = s.traffic[len(s.traffic)-maxEntries:]
	}

	// Immediately append to disk (eager write)
	if err := s.appendTrafficEntry(entry); err != nil {
		fmt.Printf("Warning: Failed to append traffic entry to disk: %v\n", err)
	}

	// Broadcast to all SSE subscribers (non-blocking)
	if !s.closed {
		for ch := range s.subscribers {
			select {
			case ch <- entry:
			default:
				// Channel full, skip this subscriber
			}
		}
	}
}

// GetTraffic returns recent traffic entries
func (s *Store) GetTraffic(limit int, service string) []models.TrafficEntry {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []models.TrafficEntry

	// Filter by service if specified
	for i := len(s.traffic) - 1; i >= 0 && len(result) < limit; i-- {
		entry := s.traffic[i]
		if service == "" || entry.Service == service {
			result = append(result, entry)
		}
	}

	return result
}

// GetTrafficByID returns a specific traffic entry
func (s *Store) GetTrafficByID(id string) *models.TrafficEntry {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for i := range s.traffic {
		if s.traffic[i].ID == id {
			entry := s.traffic[i]
			return &entry
		}
	}

	return nil
}

// SubscribeTraffic creates a new channel for traffic updates
func (s *Store) SubscribeTraffic() <-chan models.TrafficEntry {
	s.mu.Lock()
	defer s.mu.Unlock()

	ch := make(chan models.TrafficEntry, 10)
	s.subscribers[ch] = struct{}{}
	return ch
}

// UnsubscribeTraffic removes a subscriber channel
func (s *Store) UnsubscribeTraffic(ch <-chan models.TrafficEntry) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Convert to bidirectional channel for deletion
	if writeCh, ok := interface{}(ch).(chan models.TrafficEntry); ok {
		delete(s.subscribers, writeCh)
		close(writeCh)
	}
}

// Close closes the store and stops the file watcher
func (s *Store) Close() error {
	s.mu.Lock()
	if !s.closed {
		s.closed = true
		// Close all subscriber channels
		for ch := range s.subscribers {
			close(ch)
		}
		s.subscribers = make(map[chan models.TrafficEntry]struct{})
	}
	s.mu.Unlock()

	if s.watcher != nil {
		return s.watcher.Close()
	}
	return nil
}

// truncateStringBody truncates a string body to maxBodySizeBytes
func truncateStringBody(body string) string {
	if len(body) <= maxBodySizeBytes {
		return body
	}
	return body[:maxBodySizeBytes] + "...[truncated]"
}

// truncateBody truncates large body data to maxBodySizeBytes
func truncateBody(data interface{}) interface{} {
	if data == nil {
		return nil
	}

	var bodyStr string
	switch v := data.(type) {
	case string:
		bodyStr = v
	case map[string]interface{}, []interface{}:
		// Convert to JSON string
		jsonBytes, err := json.Marshal(v)
		if err != nil {
			return data // Return as-is if marshaling fails
		}
		bodyStr = string(jsonBytes)
	default:
		return data // Unknown type, return as-is
	}

	if len(bodyStr) <= maxBodySizeBytes {
		return data // No truncation needed
	}

	// Truncate and add indicator
	return bodyStr[:maxBodySizeBytes] + "...[truncated]"
}

// loadTrafficFromFile loads traffic history from traffic.ndjson
func (s *Store) loadTrafficFromFile() error {
	trafficPath := filepath.Join(s.configDir, "traffic.ndjson")

	file, err := os.Open(trafficPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil // File doesn't exist yet, start with empty traffic
		}
		return err
	}
	defer file.Close()

	var traffic []models.TrafficEntry
	scanner := bufio.NewScanner(file)
	lineNum := 0

	for scanner.Scan() {
		lineNum++
		line := scanner.Text()
		if line == "" {
			continue // Skip empty lines
		}

		var entry models.TrafficEntry
		if err := json.Unmarshal([]byte(line), &entry); err != nil {
			fmt.Printf("Warning: Skipping invalid traffic entry at line %d: %v\n", lineNum, err)
			continue
		}

		traffic = append(traffic, entry)
	}

	if err := scanner.Err(); err != nil {
		return fmt.Errorf("failed to read traffic.ndjson: %w", err)
	}

	s.mu.Lock()
	s.traffic = traffic
	s.mu.Unlock()

	fmt.Printf("Loaded %d traffic entries from history\n", len(traffic))
	return nil
}

// appendTrafficEntry appends a single traffic entry to traffic.ndjson
func (s *Store) appendTrafficEntry(entry models.TrafficEntry) error {
	// Marshal entry to compact JSON (no indentation)
	data, err := json.Marshal(entry)
	if err != nil {
		return fmt.Errorf("failed to marshal traffic entry: %w", err)
	}

	// Open file in append mode (create if doesn't exist)
	trafficPath := filepath.Join(s.configDir, "traffic.ndjson")
	file, err := os.OpenFile(trafficPath, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		return fmt.Errorf("failed to open traffic file: %w", err)
	}
	defer file.Close()

	// Write JSON line + newline
	if _, err := file.Write(data); err != nil {
		return fmt.Errorf("failed to write traffic entry: %w", err)
	}
	if _, err := file.WriteString("\n"); err != nil {
		return fmt.Errorf("failed to write newline: %w", err)
	}

	return nil
}
