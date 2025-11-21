// Mockingbird Plugin Template
// This file runs in a Goja JavaScript runtime on the backend

// Plugin metadata
exports.name = "my-plugin";
exports.version = "1.0.0";
exports.routes = ["/my-service/**"];  // Routes this plugin intercepts
exports.config_env = "MY_PLUGIN_";     // Environment variable prefix

/**
 * Handle incoming HTTP requests that match the plugin's routes
 * @param {Object} ctx - Request context
 * @param {string} ctx.method - HTTP method (GET, POST, etc.)
 * @param {string} ctx.path - Request path
 * @param {string[]} ctx.pathSegments - Path split into segments
 * @param {Object} ctx.query - Query parameters
 * @param {Object} ctx.headers - Request headers
 * @param {*} ctx.body - Request body (parsed JSON or string)
 * @returns {Object|null} Response object or null to pass through to rules
 */
exports.handleRequest = function(ctx) {
  console.log("[my-plugin] Received request:", ctx.method, ctx.path);

  // Example: Return a mocked response
  if (ctx.path === "/my-service/hello") {
    return {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Hello from my-plugin!",
        timestamp: now()
      })
    };
  }

  // Example: Store request data
  var data = plugin.getAllData();
  if (!data.requests) {
    data.requests = [];
  }
  data.requests.push({
    path: ctx.path,
    method: ctx.method,
    timestamp: now()
  });
  plugin.saveData("requests", data.requests);

  // Return null to let the request pass through to the rules engine
  return null;
};

/**
 * Handle actions from the UI component
 * @param {string} action - Action identifier
 * @param {string} id - Item identifier
 * @param {Object} data - Action data from UI
 * @returns {*} Result to send back to UI
 */
exports.handleAction = function(action, id, data) {
  console.log("[my-plugin] Action:", action, "ID:", id, "Data:", data);

  switch (action) {
    case "load":
      // Return data for the UI to display
      return {
        success: true,
        data: plugin.getAllData()
      };

    case "clear":
      // Clear stored data
      plugin.saveData("requests", []);
      return {
        success: true,
        message: "Data cleared"
      };

    case "example":
      // Example action with external API call
      var config = plugin.getAllConfig();
      if (config.API_KEY) {
        var response = plugin.httpRequest(
          "GET",
          "https://api.example.com/data",
          {
            "Authorization": "Bearer " + config.API_KEY
          },
          null
        );

        if (response.error) {
          return {
            success: false,
            error: response.error
          };
        }

        return {
          success: true,
          data: response.body
        };
      }

      return {
        success: false,
        error: "API_KEY not configured"
      };

    default:
      return {
        success: false,
        error: "Unknown action: " + action
      };
  }
};

/**
 * Optional: Define simple list-based UI (legacy approach)
 * This is only used if the plugin doesn't have a React component
 * @returns {Object} UI definition
 */
exports.getUI = function() {
  var data = plugin.getAllData();
  var requests = data.requests || [];

  return {
    type: "list",
    items: requests.map(function(req, index) {
      return {
        id: "request-" + index,
        title: req.method + " " + req.path,
        subtitle: "Timestamp: " + req.timestamp,
        content: JSON.stringify(req, null, 2),
        actions: [
          {
            label: "Clear All",
            action: "clear"
          }
        ]
      };
    })
  };
};
