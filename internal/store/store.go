package store

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"gopkg.in/yaml.v3"

	"github.com/theproductiveprogrammer/mockingbird.git/internal/models"
)

const maxTrafficEntries = 100

// Store manages rules and traffic history
type Store struct {
	configDir    string
	rules        map[string][]models.Rule // service name -> rules
	traffic      []models.TrafficEntry
	trafficChan  chan models.TrafficEntry // For SSE broadcasting
	mu           sync.RWMutex
	watcher      *Watcher
}

// New creates a new store
func New(configDir string) (*Store, error) {
	s := &Store{
		configDir:   configDir,
		rules:       make(map[string][]models.Rule),
		traffic:     make([]models.TrafficEntry, 0, maxTrafficEntries),
		trafficChan: make(chan models.TrafficEntry, 10),
	}

	// Ensure config directory exists
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create config directory: %w", err)
	}

	// Load rules from files
	if err := s.loadAllRules(); err != nil {
		return nil, fmt.Errorf("failed to load rules: %w", err)
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
	s.mu.Lock()
	defer s.mu.Unlock()

	// Add to list
	s.traffic = append(s.traffic, entry)

	// Keep only last N entries
	if len(s.traffic) > maxTrafficEntries {
		s.traffic = s.traffic[len(s.traffic)-maxTrafficEntries:]
	}

	// Broadcast to SSE listeners (non-blocking)
	select {
	case s.trafficChan <- entry:
	default:
		// Channel full, skip
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

// SubscribeTraffic returns a channel for traffic updates
func (s *Store) SubscribeTraffic() <-chan models.TrafficEntry {
	return s.trafficChan
}

// Close closes the store and stops the file watcher
func (s *Store) Close() error {
	if s.watcher != nil {
		return s.watcher.Close()
	}
	return nil
}
