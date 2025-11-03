# 🐦 Mockingbird

> **Fast, modern, lightweight API gateway for development and testing.**

Mockingbird is a **centralized API gateway** that lets you route all external service calls through one endpoint, giving you complete control to **mock, proxy, inspect, and debug** your API traffic in real-time.

Route all your microservices' external API calls through Mockingbird:
- `https://api.servicex.com` → `http://localhost:8769/servicex`
- `https://api.openai.com` → `http://localhost:8769/openai`

Manage API keys centrally, mock selectively, and see every request in real-time.

---

## 🚀 Why Mockingbird?

| Problem                                            | Mockingbird's Solution                                                    |
| -------------------------------------------------- | ------------------------------------------------------------------------- |
| External APIs scattered across services?           | Single gateway for all external calls - one place to manage everything.   |
| API keys hardcoded everywhere?                     | Centralized config - inject keys via templates, never expose in code.     |
| Need to work offline or mock flaky services?       | Selectively mock endpoints while proxying everything else.                |
| Want to see what APIs your app is calling?         | Real-time traffic dashboard with full request/response inspection.        |
| Need flexible matching and responses?              | Simple `.mock` format with templates - no complex YAML or code.           |
| Deploy anywhere?                                   | Single binary or Docker container — no external DB needed.                |

---

## 🧩 Features

### ⚙️ Smart Request Matching

* Match by method, path (`/users/{id}` or wildcards `**`), headers, query params, or JSON body fragments
* Inspect all requests/responses in a beautiful live dashboard
* Easily switch from real API responses to identical mocking responses


### 🗂️ Easy to Use!

Write your responses in a simple format — easy to read, version, and share.

```text
+30s
[200]
headers:
  Content-Type: application/json
body
{
  "user": "{{ reqHeader `X-User` }}",
  "time": "{{ now }}",
  "token": "{{ config `api_key` }}"
}
```

* Templates support dynamic helpers: `{{now}}`, `{{uuid}}`, `{{random 1 100}}`
* Access request headers, params, and JSON body fields
* Reference central config values (like API keys) for better security, control, and privacy

### 🔄 Path-Based Routing

* Route requests by path: `/servicex/**` → ServiceX, `/openai/**` → OpenAI
* Unmatched requests timeout (504) - immediately know when new APIs are called
* Selectively proxy to real services or return mocked responses

### 🧠 REST API & Live Monitoring

* RESTful Admin API for all operations (curl-friendly)
* Real-time traffic stream via Server-Sent Events
* Create/edit/delete rules programmatically
* Manage config values securely

### 🐳 Docker-First Deployment

---

---

## 🤝 Contributing

Mockingbird is open to community contributions!
Help shape a tool that makes API development faster and more fun.

* Fork the repo
* Submit a PR or feature suggestion

---

## 🪶 TL;DR

> **Mockingbird** = WireMock + Postman Mock Server + Local Reverse Proxy,
> wrapped in one lightweight, fast, Go service with a beautiful dashboard.

Build once. Mock forever. 🐦

# 🐦 Architecture

```
                 +----------------+
                 |   Clients      |
                 +----------------+
                       |
                       |  (HTTP requests to proxy)
                       v
                +----------------------+
                |   Proxy Server (Go)  |  <-- main runtime
                |  - Matcher / Router  |
                |  - DSL Renderer      |
                |  - Reverse Proxy     |
                |  - Admin API & SSE   |  (on admin port)
                +----------------------+
                     |           |
             (forward to)    (admin/dashboard)
                     |           v
            +----------------+  +-------------------+
            | Upstream APIs  |  | Dashboard (React) |
            +----------------+  +-------------------+
```

## 🧱 Project Structure

```
mockingbird/
├── cmd/server/           # Entry point for the Go service
├── internal/
│   ├── config/           # Configuration management
│   ├── models/           # Data structures (Rule, TrafficEntry, etc.)
│   ├── proxy/            # Main proxy HTTP handler
│   ├── matcher/          # Request matching logic
│   ├── dsl/              # .mock template parser
│   ├── render/           # Templating engine
│   ├── admin/            # Admin REST API & SSE
│   └── store/            # Rule storage + traffic history
├── examples/             # Example config and rule files
├── Dockerfile
├── docker-compose.yml
├── USER_STORIES.md       # Feature documentation
├── IMPLEMENTATION_PLAN.md # Technical plan
└── API_DOCUMENTATION.md  # REST API reference
```

**Default config location**: `~/.config/mockingbird/` (override with `MOCKINGBIRD_CONFIG_DIR`)

---

## 💡 Example Use Cases

* **Frontend development** — Build and test against realistic APIs without waiting on backend availability.
* **Integration testing** — Simulate third-party APIs or flaky services deterministically.
* **Traffic debugging** — Capture live requests and replay them safely.
* **API sandboxing** — Give customers a safe mock API environment.

---

## 🧩 DSL Overview

| Directive       | Description                                                       |
| --------------- | ----------------------------------------------------------------- |
| `+30s`          | Delay response by 30 seconds                                      |
| `[201]`         | Set response status                                               |
| `headers:`      | Response headers (YAML-style)                                     |
| `body`          | Response body (template string, auto-parsed as JSON if possible)  |
| Template syntax | Go's `text/template` with helper functions                        |

**Note**: Request bodies are automatically parsed as JSON when valid, otherwise treated as plain text. Response bodies are always templates.

---

## 🧠 Example Rule (YAML)

```yaml
# servicex.yaml
rules:
  # Proxy all requests to real API with injected auth
  - match:
      method: [GET, POST]
      path: /servicex/**
    proxyto: https://api.servicex.com
    headers:
      X-API-Key: "{{ config SERVICEX_API_KEY }}"

  # Mock specific endpoint when body contains "charles"
  - match:
      method: [POST]
      path: /servicex/users/**
      body:
        matches: ".*charles.*"
    response: |
      +200ms
      [201]
      headers:
        Content-Type: application/json
      body
      {
        "id": "{{ uuid }}",
        "user": "{{ reqPathParam 2 }}",
        "filter": "{{ reqQueryParam filter }}",
        "total": "{{ reqBody data.summary[0].total }}",
        "confirmationCode": "ORD-{{ random 100000 999999 }}",
        "submitted_by": "{{ reqHeader "x-user-id" }}"
      }
```

| Section         | Purpose                     | Notes                                                  |
| --------------- | --------------------------- | ------------------------------------------------------ |
| `+30s`          | Simulate latency            | Optional; `+500ms`, `+2s`, `+1m`                       |
| `[200]`         | Status code                 | Optional; defaults to 200                              |
| `headers:`      | Static or templated headers | Supports templating                                    |
| `body`          | Response body template      | Supports templating, auto-formatted if valid JSON      |
| Template syntax | `{{ ... }}`                 | Simple interpolation; references request, config, etc. |


| Variable          | Description             |
| ----------------- | ----------------------- |
| `reqPathParam`    | Path params             |
| `reqQueryParam`   | Query parameters        |
| `reqHeader`       | Headers                 |
| `reqBody`         | Parsed JSON body        |
| `config`          | Values from config file |
| `now`             | Current timestamp       |
| `uuid`            | Generates a UUID        |
| `random from to`  | Generates random number |

