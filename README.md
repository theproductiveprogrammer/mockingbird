# 🐦 Mockingbird

> **Fast, modern, lightweight API gateway for development and testing.**

Mockingbird is a **centralized API gateway** that routes all external service calls through one endpoint, giving you complete control to **mock, proxy, inspect, and debug** your API traffic in real-time.

Stop hardcoding API keys, stop hitting live APIs during development, and get full visibility into every external call your services make — all from one simple, fast Go service.

---

## 🚀 Quick Start

**1. Configure your services to use Mockingbird:**

Instead of calling external APIs directly, route through Mockingbird:

```bash
# Before
curl https://api.servicex.com/users

# After
curl http://localhost:8769/servicex/users
```

**2. Start Mockingbird:**

```bash
mockingbird
# Proxy: http://localhost:8769
# Admin API: http://localhost:8768
```

**3. Create rules via API:**

```bash
# Proxy to real API with injected auth
curl -X POST http://localhost:8768/api/rules/servicex \
  -H "Content-Type: application/json" \
  -d '{
    "match": {"method": ["GET"], "path": "/servicex/**"},
    "proxyto": "https://api.servicex.com",
    "headers": {"X-API-Key": "{{ config SERVICEX_API_KEY }}"}
  }'
```

**4. Watch live traffic:**

```bash
curl -N http://localhost:8768/api/traffic/stream
```

---

## 🧩 Features

### ⚙️ Smart Request Matching

- Match by method, path (`/users/{id}` or wildcards `**`), headers, query params, or JSON body fragments
- Inspect all requests/responses in a beautiful live dashboard
- Easily switch from real API responses to identical mocking responses

### 🗂️ Easy to Use!

Write your responses in a simple format — easy to read, version, and share.

```text
+30s
[200]
headers:
  Content-Type: application/json
body:
{
  "user": "{{ reqHeader "X-User" }}",
  "time": "{{ now }}",
  "token": "{{ config "api_key" }}"
}
```

- Templates support dynamic helpers: `{{now}}`, `{{uuid}}`, `{{random 1 100}}`
- Access request headers, params, and JSON body fields
- Reference central config values (like API keys) for better security, control, and privacy

### 🔄 Transparent Reverse Proxy

- Unmatched requests automatically forward to the real upstream service
- See live traffic to generate corresponding mock templates

### 🧠 Dashboard

- Manage rules and templates from the browser
- Watch live incoming requests

### 🐳 Docker-First Deployment

---

---

## 🤝 Contributing

Mockingbird is open to community contributions!
Help shape a tool that makes API development faster and more fun.

- Fork the repo
- Submit a PR or feature suggestion

---

## 🪶 TL;DR

> **Mockingbird** = WireMock + Postman Mock Server + Local Reverse Proxy,
> wrapped in one lightweight, fast, Go service with a beautiful dashboard.

Build once. Mock forever. 🐦
