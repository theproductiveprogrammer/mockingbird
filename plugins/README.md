# Mockingbird Plugins

This directory contains example plugins for Mockingbird.

## Installation

To install a plugin, copy its folder to `~/.config/mockingbird/plugins/`:

```bash
cp -r plugins/linkedin ~/.config/mockingbird/plugins/
cp -r plugins/email ~/.config/mockingbird/plugins/
```

Restart Mockingbird to load the new plugins.

## Available Plugins

### LinkedIn Plugin (v2.0)

Intercepts and mocks LinkedIn API calls.

**Routes:** `/linkedin/**`

**Features:**
- Handles invitations (send, list, accept/reject)
- Manages chats and messages
- User profile lookups
- Post creation and retrieval
- Tracks all activities with persistent state
- UI for reviewing and approving messages

### Email Plugin (v1.0)

Integrates with Mailpit for email management.

**Routes:** None (UI-only plugin)

**Features:**
- Lists emails from Mailpit inbox
- Reply to emails with proper threading headers
- Tracks sent replies
- Configurable connection settings

**Configuration (via Mockingbird config):**
- `EMAIL_PLUGIN_HOST` - Mailpit host (default: localhost)
- `EMAIL_PLUGIN_PORT` - Mailpit API port (default: 8025)
- `EMAIL_PLUGIN_FROM_EMAIL` - Sender email address
- `EMAIL_PLUGIN_FROM_NAME` - Sender display name

## Plugin Development

See [Plugin Architecture](../docs/plugins.md) for details on creating custom plugins.

### Basic Structure

```
plugins/
  my-plugin/
    plugin.js    # Main plugin script (required)
    data.json    # Plugin state (auto-created)
```

### Plugin Exports

```javascript
exports.name = "my-plugin";
exports.version = "1.0";
exports.routes = ["/my-api/**"];  // Routes to intercept
exports.config_env = "MY_PLUGIN_"; // Config prefix

exports.handleRequest = function(ctx) {
    // Handle intercepted requests
    return null; // or { status, headers, body }
};

exports.getUI = function() {
    // Return UI definition
    return { type: "list", items: [...] };
};

exports.handleAction = function(action, id, data) {
    // Handle UI actions
    return { success: true, message: "Done" };
};
```

### Plugin API

Available via the global `plugin` object:

- `plugin.getData(key)` - Get stored data
- `plugin.saveData(key, value)` - Save data
- `plugin.getConfig(key)` - Get config value (prefix auto-applied)
- `plugin.getAllConfig()` - Get all matching config values
- `plugin.httpRequest(method, url, headers, body)` - Make HTTP requests
