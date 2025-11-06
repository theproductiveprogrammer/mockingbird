# 🐦 Mockingbird - User Stories

## Core User Stories

### US-1: Central API Gateway
**As a** developer working with multiple microservices
**I want** all external API calls to route through a single Mockingbird instance
**So that** I can control, monitor, and mock all external dependencies from one place

**Acceptance Criteria:**
- Developers configure their apps to call `http://localhost:6625/servicex` instead of `https://api.servicex.com`
- Mockingbird routes requests based on path prefix (`/servicex` → servicex, `/openai` → openai)
- API keys are stored centrally in Mockingbird config, not in individual services

---

### US-2: Default Timeout Behavior
**As a** developer
**I want** unmocked requests to timeout by default
**So that** I'm immediately aware when my code tries to call an external service I haven't configured

**Acceptance Criteria:**
- Requests with no matching rule return 504 Gateway Timeout
- The timeout request appears in the traffic dashboard
- I can see the full request details (method, path, headers, body)

---

### US-3: View Live API Traffic
**As a** developer
**I want** to see all API requests and responses in real-time
**So that** I can debug issues and understand what my services are calling

**Acceptance Criteria:**
- Traffic dashboard shows requests as they come in (via SSE stream)
- Each entry shows: method, path, query params, headers, request body, response status, response body
- Traffic is displayed in the `.mock` format for easy reading
- Last 100 requests per service are retained in memory

---

### US-4: Create Proxy Rules
**As a** developer
**I want** to create rules that forward requests to real APIs with injected headers
**So that** I can manage API keys centrally and test against live services

**Acceptance Criteria:**
- I can create a rule with `proxyto: https://api.servicex.com/api/do`
- I can inject headers like `X-API-Key: {{ config SERVICEX_API_KEY }}`
- The proxied response is captured and displayed in the dashboard
- All original headers and body are forwarded unless overridden

---

### US-5: Create Mock Response Rules
**As a** developer
**I want** to create rules that return mocked responses
**So that** I can test without hitting real APIs and simulate various scenarios

**Acceptance Criteria:**
- I can define a response using the `.mock` format (delay, status, headers, body)
- Response body supports templates: `{{ uuid }}`, `{{ now }}`, `{{ reqHeader "X-User" }}`
- I can access request data: path params, query params, headers, JSON body fields
- I can reference config values: `{{ config API_KEY }}`

---

### US-6: Match Requests Precisely
**As a** developer
**I want** to match requests based on method, path, headers, and body content
**So that** I can return different responses for different scenarios

**Acceptance Criteria:**
- Rules support matching by: method (array), path (with wildcards `**`), headers, body regex
- Path matching supports wildcards: `/servicex/**` matches all servicex paths
- Body matching uses regex: `matches: ".*user.*charles"`
- First matching rule wins (top-to-bottom evaluation)

---

### US-7: Manage Rules via Files
**As a** developer
**I want** rules stored in YAML files (one per service)
**So that** I can version control them and share with my team

**Acceptance Criteria:**
- Rules stored in `~/.config/mockingbird/servicex.yaml`, `openai.yaml`, etc.
- Files use YAML structure with embedded `.mock` format for responses
- Changes to rule files are hot-reloaded automatically
- Config directory can be overridden via environment variable

---

### US-8: Create Rules from Live Traffic
**As a** developer
**I want** to generate rule templates from requests I see in the dashboard
**So that** I can quickly mock endpoints based on real traffic

**Acceptance Criteria:**
- I can call an API endpoint with a traffic entry ID
- The API returns a YAML rule template pre-filled with the request details
- I can edit and save this template to create the rule

---

### US-9: Edit Rules via API
**As a** developer
**I want** to edit rules via REST API
**So that** I can manage rules programmatically or via curl

**Acceptance Criteria:**
- I can list all rules: `GET /api/rules`
- I can get rules for a service: `GET /api/rules/servicex`
- I can update a specific rule: `PUT /api/rules/servicex/0`
- I can delete a rule: `DELETE /api/rules/servicex/0`
- Changes are persisted to the YAML file

---

### US-10: Manage Config via API
**As a** developer
**I want** to manage config values (API keys) via REST API
**So that** I can update them without editing files

**Acceptance Criteria:**
- I can list config keys (values are hidden for security): `GET /api/config`
- I can update a config value: `PUT /api/config/SERVICEX_API_KEY`
- Changes are persisted to `config.json`

---

### US-11: Simple Body Handling
**As a** developer
**I want** body content to be automatically parsed as JSON when possible
**So that** I don't need to specify formats explicitly

**Acceptance Criteria:**
- Request bodies are parsed as JSON if valid, otherwise stored as plain text
- I can access JSON fields in templates: `{{ reqBody user.name }}`
- Response bodies use just `body` (not `body:json`) and are treated as templates
- Invalid JSON in requests doesn't cause errors

---

### US-12: Docker Deployment
**As a** DevOps engineer
**I want** to deploy Mockingbird via Docker
**So that** I can run it consistently across environments

**Acceptance Criteria:**
- Single Dockerfile builds a minimal image
- Config and rules directories can be mounted as volumes
- docker-compose.yml provides easy local setup
- Environment variables override config file settings

---

## Future Enhancements (Not in MVP)

- **Web Dashboard**: React UI for visual management (currently API-only)
- **Request Recording**: Save/replay traffic for test fixtures
- **Response Randomization**: Randomly select from multiple response templates
- **Latency Simulation**: Add jitter to delays
- **Request Validation**: Validate requests against OpenAPI schemas
