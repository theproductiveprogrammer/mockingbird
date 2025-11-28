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

## Tips

1. **First-match-wins**: Rules are evaluated top-to-bottom. Put specific rules before general ones.

2. **Hot-reload**: You can edit YAML files directly — changes apply immediately.

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
