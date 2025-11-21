package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"sync"
	"time"
)

// Config holds application configuration
type Config struct {
	ProxyPort         int               `json:"proxy_port"`
	AdminPort         int               `json:"admin_port"`
	ConfigDir         string            `json:"-"`                         // Where rules are stored (never serialize - use env var only)
	MaxTrafficEntries int               `json:"max_traffic_entries"`       // Maximum traffic entries to store
	Values            map[string]string `json:"values"`                    // Custom key-value pairs (API keys, etc.)
	Version           string            `json:"version,omitempty"`         // Version (e.g., "v1.3.0")
	BuildName         string            `json:"build_name,omitempty"`      // Fun build name (e.g., "raging_rhino")
	BuildTime         string            `json:"build_time,omitempty"`      // Build timestamp
	CommitHash        string            `json:"commit_hash,omitempty"`     // Git commit hash
	GoVersion         string            `json:"go_version,omitempty"`      // Go compiler version
	mu                sync.RWMutex      `json:"-"`
}

// Load loads configuration from a file or environment variables
func Load() (*Config, error) {
	configDir := getConfigDir()

	cfg := &Config{
		ProxyPort:         6625, // MOCK on phone keypad
		AdminPort:         6626, // MOCK + 1
		ConfigDir:         configDir,
		MaxTrafficEntries: 5000, // Default traffic history limit (configurable via config.json)
		Values:            make(map[string]string),
	}

	// Try to load config file
	configPath := filepath.Join(configDir, "config.json")
	if err := loadFromFile(cfg, configPath); err != nil {
		// Config file is optional, just log if there's an error
		fmt.Printf("Note: Could not load config from %s: %v\n", configPath, err)
	}

	// Override with environment variables
	if port := os.Getenv("MOCKINGBIRD_PROXY_PORT"); port != "" {
		if p, err := strconv.Atoi(port); err == nil {
			cfg.ProxyPort = p
		}
	}

	if port := os.Getenv("MOCKINGBIRD_ADMIN_PORT"); port != "" {
		if p, err := strconv.Atoi(port); err == nil {
			cfg.AdminPort = p
		}
	}

	// Ensure default workspace exists
	if err := cfg.ensureDefaultWorkspace(); err != nil {
		fmt.Printf("Warning: Failed to create default workspace: %v\n", err)
	}

	return cfg, nil
}

// getConfigDir returns the configuration directory
func getConfigDir() string {
	// Check environment variable first
	if dir := os.Getenv("MOCKINGBIRD_CONFIG_DIR"); dir != "" {
		return dir
	}

	// Default to ~/.config/mockingbird
	home, err := os.UserHomeDir()
	if err != nil {
		return ".mockingbird" // Fallback to current directory
	}

	return filepath.Join(home, ".config", "mockingbird")
}

func loadFromFile(cfg *Config, path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	return json.Unmarshal(data, cfg)
}

// Get retrieves a value from the config (thread-safe)
func (c *Config) Get(key string) string {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.Values[key]
}

// Set sets a value in the config (thread-safe)
func (c *Config) Set(key, value string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.Values[key] = value
}

// Delete removes a value from the config (thread-safe)
func (c *Config) Delete(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.Values, key)
}

// GetAll returns all config values (masked for security)
func (c *Config) GetAll(mask bool) map[string]string {
	c.mu.RLock()
	defer c.mu.RUnlock()

	result := make(map[string]string, len(c.Values))
	for k, v := range c.Values {
		if mask {
			result[k] = maskValue(v)
		} else {
			result[k] = v
		}
	}
	return result
}

// Save persists the config to disk
func (c *Config) Save() error {
	c.mu.RLock()
	defer c.mu.RUnlock()

	// Ensure config directory exists
	if err := os.MkdirAll(c.ConfigDir, 0755); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}

	configPath := filepath.Join(c.ConfigDir, "config.json")

	data, err := json.MarshalIndent(c, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	if err := os.WriteFile(configPath, data, 0600); err != nil {
		return fmt.Errorf("failed to write config file: %w", err)
	}

	return nil
}

// maskValue masks a config value for security
func maskValue(value string) string {
	if len(value) <= 7 {
		return "***"
	}
	return value[:7] + "***"
}

// ensureDefaultWorkspace creates the default workspace structure if it doesn't exist
func (c *Config) ensureDefaultWorkspace() error {
	workspacesDir := filepath.Join(c.ConfigDir, "workspaces")
	defaultWorkspace := filepath.Join(workspacesDir, "default")
	rulesDir := filepath.Join(defaultWorkspace, "_rules")

	// Create workspaces/default/_rules/ structure
	if err := os.MkdirAll(rulesDir, 0755); err != nil {
		return fmt.Errorf("failed to create default workspace: %w", err)
	}

	// Create metadata.json if it doesn't exist
	metadataPath := filepath.Join(defaultWorkspace, "metadata.json")
	if _, err := os.Stat(metadataPath); os.IsNotExist(err) {
		// Bird icons available
		birdIcons := []string{
			"bird01.svg", "bird02.svg", "bird03.svg", "bird04.svg", "bird05.svg", "bird06.svg",
			"bird07.svg", "bird08.svg", "bird09.svg", "bird10.svg", "bird11.svg", "bird12.svg",
			"bird13.svg", "bird14.svg", "bird15.svg", "bird16.svg", "bird17.svg", "bird18.svg",
		}

		// Assign bird01.svg to default workspace (always the first bird for consistency)
		metadata := map[string]interface{}{
			"bird_icon": birdIcons[0], // Always use bird01.svg for default workspace
			"created":   time.Now().Format(time.RFC3339),
		}

		data, err := json.MarshalIndent(metadata, "", "  ")
		if err != nil {
			return fmt.Errorf("failed to marshal metadata: %w", err)
		}

		if err := os.WriteFile(metadataPath, data, 0644); err != nil {
			return fmt.Errorf("failed to write metadata: %w", err)
		}
	}

	return nil
}
