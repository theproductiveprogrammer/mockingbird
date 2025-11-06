# 🐦 Architecture

## System Overview

```
         +------------------+    +------------------+    +------------------+
         |  Microservice A  |    |  Microservice B  |    |  Developer Tool  |
         +------------------+    +------------------+    +------------------+
                |                         |                       |
                | /servicex/users         | /openai/chat         | /stripe/payments
                +-------------------------+-----------------------+
                                          |
                         http://localhost:6625 (Proxy Server)
                                          |
                         +----------------v-----------------+
                         |       MOCKINGBIRD PROXY          |
                         |                                  |
                         |  1. Extract service from path    |
                         |  2. Match against rules          |
                         |  3. Proxy OR Mock OR Timeout     |
                         |  4. Record traffic               |
                         |  5. Publish to SSE stream        |
                         +----------------+-----------------+
                                /         |         \
                               /          |          \
                      (matched)      (no match)   (admin:6626)
                         /              |              \
                        v               v               v
            +------------------+   +---------+   +---------------+
            |  External APIs   |   |   504   |   |   REST API    |
            |                  |   | Timeout |   |   + SSE       |
            | api.servicex.com |   +---------+   +---------------+
            | api.openai.com   |
            | api.stripe.com   |
            +------------------+
```

## Request Flow

### Path-Based Service Routing

```
Request: GET http://localhost:6625/servicex/users/123?filter=active
                                      ^^^^^^^
                                      service name

1. Extract "servicex" from path
2. Load rules from ~/.config/mockingbird/servicex.yaml
3. Match request against rules (first-match-wins)
```

### Matching Decision Tree

```
For each rule in servicex.yaml (top to bottom):
  ├─ Does method match? (if specified)
  │   └─ NO → Try next rule
  ├─ Does path match? (exact or wildcard)
  │   └─ NO → Try next rule
  ├─ Do headers match? (if specified)
  │   └─ NO → Try next rule
  ├─ Does body match regex? (if specified)
  │   └─ NO → Try next rule
  └─ YES → MATCHED!
      ├─ Rule has "proxyto"?
      │   └─ Forward to upstream with header injection
      └─ Rule has "response"?
          └─ Parse .mock template and render

No match found?
  └─ Return 504 Gateway Timeout
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

- **Frontend development** — Build and test against realistic APIs without waiting on backend availability.
- **Integration testing** — Simulate third-party APIs or flaky services deterministically.
- **Traffic debugging** — Capture live requests and replay them safely.
- **API sandboxing** — Give customers a safe mock API environment.

---

## 🧩 DSL Overview

| Directive                  | Description                                |
| -------------------------- | ------------------------------------------ |
| `+30s`                     | Delay response by 30 seconds               |
| `[201]`                    | Set response status                        |
| `headers:`                 | Response headers (YAML-style)              |
| `body:`                    | Response body                              |
| Template syntax            | Go's `text/template` with helper functions |

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
      X-API-Key: "{{ config `serviceApiKey` }}"

    body:
    {
      "id": "{{ uuid }}",
      "user": "{{ reqPathParam 1 }}",
      "generate": "{{ reqQueryParam `generate` }}",
      "total": "{{ reqBody `data.summary[0].total` }}",
      "confirmationCode": "ORD-{{ random 100000 999999 }}",
      "numResults": "{{ reqHeader `x-limit-rows` }}"
    }
```

| Section         | Purpose                     | Notes                                                  |
| --------------- | --------------------------- | ------------------------------------------------------ |
| `+30s`          | Simulate latency            | Optional; `+500ms`, `+2s`, `+1m`                       |
| `[200]`         | Status code                 | Optional; defaults to 200                              |
| `header:`       | Static or templated headers | Supports templating                                    |
| `body:`         | Response body               | Supports templating                                    |
| Template syntax | `{{ ... }}`                 | Simple interpolation; references request, config, etc. |

| Variable         | Description             |
| ---------------- | ----------------------- |
| `reqPathParam`   | Path params             |
| `reqQueryParam`  | Query parameters        |
| `reqHeader`      | Headers                 |
| `reqBody`        | Parsed JSON body        |
| `config`         | Values from config file |
| `now`            | Current timestamp       |
| `uuid`           | Generates a UUID        |
| `random from to` | Generates random number |
