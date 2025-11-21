# Mockingbird Plugin Template

This template provides a starting point for creating Mockingbird plugins with sophisticated React UI components.

## Structure

```
my-plugin/
├── plugin.js              # Backend logic (runs in Goja JavaScript runtime)
├── data.json             # Persistent plugin data storage
├── ui/                   # React component (optional)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── src/
│   │   └── PluginComponent.tsx
│   └── dist/
│       └── component.js  # Built bundle (generated)
└── README.md
```

## Getting Started

1. **Copy this template** to `~/.config/mockingbird/plugins/your-plugin-name/`

2. **Implement backend logic** in `plugin.js`:
   - Define routes to intercept requests
   - Implement `handleRequest()` for request interception
   - Implement `handleAction()` for UI actions
   - Use `plugin.getData()` and `plugin.saveData()` for persistence

3. **Build the React UI** (optional):
   ```bash
   cd ui
   npm install
   npm run build
   ```

4. **Restart Mockingbird** to load your plugin

## Backend API (`plugin.js`)

Your plugin has access to the following API:

### Exports

```javascript
exports.name = "my-plugin";
exports.version = "1.0";
exports.routes = ["/my-service/**"];  // Routes to intercept
exports.config_env = "MY_PLUGIN_";    // Config variable prefix
```

### Functions

```javascript
// Intercept requests matching your routes
exports.handleRequest = function(ctx) {
  // ctx contains: method, path, pathSegments, query, headers, body
  // Return null to pass through to rules, or return:
  return {
    status: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Hello" })
  };
};

// Handle actions from your UI
exports.handleAction = function(action, id, data) {
  // Process the action and return result
  return { success: true, message: "Action completed" };
};
```

### Plugin API

```javascript
// Data persistence
plugin.getData(key)           // Get stored data
plugin.saveData(key, value)   // Save data
plugin.getAllData()           // Get all data

// Configuration
plugin.getConfig(key)         // Get config value (prefix auto-applied)
plugin.getAllConfig()         // Get all config values

// HTTP requests
plugin.httpRequest(method, url, headers, body)  // Make HTTP requests

// Utilities
uuid()          // Generate UUID
now()           // Current timestamp
console.log()   // Plugin logging
```

## React Component API (`ui/src/PluginComponent.tsx`)

Your component receives the `api` prop with the following interface:

```typescript
interface PluginAPI {
  workspace: string;  // Current workspace name

  // Call backend handleAction
  action: (action: string, id: string, data?: Record<string, unknown>) => Promise<unknown>;

  // Refresh the component
  refresh: () => void;
}
```

### Example Component

```typescript
import { useState, useEffect } from 'react';
import { PluginComponentProps } from '../types';

export default function MyPluginUI({ api }: PluginComponentProps) {
  const [data, setData] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await api.action('load', 'data');
      setData(result);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleClick = async () => {
    await api.action('my-action', 'item-id', { value: 'data' });
    api.refresh();  // Reload component
  };

  return (
    <div>
      <h1>My Plugin UI</h1>
      <button onClick={handleClick}>Do Something</button>
    </div>
  );
}
```

## Building the UI

The UI uses Vite to bundle your React component into a single ESM module:

```bash
cd ui
npm install
npm run build    # Builds to ui/dist/component.js
npm run dev      # Watch mode for development
```

### Dependencies

You can use any npm packages in your component:

```bash
npm install recharts  # For charts
npm install react-hook-form  # For forms
npm install @tanstack/react-table  # For tables
```

All dependencies will be bundled into the `component.js` file.

## Development Tips

1. **Backend Only**: If you don't need a custom UI, just implement `plugin.js` and optionally `exports.getUI()` for simple list-based UI

2. **Hot Reload**: Run `npm run dev` in the `ui/` directory while developing, then refresh the Mockingbird UI

3. **Debugging**: Check the browser console for component errors and Mockingbird logs for backend errors

4. **State Management**: Use React hooks for local state, call `api.action()` to persist data on the backend

## Examples

See the migrated `email` and `linkedin` plugins for complete examples:
- `~/.config/mockingbird/plugins/email/`
- `~/.config/mockingbird/plugins/linkedin/`
