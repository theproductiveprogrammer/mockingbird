# Plugin System

## Plugin Structure

```
plugins/
  my-plugin/
    plugin.js       # Required: plugin code
    data.json       # Auto-created: persistent storage
    ui/
      dist/
        component.js  # Optional: React UI
```

## Plugin API

```javascript
// plugin.js
exports.name = "my-plugin";
exports.version = "1.0";
exports.routes = ["/my-service/**"];
exports.config_env = "MY_PLUGIN";  // Config prefix

exports.handleRequest = function(ctx) {
  // ctx: {method, path, headers, body, query, pathParams}

  // Return null to pass to rule matcher
  if (ctx.path === "/passthrough") {
    return null;
  }

  // Return response to handle request
  return {
    status: 200,
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({handled: true})
  };
};

// Optional: Plugin UI
exports.getUI = function() {
  return {
    type: "list",
    items: plugin.getAllData().items || []
  };
};

exports.handleAction = function(action, id, data) {
  if (action === "delete") {
    // Handle delete action
  }
};
```

## Plugin Helpers

```javascript
// Persistent storage
plugin.saveData("key", value);
plugin.getData("key");
plugin.getAllData();

// Configuration (filtered by config_env prefix)
plugin.getConfig("API_KEY");  // Gets MY_PLUGIN_API_KEY
plugin.getAllConfig();

// HTTP requests
var response = plugin.httpRequest("GET", "https://api.example.com", {
  "Authorization": "Bearer xxx"
}, null);
// response: {status, headers, body, error}
```
