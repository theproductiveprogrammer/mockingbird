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
curl http://localhost:6625/test/endpoint

# This will proxy to ServiceX with injected API key
curl http://localhost:6625/servicex/users

# This will return a mocked response (contains "charles")
curl -X POST http://localhost:6625/servicex/users/new \
  -H "Content-Type: application/json" \
  -d '{"username": "charles", "email": "charles@example.com"}'
```

