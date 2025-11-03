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
│   ├── proxy/            # Reverse proxy logic
│   ├── matcher/          # Request matchers
│   ├── dsl/              # .mock template parser
│   ├── render/           # Templating engine
│   ├── admin/            # Admin API & dashboard backend
│   └── store/            # Rule + request state store
├── templates/            # Mock templates (.mock files)
├── configs/              # Config (api keys, upstream URL)
├── webui/                # React dashboard app
├── Dockerfile
└── docker-compose.yml
```

---

## 💡 Example Use Cases

* **Frontend development** — Build and test against realistic APIs without waiting on backend availability.
* **Integration testing** — Simulate third-party APIs or flaky services deterministically.
* **Traffic debugging** — Capture live requests and replay them safely.
* **API sandboxing** — Give customers a safe mock API environment.

---

## 🧩 DSL Overview

| Directive                  | Description                                |
| -------------------------- | ------------------------------------------ |
| `+30s`                     | Delay response by 30 seconds               |
| `[201]`                    | Set response status                        |
| `headers:`                 | Response headers (YAML-style)              |
| `body:json` or `body:text` | Response body and format                   |
| Template syntax            | Go’s `text/template` with helper functions |

---

## 🧠 Example Rule (YAML)

```yaml
method: [GET]
path: /api/v1/users/{id}
body:
  contains:
    role: admin
template: >
  # delay the response by 30 seconds
  +30s

  # HTTP status code
  [201]

  # allow comments
  header:
    Content-Type: application/json
    X-API-Key: "{{ config serviceApiKey }}"

  body:json
  {
    "id": "{{ uuid }}",
    "user": "{{ reqPathParam id }}",
    "generate": "{{ reqQueryParam generate }}",
    "total": "{{ reqBody data.summary[0].total }}",
    "confirmationCode": "ORD-{{ random 100000 999999 }}",
    "numResults": "{{ reqHeader "x-limit-rows" }}"
  }
```

| Section         | Purpose                     | Notes                                                  |
| --------------- | --------------------------- | ------------------------------------------------------ |
| `+30s`          | Simulate latency            | Optional; `+500ms`, `+2s`, `+1m`                       |
| `[200]`         | Status code                 | Optional; defaults to 200                              |
| `header:`       | Static or templated headers | Supports templating                                    |
| `body:json`     | Response body               | Supports templating                                    |
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

