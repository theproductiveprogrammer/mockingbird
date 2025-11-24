# Server-Sent Events (SSE) Limitations in Mockingbird

## Overview

Mockingbird **does not support proxying Server-Sent Events (SSE)** streams. This document explains why SSE is incompatible with Mockingbird's architecture and provides workarounds.

## What is SSE?

Server-Sent Events (SSE) is a web standard for servers to push real-time updates to clients over HTTP:
- Uses `Content-Type: text/event-stream`
- Single long-lived HTTP connection
- Server continuously streams events to client
- Unidirectional: server → client only

**Common Use Cases:**
- Real-time notifications
- Live feeds and updates
- MCP (Model Context Protocol) communication
- Progress tracking for long-running operations

## Why SSE Doesn't Work Through Mockingbird

### Problem 1: Response Buffering

**Mockingbird fully buffers proxy responses before returning them to the client.**

From `internal/proxy/handler.go:268-272`:
```go
// Capture response
rec := &responseRecorder{ResponseWriter: w, statusCode: 200, body: &strings.Builder{}}

start := time.Now()
proxy.ServeHTTP(rec, r)
duration := time.Since(start)
```

**The Issue:**
1. `responseRecorder` waits for the **entire response body** to complete
2. SSE streams are **infinite** - they never complete (connection stays open)
3. Mockingbird waits indefinitely, buffering all events
4. Client receives nothing until the connection closes
5. Mockingbird may timeout or run out of memory

**SSE requires incremental streaming**, not buffering. The response must be written to the client as events arrive, not after collection.

### Problem 2: Traffic Recording

Mockingbird records all traffic for debugging and inspection:

```go
// Record traffic
entry := models.TrafficEntry{
    ID:          uuid.New().String(),
    Timestamp:   start,
    Service:     service,
    Method:      r.Method,
    Path:        path,
    Response:    response,  // Full response body stored
    ...
}
st.AddTraffic(entry)
```

**The Issue:**
1. SSE produces an **unbounded stream** of events
2. Recording the full response body would:
   - Consume unlimited memory
   - Grow traffic.ndjson file indefinitely
   - Provide no meaningful inspection (infinite data)
3. Mockingbird's 2MB body truncation doesn't help (stream is continuous)

### Problem 3: Request/Response Coupling

Mockingbird is designed around the **HTTP request/response model**:
- One request → One response → Connection closes
- Response time measured in milliseconds
- Traffic entries are discrete, bounded events

**SSE breaks this model:**
- One request → Infinite responses → Connection never closes
- Response "time" is unbounded
- Single traffic entry would need to represent infinite events

## MCP Protocol Impact

The **Model Context Protocol (MCP)** uses SSE for server-to-client communication:

### MCP Architecture
```
1. Client → GET /mcp/sse (establish SSE connection)
2. Server → SSE event "endpoint": "/mcp/post"
3. Client → POST /mcp/post (send JSON-RPC request)
4. Server → HTTP 202 Accepted (immediate acknowledgment)
5. Server → SSE event "message": {JSON-RPC response}
```

### Why MCP Fails Through Mockingbird

**Scenario**: Client connects through Mockingbird

```
Client → Mockingbird → Backend
  |                        |
  GET /mcp/sse ─────────►  |
                           ├─ Creates SSE stream
                           ├─ Sends "endpoint" event
                           └─ Keeps connection open
  |
  ◄── [Mockingbird buffers, waits forever] ──
  |
  [Client times out - never receives endpoint event]
```

**Additional MCP-Specific Issue:**

The backend `SseBroadcaster` resets its sink on each new connection:

```java
// SseController.java
public Publisher<Event<?>> connectSse() {
    broadcaster.resetSink();  // New sink per connection!
    return broadcaster.getEventsPublisher();
}
```

If Mockingbird's proxy connection reconnects (due to timeout, retry, etc.):
1. New connection creates new sink
2. POST responses broadcast to new sink
3. Client's original SSE connection receives nothing
4. Responses lost in void

## Workarounds

### Option 1: Direct Connection (Recommended)

**Connect directly to the backend for SSE endpoints:**

```yaml
# Mockingbird rule for non-SSE endpoints
rules:
  - description: "Proxy regular API calls"
    method: "POST"
    path: "/mcp/post"
    proxyTo: "http://localhost:6991"
```

**Client configuration:**
```javascript
// SSE - Direct connection (bypass Mockingbird)
const sseUrl = "http://localhost:6991/mcp/sse";

// POST - Through Mockingbird (works fine)
const postUrl = "http://localhost:6625/salesboxai/mcp/post";
```

**Why this works:**
- SSE streams directly from backend to client (no buffering)
- POST requests are discrete request/response pairs (Mockingbird compatible)
- Mockingbird still proxies and records the actual RPC calls

### Option 2: Polling Instead of SSE

**Modify the protocol to use HTTP polling:**

```
1. Client → POST /mcp/request (with correlation ID)
2. Server → 202 Accepted {jobId: "abc123"}
3. Client → GET /mcp/response/abc123 (poll every 1s)
4. Server → 200 OK {status: "complete", result: {...}}
```

**Advantages:**
- Works through any proxy
- Mockingbird can record all traffic
- No connection management issues

**Disadvantages:**
- Higher latency (polling delay)
- More network overhead
- Less elegant than push-based SSE

### Option 3: WebSocket Transport

**Use WebSocket instead of SSE:**
- Bidirectional communication
- Also incompatible with Mockingbird's current architecture
- Would require similar proxy modifications as SSE

### Option 4: Modify Mockingbird (Not Recommended)

**Add SSE passthrough mode** - significant architectural changes required:

1. **Detect SSE responses:**
```go
func isSSEResponse(headers http.Header) bool {
    return headers.Get("Content-Type") == "text/event-stream"
}
```

2. **Skip buffering for SSE:**
```go
if isSSEResponse(r.Header) {
    // Stream directly without recording
    proxy.ServeHTTP(w, r)
    return &models.Response{
        StatusCode: 200,
        Body:       "[SSE stream - not recorded]",
    }
}
```

3. **Skip traffic recording:**
```go
if ruleType != "sse-stream" {
    st.AddTraffic(entry)
}
```

**Why not recommended:**
- Defeats Mockingbird's purpose (inspection, mocking, debugging)
- SSE streams can't be inspected or replayed
- Adds complexity for limited benefit
- Direct connection is simpler

## Recommendation

**For MCP and other SSE-based protocols:**

1. **Development/Testing**: Use direct connections for SSE endpoints
2. **Production**: Consider polling-based alternatives for proxy compatibility
3. **Documentation**: Clearly mark which endpoints require direct access

**Do not attempt to proxy SSE through Mockingbird** - it is fundamentally incompatible with the request/response recording model.

## Related Protocols

**Other streaming protocols incompatible with Mockingbird:**

- **WebSocket**: Bidirectional, long-lived connections
- **gRPC Streaming**: Server/client/bidirectional streams
- **HTTP/2 Server Push**: Multiple responses per request
- **GraphQL Subscriptions**: Typically SSE or WebSocket based

**Compatible alternatives:**
- **HTTP Long Polling**: Works (each poll is request/response)
- **Chunked Transfer Encoding**: Works for finite streams
- **Standard REST APIs**: Designed for Mockingbird

## Technical Details

### SSE Event Stream Format

```
event: endpoint
data: /mcp/post

event: message
data: {"jsonrpc":"2.0","id":1,"result":{...}}

event: message
data: {"jsonrpc":"2.0","id":2,"result":{...}}

... [stream continues indefinitely]
```

### Mockingbird's Response Recording

```go
type Response struct {
    StatusCode int               `json:"statusCode"`
    Headers    map[string]string `json:"headers"`
    Body       string            `json:"body"`      // Single string
    DelayMS    int64             `json:"delayMS"`   // Finite duration
}
```

**Cannot represent:**
- Multiple events over time
- Infinite streams
- Unbounded duration

## Conclusion

Mockingbird is an excellent tool for **discrete request/response APIs** but is architecturally incompatible with **streaming protocols** like SSE. For SSE-based services (including MCP), use direct connections or consider polling-based alternatives.

The incompatibility is **by design** - Mockingbird's value comes from recording, inspecting, and replaying traffic, which requires bounded request/response pairs.
