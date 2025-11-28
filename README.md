# Mockingbird

> **Fast, modern, lightweight API gateway for development and testing.**

Mockingbird is a **centralized API gateway** that routes all external service calls through one endpoint, giving you complete control to **mock, proxy, inspect, and debug** your API traffic in real-time.

Stop hardcoding API keys, stop hitting live APIs during development, and get full visibility into every external call your services make — all from one simple, fast Go service.

---

## Why Mockingbird?

| Problem                                  | Mockingbird's Solution                                              |
| ---------------------------------------- | ------------------------------------------------------------------- |
| External APIs scattered across services? | Single gateway for all external calls - one place to manage everything |
| API keys hardcoded everywhere?           | Centralized config - inject keys via templates, never expose in code |
| Need to work offline or mock flaky services? | Selectively mock endpoints while proxying everything else |
| Want to see what APIs your app is calling? | Real-time traffic dashboard with full request/response inspection |
| Need flexible matching and responses?    | Simple `.mock` format with templates - no complex YAML or code |
| Deploy anywhere?                         | Single binary or Docker container — no external DB needed |

---

## Features

### Core Gateway
- **Centralized routing** - Route all external calls through `http://localhost:6625/{service}/{path}`
- **Proxy mode** - Forward requests to real APIs with header injection
- **Mock mode** - Return custom responses without hitting external services
- **First-match-wins** - Rules evaluated top-to-bottom for predictable behavior
- **Hot-reload** - Rule changes take effect immediately without restart

### Traffic Inspection
- **Real-time dashboard** - Watch API calls as they happen via SSE streaming
- **Request/response details** - Full headers, body, timing, and matched rule info
- **Traffic filtering** - Filter by service, path, body content, or regex patterns
- **Copy as cURL** - Export any request for debugging
- **Copy request/response** - Quick copy buttons for body data
- **Clear view** - Temporarily hide old traffic to focus on new requests

### Rule Matching
- **Method matching** - GET, POST, PUT, DELETE, PATCH, or any method
- **Path patterns** - Exact, wildcard (`*`, `**`), and parameter extraction (`{id}`)
- **Query params** - Match on specific query parameter values
- **Header matching** - Match on request headers
- **Body matching** - Regex patterns against request body

### Mock Response DSL
```
+500ms                              # Optional delay
[200]                               # Status code
headers:
  Content-Type: application/json
body:
{"message": "Hello from mock!"}
```

### Template Variables
- **Config injection** - `{{config "API_KEY"}}` for centralized secrets
- **Request data** - `{{.method}}`, `{{.path}}`, `{{.headers}}`, `{{.body}}`
- **Path params** - `{{reqPathParam 0}}` for path segments
- **Query params** - `{{reqQueryParam "filter"}}`
- **Body navigation** - `{{reqBody "user.name"}}` for nested JSON
- **Functions** - `{{uuid}}`, `{{now}}`, `{{random 1 100}}`

### Workspaces
- **Isolated environments** - Separate rules and traffic per workspace
- **Multi-tenant** - Access via `/w/{workspace}/{service}/{path}`
- **Duplicate** - Clone workspaces for testing variations
- **Enable/disable** - Temporarily disable workspaces

### Plugin System
- **JavaScript plugins** - Extend functionality with custom handlers
- **Route interception** - Handle requests before rule matching
- **Persistent storage** - Plugin-specific data storage
- **Custom UI** - React components for plugin dashboards
- **HTTP requests** - Make external API calls from plugins

### Security
- **Masked secrets** - API keys never shown in full in UI or logs
- **Centralized keys** - Store secrets once, inject everywhere
- **Traffic masking** - Backend keys automatically redacted in stored traffic

---

## Quick Start

### 1. Install & Run

```bash
# Build from source
go build -o mockingbird .
./mockingbird

# Or use Docker
docker run -p 6625:6625 -p 6626:6626 charleslobo77/mockingbird
```

### 2. Point Your Services to Mockingbird

Instead of:
```
https://api.stripe.com/v1/customers
```

Use:
```
http://localhost:6625/stripe/v1/customers
```

### 3. Watch Traffic

Open `http://localhost:6626` to see all requests in real-time. Unmatched requests show as timeouts (504).

### 4. Create Rules

Click on a traffic entry and either:
- **Proxy**: Forward to the real API with `https://api.stripe.com`
- **Mock**: Return a custom response

### 5. Add API Keys

In the Config tab, add your API keys:
```
STRIPE_API_KEY = sk_test_xxx
```

Then use in rules:
```yaml
headers:
  Authorization: "Bearer {{config \"STRIPE_API_KEY\"}}"
```

---

## Configuration

### Ports

| Port | Purpose | Environment Variable |
|------|---------|---------------------|
| 6625 | Proxy server | `MOCKINGBIRD_PROXY_PORT` |
| 6626 | Admin UI & API | `MOCKINGBIRD_ADMIN_PORT` |

### Config Directory

Default: `~/.config/mockingbird`

Override with: `MOCKINGBIRD_CONFIG_DIR`

### Directory Structure

```
~/.config/mockingbird/
  config.json                    # API keys and settings
  workspaces/
    default/
      _rules/
        stripe.yaml              # Rules for "stripe" service
        github.yaml              # Rules for "github" service
      traffic.ndjson             # Traffic history
      metadata.json              # Workspace metadata
    staging/
      _rules/
      traffic.ndjson
      metadata.json
  plugins/
    linkedin/
      plugin.js                  # Plugin code
      data.json                  # Plugin state
      ui/dist/                   # Plugin UI bundle
```

---

## Rule Matching

### Path Patterns

| Pattern | Matches | Doesn't Match |
|---------|---------|---------------|
| `/users` | `/users` | `/users/123` |
| `/users/*` | `/users/123` | `/users/123/posts` |
| `/users/**` | `/users`, `/users/123`, `/users/123/posts` | |
| `/users/{id}` | `/users/123` (extracts id=123) | `/users/123/posts` |
| `/users/{id}/posts` | `/users/123/posts` | `/users/123` |

### Rule File Format

```yaml
# _rules/stripe.yaml
rules:
  - description: "Proxy to Stripe API"
    match:
      method: ["GET", "POST"]
      path: "/v1/customers.*"
    proxyTo: "https://api.stripe.com"
    headers:
      Authorization: "Bearer {{config \"STRIPE_API_KEY\"}}"

  - description: "Mock customer creation"
    match:
      method: ["POST"]
      path: "/v1/customers"
    response: |
      +100ms
      [200]
      headers:
        Content-Type: application/json
      body:
      {"id": "cus_{{uuid}}", "created": "{{now}}"}

  - description: "Disabled rule (skipped)"
    enabled: false
    match:
      path: "/v1/old-endpoint"
    response: |
      [410]
```

### Match Options

```yaml
match:
  method: ["GET", "POST"]           # HTTP methods (optional, default: all)
  path: "/users/{id}"               # Path pattern (required)
  query:                            # Query params (optional)
    status: "active"
    type: "premium|standard"        # Regex supported
  headers:                          # Request headers (optional)
    Authorization: "Bearer.*"       # Regex supported
  body: ".*\"urgent\":true.*"       # Body regex (optional)
```

---

## Mock Response DSL

### Full Format

```
+500ms                    # Delay (optional): ms, s, m, h
[201]                     # Status code (optional, default: 200)
headers:                  # Headers section (optional)
  Content-Type: application/json
  X-Request-Id: {{uuid}}
body:                     # Body section
{
  "id": "{{uuid}}",
  "path": "{{.path}}",
  "timestamp": "{{now}}"
}
```

### Minimal Examples

```
# Just a status code
[204]

# Status with body
[200]
body:
{"ok": true}

# With delay
+2s
[200]
body:
{"message": "Slow response"}
```

---

## Template Variables

### Request Context

| Variable | Description | Example |
|----------|-------------|---------|
| `{{.method}}` | HTTP method | `GET` |
| `{{.path}}` | Request path | `/users/123` |
| `{{.headers}}` | All headers | Map |
| `{{.body}}` | Request body | JSON or string |
| `{{.query}}` | Query params | Map |

### Helper Functions

| Function | Description | Example |
|----------|-------------|---------|
| `{{config "KEY"}}` | Get config value | `{{config "API_KEY"}}` |
| `{{uuid}}` | Generate UUID | `550e8400-e29b-41d4-a716-446655440000` |
| `{{now}}` | Current timestamp | `2024-01-15T10:30:00Z` |
| `{{random 1 100}}` | Random integer | `42` |
| `{{reqHeader "Name"}}` | Get request header | `{{reqHeader "Authorization"}}` |
| `{{reqPathParam 0}}` | Path segment by index | First segment |
| `{{reqQueryParam "key"}}` | Query param value | `{{reqQueryParam "filter"}}` |
| `{{reqBody "path"}}` | Navigate JSON body | `{{reqBody "user.email"}}` |

### Body Navigation

```yaml
# Given request body: {"user": {"name": "John", "tags": ["admin", "active"]}}
response: |
  [200]
  body:
  {
    "greeting": "Hello {{reqBody \"user.name\"}}",
    "firstTag": "{{reqBody \"user.tags[0]\"}}"
  }
```

---

## Traffic Filtering

The filter bar supports multiple filter types:

| Filter | Description | Example |
|--------|-------------|---------|
| Text | Search in path, body, response | `customer` |
| Path | Filter by URL path | `/users` |
| Regex | Pattern matching | `/\d+/` |
| Negative | Exclude matches | `-error` |

Filters are AND-combined. Services can be toggled on/off independently.

---

## Plugin System

### Plugin Structure

```
plugins/
  my-plugin/
    plugin.js       # Required: plugin code
    data.json       # Auto-created: persistent storage
    ui/
      dist/
        component.js  # Optional: React UI
```

### Plugin API

```javascript
// plugin.js
exports.name = "my-plugin";
exports.version = "1.0";
exports.routes = ["/my-service/**"];
exports.config_env = "MY_PLUGIN";  // Config prefix

exports.handleRequest = function(ctx) {
  // ctx: {method, path, headers, body, query, pathParams}

  // Return null to pass to rule matcher
  if (ctx.path === "/passthrough") {
    return null;
  }

  // Return response to handle request
  return {
    status: 200,
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({handled: true})
  };
};

// Optional: Plugin UI
exports.getUI = function() {
  return {
    type: "list",
    items: plugin.getAllData().items || []
  };
};

exports.handleAction = function(action, id, data) {
  if (action === "delete") {
    // Handle delete action
  }
};
```

### Plugin Helpers

```javascript
// Persistent storage
plugin.saveData("key", value);
plugin.getData("key");
plugin.getAllData();

// Configuration (filtered by config_env prefix)
plugin.getConfig("API_KEY");  // Gets MY_PLUGIN_API_KEY
plugin.getAllConfig();

// HTTP requests
var response = plugin.httpRequest("GET", "https://api.example.com", {
  "Authorization": "Bearer xxx"
}, null);
// response: {status, headers, body, error}
```

---

## Admin API

### Traffic
- `GET /api/w/{workspace}/traffic` - List traffic
- `GET /api/w/{workspace}/traffic/{id}` - Get entry
- `GET /api/w/{workspace}/traffic/stream` - SSE stream

### Rules
- `GET /api/w/{workspace}/rules` - All rules
- `POST /api/w/{workspace}/rules/{service}` - Create rule
- `PUT /api/w/{workspace}/rules/{service}/{index}` - Update rule
- `DELETE /api/w/{workspace}/rules/{service}/{index}` - Delete rule
- `POST /api/w/{workspace}/rules/{service}/{index}/move` - Reorder

### Config
- `GET /api/w/{workspace}/config` - Get config (masked)
- `PUT /api/w/{workspace}/config/{key}` - Set value
- `DELETE /api/w/{workspace}/config/{key}` - Delete value

### Workspaces
- `GET /api/workspaces` - List workspaces
- `POST /api/workspaces` - Create workspace
- `POST /api/workspaces/{name}/duplicate` - Duplicate
- `DELETE /api/workspaces/{name}` - Disable

---

## Tips

1. **First-match-wins**: Rules are evaluated top-to-bottom. Put specific rules before general ones.

2. **Hot-reload**: Edit YAML files directly — changes apply immediately.

3. **Debug with SSE**: Watch live traffic from terminal:
   ```bash
   curl -N http://localhost:6626/api/w/default/traffic/stream
   ```

4. **Docker networking**: Set `LOCALHOST_CONTAINER_URL` to replace localhost URLs when running in containers.

5. **Workspace isolation**: Use workspaces to test different configurations without affecting production rules.

6. **Clear view**: Click "Clear" to hide old traffic and focus on new requests (data is preserved).

---

## Contributing

Mockingbird is open to community contributions! Help shape a tool that makes API development faster and more fun.

- Fork the repo
- Submit a PR or feature suggestion

---

## TL;DR

> **Mockingbird** = WireMock + Postman Mock Server + Local Reverse Proxy,
> wrapped in one lightweight, fast, Go service with a beautiful dashboard.

Build once. Mock forever. 🐦
