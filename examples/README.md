# Mockingbird Examples

This directory contains example configuration and rule files to help you get started with Mockingbird.

## Quick Start

1. **Copy examples to your config directory:**

```bash
mkdir -p ~/.config/mockingbird
cp examples/* ~/.config/mockingbird/
```

2. **Start Mockingbird:**

```bash
go run cmd/server/main.go
```

3. **Test the proxy:**

```bash
# This will return a 504 timeout (no rule for "test" service)
curl http://localhost:8769/test/endpoint

# This will proxy to ServiceX with injected API key
curl http://localhost:8769/servicex/users

# This will return a mocked response (contains "charles")
curl -X POST http://localhost:8769/servicex/users/new \
  -H "Content-Type: application/json" \
  -d '{"username": "charles", "email": "charles@example.com"}'

# This will return a mocked OpenAI response
curl -X POST http://localhost:8769/openai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4", "messages": [{"role": "user", "content": "Hello"}]}'
```

## File Descriptions

### config.json
Contains application configuration and API keys. Values are referenced in templates using `{{ config KEY_NAME }}`.

**Important:** Update the API keys with your actual keys if you plan to proxy to real services.

### servicex.yaml
Example rules for a fictional "ServiceX" API demonstrating:
- Proxying GET requests to real API
- Mocking POST requests based on body content
- Simulating error responses
- Using template variables

### openai.yaml
Example rules for OpenAI API demonstrating:
- Mocking chat completions for development
- Proxying other endpoints to real API
- Header injection with authentication

## Creating Your Own Rules

1. **Create a new YAML file** named after your service (e.g., `stripe.yaml`)

2. **Define rules** following this structure:

```yaml
rules:
  - match:
      method: [GET, POST]  # Optional: methods to match
      path: /stripe/**     # Required: path pattern
      headers:             # Optional: header matching
        X-Custom: value
      body:                # Optional: body regex matching
        matches: ".*pattern.*"

    # Option 1: Proxy to real API
    proxyto: https://api.stripe.com
    headers:
      Authorization: "Bearer {{ config STRIPE_API_KEY }}"

    # Option 2: Return mocked response
    response: |
      [200]
      headers:
        Content-Type: application/json
      body
      {
        "id": "{{ uuid }}",
        "amount": "{{ reqBody amount }}",
        "timestamp": "{{ now }}"
      }
```

3. **Use in your application:**

```bash
# Instead of https://api.stripe.com/v1/charges
curl http://localhost:8769/stripe/v1/charges
```

## Template Variables

Use these in `response` bodies and `headers`:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{ uuid }}` | Generate UUID | `"id": "{{ uuid }}"` |
| `{{ now }}` | Current timestamp | `"timestamp": "{{ now }}"` |
| `{{ random 1 100 }}` | Random number | `"code": {{ random 1000 9999 }}` |
| `{{ reqHeader `X-User` }}` | Request header | `"user": "{{ reqHeader `X-User-ID` }}"` |
| `{{ reqPathParam 2 }}` | Path segment | `"service": "{{ reqPathParam 0 }}"` |
| `{{ reqQueryParam `id` }}` | Query parameter | `"filter": "{{ reqQueryParam `filter` }}"` |
| `{{ reqBody `user.name` }}` | JSON body field | `"name": "{{ reqBody `user.name` }}"` |
| `{{ config `API_KEY` }}` | Config value | `"key": "{{ config `STRIPE_API_KEY` }}"` |

**Note**: Template function arguments use backticks (`` ` ``) to avoid YAML escaping issues.

## Managing Rules via API

You can also create/edit rules via the REST API:

```bash
# Create a new rule
curl -X POST http://localhost:9090/api/rules/myservice \
  -H "Content-Type: application/json" \
  -d '{
    "match": {"method": ["GET"], "path": "/myservice/**"},
    "proxyto": "https://api.myservice.com",
    "headers": {"X-API-Key": "{{ config MYSERVICE_KEY }}"}
  }'

# List all rules
curl http://localhost:9090/api/rules

# Watch live traffic
curl -N http://localhost:9090/api/traffic/stream
```

See [API_DOCUMENTATION.md](../API_DOCUMENTATION.md) for complete API reference.

## Tips

1. **First-match-wins:** Rules are evaluated top-to-bottom. Put more specific rules before general ones.

2. **Hot-reload:** Mockingbird watches for file changes. Edit a rule file and it will be reloaded automatically.

3. **Debugging:** Watch live traffic to see what your app is calling:
   ```bash
   curl -N http://localhost:9090/api/traffic/stream
   ```

4. **Path patterns:**
   - `/service/**` - matches `/service/anything/nested`
   - `/service/*` - matches `/service/one-level`
   - `/service/{id}` - matches `/service/123` and extracts `id`

5. **Testing locally:** Point your microservices to `http://localhost:8769` instead of real APIs during development.
