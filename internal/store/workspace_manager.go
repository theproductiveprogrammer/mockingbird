package store

import (
	"bufio"
	"encoding/json"
	"fmt"
	"math/rand"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"gopkg.in/yaml.v3"

	"github.com/theproductiveprogrammer/mockingbird.git/internal/config"
	"github.com/theproductiveprogrammer/mockingbird.git/internal/models"
)

// WorkspaceMetadata stores workspace configuration
type WorkspaceMetadata struct {
	BirdIcon string    `json:"bird_icon"`
	Created  time.Time `json:"created"`
}

// Available bird icons (bird01.svg through bird18.svg)
var birdIcons = []string{
	"bird01.svg", "bird02.svg", "bird03.svg", "bird04.svg", "bird05.svg", "bird06.svg",
	"bird07.svg", "bird08.svg", "bird09.svg", "bird10.svg", "bird11.svg", "bird12.svg",
	"bird13.svg", "bird14.svg", "bird15.svg", "bird16.svg", "bird17.svg", "bird18.svg",
}

// WorkspaceManager manages per-workspace Store instances with lazy loading
type WorkspaceManager struct {
	configDir string
	config    *config.Config
	stores    map[string]*Store
	mu        sync.RWMutex
}

// NewWorkspaceManager creates a new workspace manager
func NewWorkspaceManager(configDir string, cfg *config.Config) (*WorkspaceManager, error) {
	wm := &WorkspaceManager{
		configDir: configDir,
		config:    cfg,
		stores:    make(map[string]*Store),
	}

	return wm, nil
}

// GetStore returns the Store for a workspace, loading it if necessary (lazy loading)
func (wm *WorkspaceManager) GetStore(workspace string) (*Store, error) {
	// Fast path: check if already loaded
	wm.mu.RLock()
	if store, exists := wm.stores[workspace]; exists {
		wm.mu.RUnlock()
		return store, nil
	}
	wm.mu.RUnlock()

	// Slow path: need to load the workspace
	wm.mu.Lock()
	defer wm.mu.Unlock()

	// Double-check after acquiring write lock (another goroutine might have loaded it)
	if store, exists := wm.stores[workspace]; exists {
		return store, nil
	}

	// Load the workspace
	workspaceDir := filepath.Join(wm.configDir, "workspaces", workspace)
	store, err := New(workspaceDir, wm.config)
	if err != nil {
		return nil, fmt.Errorf("failed to load workspace %s: %w", workspace, err)
	}

	wm.stores[workspace] = store
	return store, nil
}

// UnloadWorkspace unloads a workspace from memory (closes its store)
func (wm *WorkspaceManager) UnloadWorkspace(workspace string) error {
	wm.mu.Lock()
	defer wm.mu.Unlock()

	store, exists := wm.stores[workspace]
	if !exists {
		return nil // Already unloaded
	}

	if err := store.Close(); err != nil {
		return fmt.Errorf("failed to close store for workspace %s: %w", workspace, err)
	}

	delete(wm.stores, workspace)
	return nil
}

// GetWorkspaces returns all active workspaces (excludes .disabled)
func (wm *WorkspaceManager) GetWorkspaces() ([]models.Workspace, error) {
	workspacesDir := filepath.Join(wm.configDir, "workspaces")

	// Read directory entries
	entries, err := os.ReadDir(workspacesDir)
	if err != nil {
		if os.IsNotExist(err) {
			return []models.Workspace{}, nil
		}
		return nil, fmt.Errorf("failed to read workspaces directory: %w", err)
	}

	var workspaces []models.Workspace
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		name := entry.Name()

		// Skip disabled workspaces
		if strings.HasSuffix(name, ".disabled") {
			continue
		}

		// Load workspace metadata (bird icon, created time)
		workspaceDir := filepath.Join(workspacesDir, name)
		metadata := loadWorkspaceMetadata(workspaceDir)

		// Count rules and traffic
		ruleCount := wm.countWorkspaceRules(name)
		trafficCount := wm.countWorkspaceTraffic(name)

		workspaces = append(workspaces, models.Workspace{
			Name:         name,
			Created:      metadata.Created,
			RuleCount:    ruleCount,
			TrafficCount: trafficCount,
			BirdIcon:     metadata.BirdIcon,
		})
	}

	return workspaces, nil
}

// CreateWorkspace creates a new workspace by copying rules from the default workspace
func (wm *WorkspaceManager) CreateWorkspace(name string) error {
	// Validate workspace name
	if err := validateWorkspaceName(name); err != nil {
		return err
	}

	workspacesDir := filepath.Join(wm.configDir, "workspaces")
	newWorkspace := filepath.Join(workspacesDir, name)

	// Check if workspace already exists
	if _, err := os.Stat(newWorkspace); err == nil {
		return fmt.Errorf("workspace %s already exists", name)
	}

	// Create workspace directory structure
	rulesDir := filepath.Join(newWorkspace, "_rules")
	if err := os.MkdirAll(rulesDir, 0755); err != nil {
		return fmt.Errorf("failed to create workspace: %w", err)
	}

	// Copy rules from default workspace
	defaultRulesDir := filepath.Join(workspacesDir, "default", "_rules")
	if err := copyRules(defaultRulesDir, rulesDir); err != nil {
		return fmt.Errorf("failed to copy rules: %w", err)
	}

	// Randomly assign a bird icon and save metadata
	birdIcon := birdIcons[rand.Intn(len(birdIcons))]
	metadata := WorkspaceMetadata{
		BirdIcon: birdIcon,
		Created:  time.Now(),
	}
	if err := saveWorkspaceMetadata(newWorkspace, &metadata); err != nil {
		return fmt.Errorf("failed to save workspace metadata: %w", err)
	}

	return nil
}

// DisableWorkspace renames a workspace to add .disabled suffix
func (wm *WorkspaceManager) DisableWorkspace(name string) error {
	if name == "default" {
		return fmt.Errorf("cannot disable default workspace")
	}

	// Unload if loaded
	wm.UnloadWorkspace(name)

	workspacesDir := filepath.Join(wm.configDir, "workspaces")
	oldPath := filepath.Join(workspacesDir, name)
	newPath := filepath.Join(workspacesDir, name+".disabled")

	if err := os.Rename(oldPath, newPath); err != nil {
		return fmt.Errorf("failed to disable workspace: %w", err)
	}

	return nil
}

// EnableWorkspace removes .disabled suffix from a workspace
func (wm *WorkspaceManager) EnableWorkspace(name string) error {
	workspacesDir := filepath.Join(wm.configDir, "workspaces")
	oldPath := filepath.Join(workspacesDir, name+".disabled")
	newPath := filepath.Join(wm.configDir, "workspaces", name)

	if err := os.Rename(oldPath, newPath); err != nil {
		return fmt.Errorf("failed to enable workspace: %w", err)
	}

	return nil
}

// DuplicateWorkspace creates a copy of an existing workspace
func (wm *WorkspaceManager) DuplicateWorkspace(source, dest string) error {
	if err := validateWorkspaceName(dest); err != nil {
		return err
	}

	workspacesDir := filepath.Join(wm.configDir, "workspaces")
	srcPath := filepath.Join(workspacesDir, source)
	destPath := filepath.Join(workspacesDir, dest)

	// Check if destination already exists
	if _, err := os.Stat(destPath); err == nil {
		return fmt.Errorf("workspace %s already exists", dest)
	}

	// Create destination
	if err := os.MkdirAll(destPath, 0755); err != nil {
		return fmt.Errorf("failed to create workspace: %w", err)
	}

	// Copy rules
	srcRules := filepath.Join(srcPath, "_rules")
	destRules := filepath.Join(destPath, "_rules")
	if err := copyRules(srcRules, destRules); err != nil {
		return fmt.Errorf("failed to copy rules: %w", err)
	}

	// Copy traffic if it exists
	srcTraffic := filepath.Join(srcPath, "traffic.ndjson")
	destTraffic := filepath.Join(destPath, "traffic.ndjson")
	copyFile(srcTraffic, destTraffic) // Ignore errors if traffic doesn't exist

	// Copy metadata if it exists, otherwise create new one with random bird icon
	srcMetadata := filepath.Join(srcPath, "metadata.json")
	destMetadata := filepath.Join(destPath, "metadata.json")
	if err := copyFile(srcMetadata, destMetadata); err != nil {
		// If metadata doesn't exist, create new one with random bird icon
		birdIcon := birdIcons[rand.Intn(len(birdIcons))]
		metadata := WorkspaceMetadata{
			BirdIcon: birdIcon,
			Created:  time.Now(),
		}
		saveWorkspaceMetadata(destPath, &metadata) // Ignore error
	}

	return nil
}

// Close closes all loaded workspace stores
func (wm *WorkspaceManager) Close() error {
	wm.mu.Lock()
	defer wm.mu.Unlock()

	var lastErr error
	for workspace, store := range wm.stores {
		if err := store.Close(); err != nil {
			lastErr = fmt.Errorf("failed to close workspace %s: %w", workspace, err)
		}
	}

	wm.stores = make(map[string]*Store)
	return lastErr
}

// Helper functions

func validateWorkspaceName(name string) error {
	if name == "" {
		return fmt.Errorf("workspace name cannot be empty")
	}
	if strings.Contains(name, ".disabled") {
		return fmt.Errorf("workspace name cannot contain .disabled")
	}
	if strings.ContainsAny(name, "/\\") {
		return fmt.Errorf("workspace name cannot contain slashes")
	}
	return nil
}

func (wm *WorkspaceManager) countWorkspaceRules(workspace string) int {
	rulesDir := filepath.Join(wm.configDir, "workspaces", workspace, "_rules")
	files, err := filepath.Glob(filepath.Join(rulesDir, "*.yaml"))
	if err != nil {
		return 0
	}

	count := 0
	for _, file := range files {
		if strings.HasSuffix(file, ".disabled") {
			continue
		}

		// Read and count rules in file
		data, err := os.ReadFile(file)
		if err != nil {
			continue
		}

		var serviceRules models.ServiceRules
		if err := yaml.Unmarshal(data, &serviceRules); err != nil {
			continue
		}

		count += len(serviceRules.Rules)
	}

	return count
}

func (wm *WorkspaceManager) countWorkspaceTraffic(workspace string) int {
	trafficPath := filepath.Join(wm.configDir, "workspaces", workspace, "traffic.ndjson")
	file, err := os.Open(trafficPath)
	if err != nil {
		return 0
	}
	defer file.Close()

	count := 0
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		count++
	}

	return count
}

func copyRules(src, dest string) error {
	// Create destination directory
	if err := os.MkdirAll(dest, 0755); err != nil {
		return err
	}

	// Get all rule files
	files, err := filepath.Glob(filepath.Join(src, "*.yaml"))
	if err != nil {
		return err
	}

	for _, srcFile := range files {
		destFile := filepath.Join(dest, filepath.Base(srcFile))
		if err := copyFile(srcFile, destFile); err != nil {
			return err
		}
	}

	return nil
}

func copyFile(src, dest string) error {
	data, err := os.ReadFile(src)
	if err != nil {
		return err
	}
	return os.WriteFile(dest, data, 0644)
}

// saveWorkspaceMetadata saves workspace metadata to metadata.json
func saveWorkspaceMetadata(workspaceDir string, metadata *WorkspaceMetadata) error {
	metadataPath := filepath.Join(workspaceDir, "metadata.json")
	data, err := json.Marshal(metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %w", err)
	}
	return os.WriteFile(metadataPath, data, 0644)
}

// loadWorkspaceMetadata loads workspace metadata from metadata.json
// Returns default metadata with random bird icon if file doesn't exist
func loadWorkspaceMetadata(workspaceDir string) WorkspaceMetadata {
	metadataPath := filepath.Join(workspaceDir, "metadata.json")
	data, err := os.ReadFile(metadataPath)
	if err != nil {
		// Return default metadata with random bird icon if metadata doesn't exist
		return WorkspaceMetadata{
			BirdIcon: birdIcons[rand.Intn(len(birdIcons))],
			Created:  time.Now(),
		}
	}

	var metadata WorkspaceMetadata
	if err := json.Unmarshal(data, &metadata); err != nil {
		// Return default metadata with random bird icon if unmarshal fails
		return WorkspaceMetadata{
			BirdIcon: birdIcons[rand.Intn(len(birdIcons))],
			Created:  time.Now(),
		}
	}

	return metadata
}
