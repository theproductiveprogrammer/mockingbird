# Workspace Feature - Continuation Plan

## Status: ~30% Complete ✅

### ✅ Completed (Backend Infrastructure)

1. **Workspace Model** (`internal/models/models.go`)
   - Added `Workspace` struct with name, created, rule_count, traffic_count

2. **WorkspaceManager** (`internal/store/workspace_manager.go`) - NEW FILE
   - Per-workspace Store instances with lazy loading
   - CRUD operations: GetWorkspaces, CreateWorkspace, DisableWorkspace, EnableWorkspace, DuplicateWorkspace
   - Helper functions for counting rules/traffic
   - Proper cleanup on Close()

3. **Config Updates** (`internal/config/config.go`)
   - ConfigDir now excluded from JSON serialization (env var only)
   - Default workspace `bird1` auto-created on startup
   - Traffic limit reduced from 10,000 → 1,000 (configurable via `max_traffic_entries`)

4. **Build & Test**
   - ✅ Builds successfully
   - ✅ Creates default workspace: `workspaces/bird1/_rules/`
   - ✅ Server starts without errors

### 🔨 Remaining Work (~70%)

## Phase 1: Backend Integration

### 1. Update Server Initialization (`cmd/server/main.go`)
**Current:** Creates single Store
**Needed:** Create WorkspaceManager instead

```go
// Replace:
store, err := store.New(cfg.ConfigDir, cfg)

// With:
workspaceManager, err := store.NewWorkspaceManager(cfg.ConfigDir, cfg)
```

### 2. Update Proxy Handler (`internal/proxy/handler.go`)
**Task:** Parse workspace from URL and route to correct Store

```go
// Parse URL for workspace prefix: /w/{workspace}/{path}
// Example: /w/Dave/service1/api → workspace="Dave", path="/service1/api"

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    workspace := "bird1" // default
    path := r.URL.Path

    // Parse /w/{workspace}/ prefix
    if strings.HasPrefix(path, "/w/") {
        parts := strings.SplitN(path[3:], "/", 2)
        if len(parts) >= 1 {
            workspace = parts[0]
            if len(parts) >= 2 {
                path = "/" + parts[1]
            } else {
                path = "/"
            }
        }
    }

    // Get workspace store
    store, err := h.workspaceManager.GetStore(workspace)
    if err != nil {
        // 404 if workspace doesn't exist
        http.Error(w, "Workspace not found", http.StatusNotFound)
        return
    }

    // Update request path (strip workspace prefix)
    r.URL.Path = path

    // Continue with existing proxy logic using this store...
}
```

### 3. Update Admin API (`internal/admin/api.go`)
**Task:** Integrate WorkspaceManager and add workspace endpoints

**Step 1:** Update API struct to use WorkspaceManager
```go
type API struct {
    config           *config.Config
    workspaceManager *store.WorkspaceManager
    router           chi.Router
}
```

**Step 2:** Update route handlers to extract workspace from URL
- Routes change from `/api/traffic` to `/w/{workspace}/api/traffic`
- Root `/` serves splash page
- `/w/{workspace}/` serves workspace-specific UI

**Step 3:** Add new workspace management endpoints
```go
// Workspace management (at root level, not workspace-specific)
r.Get("/api/workspaces", a.handleGetWorkspaces)
r.Post("/api/workspaces", a.handleCreateWorkspace)
r.Delete("/api/workspaces/{name}", a.handleDisableWorkspace)
r.Post("/api/workspaces/{name}/enable", a.handleEnableWorkspace)
r.Post("/api/workspaces/{name}/duplicate", a.handleDuplicateWorkspace)

// Workspace-specific routes
r.Route("/w/{workspace}", func(r chi.Router) {
    r.Get("/api/traffic", a.handleGetTraffic)
    r.Get("/api/rules", a.handleGetRules)
    // ... all existing endpoints
})
```

**Step 4:** Update static file serving
```go
// Serve splash page at root
r.Get("/", a.handleSplashPage)

// Serve workspace UI at /w/{workspace}/*
r.Handle("/w/{workspace}/*", a.handleWorkspaceUI)
```

## Phase 2: Frontend

### 4. Create Workspace Splash Page (`webui/src/components/WorkspaceSplash.tsx`)
**Purpose:** Landing page showing all workspaces

**Features:**
- Card grid of workspaces
- Each card shows: name, rule count, traffic count
- "Open Dashboard" button → `/w/{name}/`
- "Copy Proxy URL" button
- "Create New Workspace" button
- Clean, bird-themed design

### 5. Add Workspace Context (`webui/src/stores/appStore.ts`)
**Task:** Add workspace to global state

```typescript
interface AppState {
  workspace: string | null;
  setWorkspace: (workspace: string) => void;
  // ... existing state
}

// Extract workspace from URL
const extractWorkspace = (): string | null => {
  const match = window.location.pathname.match(/^\/w\/([^\/]+)/);
  return match ? match[1] : null;
};
```

### 6. Update API Client (`webui/src/utils/api.ts`)
**Task:** Include workspace in all API calls

```typescript
const getWorkspace = (): string => {
  const match = window.location.pathname.match(/^\/w\/([^\/]+)/);
  return match ? match[1] : 'bird1';
};

const getApiBase = (): string => {
  const workspace = getWorkspace();
  return `/w/${workspace}/api`;
};

// Update all methods to use getApiBase()
```

### 7. Update Routing (`webui/src/App.tsx`)
**Task:** Add routes for splash and workspace UI

```typescript
<Routes>
  <Route path="/" element={<WorkspaceSplash />} />
  <Route path="/w/:workspace/*" element={<WorkspaceUI />} />
</Routes>
```

### 8. Update Header (`webui/src/components/Header.tsx`)
**Task:** Display current workspace

```typescript
// Show workspace name as badge
const workspace = useAppStore(state => state.workspace);

<div className="flex items-center gap-2">
  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
    {workspace}
  </span>
  <a href="/" className="text-xs text-gray-600 hover:text-gray-900">
    ← All Workspaces
  </a>
</div>
```

### 9. Update Settings Page (`webui/src/components/Settings.tsx`)
**Task:** Add workspace management section

**Features:**
- List all workspaces (including disabled)
- Each row: name, rules count, traffic count, dashboard URL, proxy URL
- Actions: Disable/Enable, Duplicate
- Create workspace form

## Phase 3: Testing

### 10. Manual Testing Checklist
- [ ] Fresh install creates `bird1` workspace
- [ ] Splash page shows all workspaces
- [ ] Create new workspace copies rules from bird1
- [ ] Proxy routing works: `/w/Dave/service1` routes to Dave's workspace
- [ ] Dashboard routing works: `/w/Dave/` loads Dave's UI
- [ ] Traffic is isolated per workspace
- [ ] Rules are isolated per workspace
- [ ] Disable workspace hides it from splash
- [ ] Enable workspace shows it again
- [ ] Duplicate copies rules and traffic
- [ ] Memory usage reasonable (1000 entries × num workspaces)

## Implementation Order

**Session 1 (Next):**
1. Update server initialization (5 min)
2. Update proxy handler for workspace routing (30 min)
3. Test proxy routing with curl

**Session 2:**
1. Update admin API for workspace support (45 min)
2. Add workspace management endpoints (30 min)
3. Test API endpoints with curl

**Session 3:**
1. Create splash page component (45 min)
2. Add workspace context (15 min)
3. Update routing (15 min)

**Session 4:**
1. Update API client for workspace paths (30 min)
2. Update header with workspace display (15 min)
3. Update settings page (45 min)

**Session 5:**
1. Full integration testing
2. Bug fixes
3. Documentation

## Current Code State

### Modified Files
- `internal/models/models.go` - Added Workspace struct
- `internal/config/config.go` - ConfigDir excluded from JSON, default workspace creation
- `internal/store/workspace_manager.go` - NEW FILE

### New Files
- `internal/store/workspace_manager.go`

### Unmodified (Need Updates)
- `cmd/server/main.go` - Still creates single Store
- `internal/proxy/handler.go` - No workspace routing yet
- `internal/admin/api.go` - No workspace support yet
- All frontend files - No workspace awareness yet

## Migration Path for Existing Users

**Option 1: Manual Migration (Recommended)**
```bash
mkdir -p ~/.config/mockingbird/workspaces/bird1
mv ~/.config/mockingbird/traffic.ndjson ~/.config/mockingbird/workspaces/bird1/
mv ~/.config/mockingbird/_rules ~/.config/mockingbird/workspaces/bird1/
```

**Option 2: Start Fresh**
- New installation auto-creates `bird1` workspace
- Users manually create rules/workspaces as needed

## Design Decisions Log

1. **Per-workspace Store with lazy loading** - Balances memory and complexity
2. **Traffic limit reduced to 1000** - More reasonable default (configurable)
3. **`.disabled` suffix** - Non-destructive deletion, easy to enable/disable
4. **`/w/` URL prefix** - Short and clean
5. **`bird1` default name** - Fun, memorable, bird theme
6. **No backward compatibility** - Clean slate, simpler implementation

## Notes

- Config file (`config.json`) is shared across all workspaces
- Each workspace has independent traffic.ndjson and _rules/
- File watchers per workspace (managed by each Store)
- SSE subscriptions per workspace
- Current implementation uses ~70MB per 1000-entry workspace (approx)
