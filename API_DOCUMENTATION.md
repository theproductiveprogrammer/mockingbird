# 🐦 Mockingbird - REST API Documentation

Base URL: `http://localhost:9090` (Admin API)

All endpoints return JSON unless otherwise specified.

---

## Traffic Management

### Get Traffic History

Get the last N traffic entries.

**Endpoint**: `GET /api/traffic`

**Query Parameters**:
- `limit` (optional): Number of entries to return (default: 100, max: 1000)
- `service` (optional): Filter by service name (e.g., "servicex")

**Example**:
```bash
# Get last 50 traffic entries
curl http://localhost:9090/api/traffic?limit=50

# Get traffic for servicex only
curl http://localhost:9090/api/traffic?service=servicex
```

**Response**:
```json
{
  "entries": [
    {
      "id": "req-123e4567-e89b-12d3-a456-426614174000",
      "timestamp": "2025-11-04T10:30:45Z",
      "service": "servicex",
      "method": "POST",
      "path": "/servicex/users",
      "query": {
        "filter": ["active"]
      },
      "headers": {
        "content-type": ["application/json"],
        "x-user": ["charles"]
      },
      "body": {
        "name": "Charles",
        "role": "admin"
      },
      "response": {
        "status_code": 200,
        "headers": {
          "content-type": "application/json"
        },
        "body": "{\"id\":\"123\",\"name\":\"Charles\"}",
        "delay_ms": 200
      },
      "matched_rule": 0,
      "rule_type": "mock"
    }
  ],
  "total": 1
}
```

---

### Stream Live Traffic (SSE)

Get real-time traffic updates using Server-Sent Events.

**Endpoint**: `GET /api/traffic/stream`

**Example**:
```bash
curl -N http://localhost:9090/api/traffic/stream
```

**Response** (SSE format):
```
data: {"id":"req-...","timestamp":"...","method":"POST","path":"/servicex/users",...}

data: {"id":"req-...","timestamp":"...","method":"GET","path":"/openai/chat",...}
```

**Usage in Code**:
```javascript
const eventSource = new EventSource('http://localhost:9090/api/traffic/stream');
eventSource.onmessage = (event) => {
  const traffic = JSON.parse(event.data);
  console.log('New request:', traffic);
};
```

---

### Get Traffic Entry Details

Get full details for a specific traffic entry.

**Endpoint**: `GET /api/traffic/:id`

**Example**:
```bash
curl http://localhost:9090/api/traffic/req-123e4567-e89b-12d3-a456-426614174000
```

**Response**:
```json
{
  "id": "req-123e4567-e89b-12d3-a456-426614174000",
  "timestamp": "2025-11-04T10:30:45Z",
  "service": "servicex",
  "method": "POST",
  "path": "/servicex/users",
  "query": {"filter": ["active"]},
  "headers": {"content-type": ["application/json"]},
  "body": {"name": "Charles"},
  "response": {...}
}
```

---

### Generate Rule from Traffic

Generate a rule template from a traffic entry.

**Endpoint**: `POST /api/traffic/:id/generate-rule`

**Example**:
```bash
curl -X POST http://localhost:9090/api/traffic/req-123e4567.../generate-rule
```

**Response**:
```json
{
  "service": "servicex",
  "rule_yaml": "match:\n  method: [POST]\n  path: /servicex/users\nresponse: |\n  [200]\n  headers:\n    Content-Type: application/json\n  body\n  {\n    \"id\": \"{{ uuid }}\",\n    \"name\": \"{{ reqBody name }}\"\n  }\n"
}
```

---

## Rules Management

### List All Rules

Get all rules grouped by service.

**Endpoint**: `GET /api/rules`

**Example**:
```bash
curl http://localhost:9090/api/rules
```

**Response**:
```json
{
  "services": {
    "servicex": {
      "file": "/Users/user/.config/mockingbird/servicex.yaml",
      "rules": [
        {
          "index": 0,
          "match": {
            "method": ["GET", "POST"],
            "path": "/servicex/**"
          },
          "proxyto": "https://api.servicex.com/api/do",
          "headers": {
            "X-API-Key": "{{ config SERVICEX_API_KEY }}"
          }
        },
        {
          "index": 1,
          "match": {
            "method": ["POST"],
            "path": "/servicex/users/**",
            "body": {
              "matches": ".*charles.*"
            }
          },
          "response": "+200ms\n[200]\nheaders:\n  Content-Type: application/json\nbody\n{\n  \"id\": \"{{ uuid }}\"\n}\n"
        }
      ]
    },
    "openai": {
      "file": "/Users/user/.config/mockingbird/openai.yaml",
      "rules": [...]
    }
  }
}
```

---

### Get Rules for Service

Get all rules for a specific service.

**Endpoint**: `GET /api/rules/:service`

**Example**:
```bash
curl http://localhost:9090/api/rules/servicex
```

**Response**:
```json
{
  "service": "servicex",
  "file": "/Users/user/.config/mockingbird/servicex.yaml",
  "rules": [
    {
      "index": 0,
      "match": {
        "method": ["GET", "POST"],
        "path": "/servicex/**"
      },
      "proxyto": "https://api.servicex.com/api/do",
      "headers": {
        "X-API-Key": "{{ config SERVICEX_API_KEY }}"
      }
    }
  ]
}
```

---

### Create New Rule

Add a new rule to a service.

**Endpoint**: `POST /api/rules/:service`

**Request Body**:
```json
{
  "match": {
    "method": ["POST"],
    "path": "/servicex/orders"
  },
  "response": "[201]\nheaders:\n  Content-Type: application/json\nbody\n{\n  \"order_id\": \"{{ uuid }}\"\n}\n"
}
```

**Example**:
```bash
curl -X POST http://localhost:9090/api/rules/servicex \
  -H "Content-Type: application/json" \
  -d '{
    "match": {
      "method": ["POST"],
      "path": "/servicex/orders"
    },
    "response": "[201]\nbody\n{\"order_id\":\"{{ uuid }}\"}\n"
  }'
```

**Response**:
```json
{
  "success": true,
  "service": "servicex",
  "index": 2,
  "message": "Rule created successfully"
}
```

---

### Update Existing Rule

Update a rule at a specific index.

**Endpoint**: `PUT /api/rules/:service/:index`

**Request Body**:
```json
{
  "match": {
    "method": ["POST", "PUT"],
    "path": "/servicex/orders/**"
  },
  "response": "[200]\nbody\n{\"updated\": true}\n"
}
```

**Example**:
```bash
curl -X PUT http://localhost:9090/api/rules/servicex/1 \
  -H "Content-Type: application/json" \
  -d '{
    "match": {
      "method": ["POST", "PUT"],
      "path": "/servicex/orders/**"
    },
    "response": "[200]\nbody\n{\"updated\": true}\n"
  }'
```

**Response**:
```json
{
  "success": true,
  "service": "servicex",
  "index": 1,
  "message": "Rule updated successfully"
}
```

---

### Delete Rule

Delete a rule at a specific index.

**Endpoint**: `DELETE /api/rules/:service/:index`

**Example**:
```bash
curl -X DELETE http://localhost:9090/api/rules/servicex/1
```

**Response**:
```json
{
  "success": true,
  "service": "servicex",
  "index": 1,
  "message": "Rule deleted successfully"
}
```

---

### Get Raw Rule File

Download the raw YAML file for a service.

**Endpoint**: `GET /api/rules/:service/raw`

**Example**:
```bash
curl http://localhost:9090/api/rules/servicex/raw
```

**Response** (YAML):
```yaml
rules:
  - match:
      method: [GET, POST]
      path: /servicex/**
    proxyto: https://api.servicex.com/api/do
    headers:
      X-API-Key: "{{ config SERVICEX_API_KEY }}"
```

---

## Configuration Management

### Get Configuration

Get current configuration (API key values are masked).

**Endpoint**: `GET /api/config`

**Example**:
```bash
curl http://localhost:9090/api/config
```

**Response**:
```json
{
  "proxy_port": 8769,
  "admin_port": 9090,
  "config_dir": "/Users/user/.config/mockingbird",
  "values": {
    "SERVICEX_API_KEY": "sk-***",
    "OPENAI_API_KEY": "sk-***"
  }
}
```

---

### Get Config Value

Get a specific config value (unmasked).

**Endpoint**: `GET /api/config/:key`

**Example**:
```bash
curl http://localhost:9090/api/config/SERVICEX_API_KEY
```

**Response**:
```json
{
  "key": "SERVICEX_API_KEY",
  "value": "sk-actual-key-here"
}
```

---

### Set Config Value

Set or update a config value.

**Endpoint**: `PUT /api/config/:key`

**Request Body**:
```json
{
  "value": "sk-new-key-value"
}
```

**Example**:
```bash
curl -X PUT http://localhost:9090/api/config/SERVICEX_API_KEY \
  -H "Content-Type: application/json" \
  -d '{"value": "sk-new-key-value"}'
```

**Response**:
```json
{
  "success": true,
  "key": "SERVICEX_API_KEY",
  "message": "Config value updated successfully"
}
```

---

### Delete Config Value

Delete a config value.

**Endpoint**: `DELETE /api/config/:key`

**Example**:
```bash
curl -X DELETE http://localhost:9090/api/config/OLD_KEY
```

**Response**:
```json
{
  "success": true,
  "key": "OLD_KEY",
  "message": "Config value deleted successfully"
}
```

---

## System Management

### Health Check

Check if Mockingbird is running.

**Endpoint**: `GET /health`

**Example**:
```bash
curl http://localhost:9090/health
```

**Response**:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime_seconds": 3600
}
```

---

### Get Statistics

Get system statistics.

**Endpoint**: `GET /api/stats`

**Example**:
```bash
curl http://localhost:9090/api/stats
```

**Response**:
```json
{
  "total_requests": 1523,
  "total_rules": 12,
  "services": {
    "servicex": {
      "requests": 850,
      "rules": 5
    },
    "openai": {
      "requests": 673,
      "rules": 7
    }
  },
  "uptime_seconds": 3600
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message here",
  "code": "ERROR_CODE",
  "details": {}
}
```

**Common Error Codes**:
- `400` - Bad Request (invalid JSON, missing fields)
- `404` - Not Found (service, rule, or traffic entry not found)
- `500` - Internal Server Error

**Example Error**:
```json
{
  "error": "Rule not found",
  "code": "RULE_NOT_FOUND",
  "details": {
    "service": "servicex",
    "index": 99
  }
}
```

---

## Proxy API (Main Traffic)

The proxy server runs on port 8769 and handles actual API requests.

**Base URL**: `http://localhost:8769`

**Usage**:
Instead of calling `https://api.servicex.com/api/do?param=value`, call:

```bash
curl http://localhost:8769/servicex/api/do?param=value
```

The request will:
1. Be matched against rules for the "servicex" service
2. If matched and rule has `proxyto`, forward to real API with injected headers
3. If matched and rule has `response`, return mocked response
4. If no match, return 504 Gateway Timeout
5. Be recorded in traffic history

---

## Complete Workflow Example

### 1. Start Mockingbird
```bash
mockingbird
# Listening on :8769 (proxy)
# Listening on :9090 (admin)
```

### 2. Make a request (no rules yet)
```bash
curl http://localhost:8769/servicex/users
# Returns: 504 Gateway Timeout
```

### 3. Check traffic
```bash
curl http://localhost:9090/api/traffic?service=servicex
# Shows the failed request
```

### 4. Create a proxy rule
```bash
curl -X POST http://localhost:9090/api/rules/servicex \
  -H "Content-Type: application/json" \
  -d '{
    "match": {
      "method": ["GET"],
      "path": "/servicex/**"
    },
    "proxyto": "https://api.servicex.com",
    "headers": {
      "X-API-Key": "{{ config SERVICEX_API_KEY }}"
    }
  }'
```

### 5. Make request again
```bash
curl http://localhost:8769/servicex/users
# Now forwards to https://api.servicex.com/users with API key
```

### 6. Create a mock rule (more specific, wins first)
```bash
curl -X POST http://localhost:9090/api/rules/servicex \
  -H "Content-Type: application/json" \
  -d '{
    "match": {
      "method": ["GET"],
      "path": "/servicex/users/123"
    },
    "response": "[200]\nheaders:\n  Content-Type: application/json\nbody\n{\"id\":\"123\",\"name\":\"Charles\"}\n"
  }'
```

### 7. Test specific vs wildcard
```bash
# Hits mock rule
curl http://localhost:8769/servicex/users/123

# Hits proxy rule
curl http://localhost:8769/servicex/users/456
```

### 8. Stream live traffic
```bash
curl -N http://localhost:9090/api/traffic/stream
# Watch requests come in real-time
```

---

## Template Examples in Responses

### Using request data
```
[200]
headers:
  Content-Type: application/json
body
{
  "user_agent": "{{ reqHeader "User-Agent" }}",
  "user_id": "{{ reqPathParam 2 }}",
  "filter": "{{ reqQueryParam "filter" }}",
  "submitted_name": "{{ reqBody name }}"
}
```

### Using config and helpers
```
[200]
body
{
  "api_key_prefix": "{{ config SERVICEX_API_KEY | slice 0 7 }}",
  "request_id": "{{ uuid }}",
  "timestamp": "{{ now }}",
  "random_code": "ORD-{{ random 100000 999999 }}"
}
```

### With delay
```
+2s
[503]
body
{
  "error": "Service temporarily unavailable"
}
```
