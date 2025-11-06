# 🐦 Mockingbird

> **Fast, modern, lightweight API gateway for development and testing.**

Mockingbird is a **centralized API gateway** that routes all external service calls through one endpoint, giving you complete control to **mock, proxy, inspect, and debug** your API traffic in real-time.

Stop hardcoding API keys, stop hitting live APIs during development, and get full visibility into every external call your services make — all from one simple, fast Go service.

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

## 🚀 Quick Start

**1. Tell your services to use Mockingbird:**

Instead of:
  * `https://api.servicex.com`
  use
  * `http://localhost:6625/servicex`

You will immediately see all the requests your system is making on the mocking bird dashboard. Because they are not configured, they will all show as 'failed'.

**2. Click and proxy:**

For all existing services, simply click on a failed traffic line and add the url of the actual service to proxy to:

Click and add: `https://api.servicex.com`

**3. Mock & Intercept:**

For new services simply create new rules and mock the response. For existing traffic, click and create a rule and it will intercept and respond with the mocked response!

**4. Watch live traffic:**

See the requests and responses in real-time, beautifully formatted and JSON-compatible on the dashboard.

**5. Keep API Keys centralized:**

Add API keys in a the mockingbird centralized config and have the proxy insert them in-flight. API keys are now forever safe from being logged and need not be shared with the services.

All backend keys are automatically masked in the recorded API requests and dashboard displays.

---

## 🧩 Tips

1. **First-match-wins:** Rules are evaluated top-to-bottom. Put more specific rules before general ones.

2. **Hot-reload:** Mockingbird watches for file changes. If you do not use the UI, you can edit rule files manually and they will be reloaded automatically.

3. **Debugging:** Watch live traffic to see what your app is calling:

    ```bash
    curl -N http://localhost:6626/api/traffic/stream
    ```

4. **Path patterns:**
    - `/service/**` - matches `/service/anything/nested`
    - `/service/*` - matches `/service/one-level`
    - `/service/{id}` - matches `/service/123` and extracts `id`


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
