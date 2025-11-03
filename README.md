# 🐦 Mockingbird

> **Fast, modern, lightweight API proxy and mock server.**

Mockingbird is a modern API mocking and proxy tool that lets you **simulate, inspect, and shape your API traffic in real-time**.

Whether you’re mocking endpoints for frontend work, recording live traffic for testing, or debugging integrations, Mockingbird makes it effortless — with **simple text-driven templates**, **live request dashboards**, and **Docker-ready deployment**.

---

## 🚀 Why Mockingbird?

| Problem                                            | Mockingbird’s Take                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------------ |
| Tired of clunky mock servers or YAML DSLs?         | Use clean, human-readable `.mock` files that look like natural text.     |
| Need to match by URL, headers, or request body?    | Flexible matchers that support regex, wildcards, and JSON body contains. |
| Want to proxy to live APIs *and* mock selectively? | Built-in HTTP reverse proxy with per-route overrides.                    |
| Need a dashboard to see what’s happening?          | React-powered Admin UI with real-time traffic stream and config editing. |
| Deploy anywhere?                                   | Single binary or Docker container — no external DB needed.               |

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
body:json
{
  "user": "{{ reqHeader "X-User" }}",
  "time": "{{ now }}",
  "token": "{{ config "api_key" }}"
}
```

* Templates support dynamic helpers: `{{now}}`, `{{uuid}}`, `{{random 1 100}}`
* Access request headers, params, and JSON body fields
* Reference central config values (like API keys) for better security, control, and privacy

### 🔄 Transparent Reverse Proxy

* Unmatched requests automatically forward to the real upstream service
* See live traffic to generate corresponding mock templates

### 🧠 Dashboard

* Manage rules and templates from the browser
* Watch live incoming requests

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

