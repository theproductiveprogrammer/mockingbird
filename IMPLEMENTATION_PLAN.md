# 🐦 Mockingbird - Implementation Plan

## Overview

Build Mockingbird as a centralized API gateway for managing external service calls during development/testing. Implementation follows a bottom-up approach, building foundational packages first, then composing them into the complete system.

---

## Phase 1: Foundation (Core Data Structures)

### 1.1 Config System (`internal/config`)

**Purpose**: Load and manage application configuration and API keys

**Files**:

- `config.go` - Config struct and loader

**Key Features**:

- Load from `~/.config/mockingbird/config.json` (default)
- Override via environment variables:
    - `MOCKINGBIRD_CONFIG_DIR` - config directory path
    - `MOCKINGBIRD_PROXY_PORT` - proxy port (default 8769)
    - `MOCKINGBIRD_ADMIN_PORT` - admin API port (default 8768)
- Store API keys and custom values in `values` map
- Thread-safe access methods: `Get(key)`, `Set(key, value)`

**Config File Format**:

```json
{
    "proxy_port": 8769,
    "admin_port": 8768,
    "values": {
        "SERVICEX_API_KEY": "sk-xxx",
        "OPENAI_API_KEY": "sk-yyy"
    }
}
```

**Dependencies**: None
**Estimated Complexity**: Low

---

### 1.2 Request/Response Models (`internal/models`)

**Purpose**: Define data structures for requests, responses, and rules

**Files**:

- `models.go` - TrafficEntry, Rule, MatchCondition, etc.

**Key Structures**:

```go
type TrafficEntry struct {
    ID          string
    Timestamp   time.Time
    Method      string
    Path        string
    QueryParams map[string][]string
    Headers     map[string][]string
    Body        interface{} // JSON object or string
    Response    *Response
}

type Response struct {
    StatusCode int
    Headers    map[string]string
    Body       string
    Delay      time.Duration
}

type Rule struct {
    Match    MatchCondition
    ProxyTo  string // If set, proxy to this URL
    Response string // If set, use this .mock template
    Headers  map[string]string // Headers to inject
}

type MatchCondition struct {
    Method  []string
    Path    string // Supports wildcards: /servicex/**
    Headers map[string]string
    Body    *BodyMatch
}

type BodyMatch struct {
    Matches string // Regex pattern
}
```

**Dependencies**: None
**Estimated Complexity**: Low

---

## Phase 2: Core Logic (Parsing & Rendering)

### 2.1 DSL Parser (`internal/dsl`)

**Purpose**: Parse `.mock` format templates into structured data

**Files**:

- `parser.go` - Parse .mock format

**Input Example**:

```
+200ms
[200]
headers:
  Content-Type: application/json
  X-Custom: value
body
{
  "user": "{{ uuid }}"
}
```

**Output**:

```go
ParsedTemplate{
    Delay: 200 * time.Millisecond,
    StatusCode: 200,
    Headers: map[string]string{
        "Content-Type": "application/json",
        "X-Custom": "value",
    },
    Body: "{\n  \"user\": \"{{ uuid }}\"\n}",
}
```

**Parsing Logic**:

1. Check for delay directive: `+200ms`, `+2s`, `+1m`
2. Check for status code: `[200]`
3. Parse headers section (YAML-style, until `body`)
4. Parse body section (everything after `body` keyword)

**Dependencies**: None
**Estimated Complexity**: Medium

---

### 2.2 Template Renderer (`internal/render`)

**Purpose**: Render templates with request context and helper functions

**Files**:

- `renderer.go` - Template renderer with custom functions

**Template Functions**:

- `uuid` - Generate UUID
- `now` - Current timestamp (RFC3339)
- `random from to` - Random integer
- `reqHeader "name"` - Get request header
- `reqPathParam index` - Get path segment (0-based)
- `reqQueryParam "name"` - Get query parameter
- `reqBody "path"` - Get JSON body field (e.g., "user.name", "data[0].id")
- `config "key"` - Get config value

**Usage**:

```go
renderer := NewRenderer(config)
output, err := renderer.Render(template, requestContext)
```

**Dependencies**: `internal/config`, `internal/models`
**Estimated Complexity**: Medium

---

## Phase 3: Matching & Storage

### 3.1 Matcher (`internal/matcher`)

**Purpose**: Match incoming requests against rules

**Files**:

- `matcher.go` - Request matching logic

**Matching Algorithm**:

1. Iterate through rules in order (first-match-wins)
2. For each rule:
    - Check method (if specified)
    - Check path (exact or wildcard match)
    - Check headers (if specified)
    - Check body regex (if specified)
3. Return first matching rule or nil

**Path Matching**:

- Exact: `/servicex/users` matches only `/servicex/users`
- Wildcard: `/servicex/**` matches `/servicex/users`, `/servicex/users/123`, etc.
- Params: `/users/{id}` matches `/users/123` and extracts `id=123`

**Dependencies**: `internal/models`
**Estimated Complexity**: Medium

---

### 3.2 Store (`internal/store`)

**Purpose**: Load, manage, and persist rules; store traffic history

**Files**:

- `store.go` - Main store implementation
- `file_loader.go` - Load/save YAML rule files
- `watcher.go` - Watch files for changes

**Key Features**:

1. Load all `*.yaml` files from config directory on startup
2. Parse YAML into Rule structs
3. Watch files for changes and hot-reload
4. Maintain traffic history (last 100 entries per service)
5. Provide thread-safe access to rules and traffic

**Rule File Format** (`servicex.yaml`):

```yaml
rules:
    - match:
          method: [GET, POST]
          path: /servicex/**
      proxyto: https://api.servicex.com/api/do
      headers:
          X-API-Key: "{{ config SERVICEX_API_KEY }}"

    - match:
          method: POST
          path: /servicex/users/**
          body:
              matches: ".*charles.*"
      response: |
          +200ms
          [200]
          headers:
            Content-Type: application/json
          body
          {
            "user": "{{ reqPathParam 2 }}",
            "id": "{{ uuid }}"
          }
```

**API**:

```go
type Store interface {
    GetRules() []Rule
    GetRulesByService(service string) []Rule
    AddRule(service string, rule Rule) error
    UpdateRule(service string, index int, rule Rule) error
    DeleteRule(service string, index int) error
    AddTraffic(entry TrafficEntry)
    GetTraffic(limit int) []TrafficEntry
    GetTrafficByService(service string, limit int) []TrafficEntry
}
```

**Dependencies**: `internal/config`, `internal/models`
**Estimated Complexity**: High

---

## Phase 4: HTTP Handling

### 4.1 Proxy Handler (`internal/proxy`)

**Purpose**: Main HTTP handler for incoming requests

**Files**:

- `handler.go` - HTTP handler implementation
- `forwarder.go` - Proxy request forwarding

**Request Flow**:

```
1. Receive request
2. Extract service name from path (e.g., /servicex/users → servicex)
3. Try to match against rules
4. If matched:
   a. If rule has `proxyto`:
      - Render headers with templates
      - Forward request to upstream
      - Capture response
   b. If rule has `response`:
      - Parse .mock template
      - Render with request context
      - Apply delay if specified
5. If no match:
   - Return 504 Gateway Timeout
6. Record request/response in store
7. Publish to SSE stream
```

**Dependencies**: `internal/config`, `internal/models`, `internal/matcher`, `internal/render`, `internal/dsl`, `internal/store`
**Estimated Complexity**: High

---

### 4.2 Admin API (`internal/admin`)

**Purpose**: REST API for managing rules, config, and viewing traffic

**Files**:

- `api.go` - HTTP handlers for REST endpoints
- `sse.go` - Server-Sent Events for live traffic
- `handlers.go` - Individual endpoint handlers

**Endpoints**: See API_DOCUMENTATION.md for details

**Dependencies**: `internal/config`, `internal/models`, `internal/store`
**Estimated Complexity**: Medium

---

## Phase 5: Main Application

### 5.1 Server Entry Point (`cmd/server`)

**Purpose**: Bootstrap and run the application

**Files**:

- `main.go` - Application entry point

**Startup Sequence**:

1. Load config from `~/.config/mockingbird/config.json`
2. Initialize store (load rules, start file watcher)
3. Create proxy handler
4. Start proxy HTTP server on port 8769
5. Start admin HTTP server on port 8768
6. Setup graceful shutdown (SIGINT, SIGTERM)
7. Log startup info (ports, config dir, loaded rules)

**Dependencies**: All internal packages
**Estimated Complexity**: Low

---

## Phase 6: Examples & Docker

### 6.1 Example Files

**Purpose**: Provide working examples for users

**Files**:

- `examples/config.json` - Sample config
- `examples/servicex.yaml` - Sample ServiceX rules
- `examples/openai.yaml` - Sample OpenAI rules
- `examples/README.md` - How to use examples

**Copy to**: `~/.config/mockingbird/` for first-time setup

**Estimated Complexity**: Low

---

### 6.2 Docker Configuration

**Purpose**: Enable containerized deployment

**Files**:

- `Dockerfile` - Multi-stage build
- `docker-compose.yml` - Local development setup
- `.dockerignore`

**Docker Features**:

- Multi-stage build (build + minimal runtime)
- Volume mounts for config and rules
- Exposed ports: 8769 (proxy), 8768 (admin)
- Environment variable support

**Estimated Complexity**: Low

---

## Phase 7: Documentation Updates

### 7.1 Update Documentation

**Purpose**: Reflect actual implementation

**Files to Update**:

- `README.md` - Update usage examples, remove `body:json`
- `CLAUDE.md` - Update DSL examples to use `body`
- `ARCHITECTURE.md` - Add revised architecture diagram

**Changes**:

- Replace `body:json` with `body` everywhere
- Add note about automatic JSON parsing
- Update example rules to match new format

**Estimated Complexity**: Low

---

## Implementation Order

1. ✅ **Phase 1.1**: Config System
2. ✅ **Phase 1.2**: Models
3. ✅ **Phase 2.1**: DSL Parser
4. ✅ **Phase 2.2**: Template Renderer
5. ✅ **Phase 3.1**: Matcher
6. ✅ **Phase 3.2**: Store
7. ✅ **Phase 4.1**: Proxy Handler
8. ✅ **Phase 4.2**: Admin API
9. ✅ **Phase 5.1**: Main Server
10. ✅ **Phase 6.1**: Examples
11. ✅ **Phase 6.2**: Docker
12. ✅ **Phase 7.1**: Documentation Updates

**Total Estimated Time**: 2-3 days for full implementation

---

## Testing Strategy

For each phase:

1. Unit tests for core logic (parser, renderer, matcher)
2. Integration test for full request flow
3. Manual testing with curl against example rules
4. Docker deployment test

**Test Cases**:

- Match by method only
- Match by path with wildcards
- Match by body regex
- Proxy with header injection
- Mock response with templates
- Config value substitution
- Request body JSON parsing (valid and invalid)
- Hot-reload of rule files
- SSE stream for live traffic

---

## Success Criteria

MVP is complete when:

- [ ] Can route requests through Mockingbird (`localhost:8769`)
- [ ] Unmocked requests return 504
- [ ] Can create proxy rules that forward to real APIs
- [ ] Can create mock rules with templated responses
- [ ] Rules are stored in YAML files (one per service)
- [ ] Hot-reload works when editing rule files
- [ ] Traffic visible via REST API
- [ ] Can create/edit/delete rules via REST API
- [ ] Can manage config via REST API
- [ ] Works in Docker
- [ ] All REST APIs documented and work with curl
