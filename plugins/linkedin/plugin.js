// LinkedIn Plugin - Full Implementation with Unipile Integration
exports.name = "linkedin";
exports.version = "3.0";
exports.routes = ["/linkedin/**"];
exports.config_env = "LINKEDIN_PLUGIN_";

// Helper to generate unique IDs
function generateId(prefix) {
    return prefix + "_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

// Helper to generate LinkedIn-like IDs
function generateLinkedInId() {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
    var id = "";
    for (var i = 0; i < 22; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

// Helper to get current ISO timestamp
function now() {
    return new Date().toISOString();
}

// Helper to get Unipile API URL
function getUnipileUrl() {
    var dns = plugin.getConfig("DNS") || "";
    if (!dns) {
        return null;
    }
    return "https://" + dns;
}

// Helper to get Unipile API key
function getUnipileApiKey() {
    return plugin.getConfig("API_KEY") || "";
}

// Helper to convert query params object to query string
function buildQueryString(queryParams) {
    if (!queryParams) {
        return "";
    }
    var parts = [];
    for (var key in queryParams) {
        if (queryParams.hasOwnProperty(key)) {
            parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(queryParams[key]));
        }
    }
    return parts.join("&");
}

// Forward request to Unipile API
function forwardToUnipile(path, queryParams) {
    var baseUrl = getUnipileUrl();
    var apiKey = getUnipileApiKey();

    if (!baseUrl || !apiKey) {
        console.log("LinkedIn plugin: Unipile not configured (missing DNS or API_KEY)");
        return null;
    }

    var url = baseUrl + path;
    var queryString = buildQueryString(queryParams);
    if (queryString) {
        url += "?" + queryString;
    }
    console.log("LinkedIn plugin: Forwarding to Unipile: " + url);

    var result = plugin.httpRequest("GET", url, {
        "X-API-KEY": apiKey,
        "Accept": "application/json"
    }, null);

    if (result.error) {
        console.log("LinkedIn plugin: Unipile request failed: " + result.error);
        return null;
    }

    if (result.status !== 200) {
        console.log("LinkedIn plugin: Unipile returned status: " + result.status);
        return null;
    }

    return result.body;
}

// Proxy any request to Unipile API (for unhandled endpoints)
function proxyToUnipile(method, path, queryParams, body) {
    var baseUrl = getUnipileUrl();
    var apiKey = getUnipileApiKey();

    if (!baseUrl || !apiKey) {
        console.log("LinkedIn plugin: Unipile not configured, cannot proxy unhandled request: " + path);
        return {
            status: 501,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                error: "Not Implemented",
                message: "Endpoint not mocked and Unipile not configured",
                path: path
            })
        };
    }

    var url = baseUrl + path;
    var queryString = buildQueryString(queryParams);
    if (queryString) {
        url += "?" + queryString;
    }
    console.log("LinkedIn plugin: Proxying to Unipile: " + method + " " + url);

    var headers = {
        "X-API-KEY": apiKey,
        "Accept": "application/json"
    };

    // Add Content-Type for requests with body
    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
        headers["Content-Type"] = "application/json";
    }

    var requestBody = null;
    if (body && typeof body === "object") {
        requestBody = JSON.stringify(body);
    } else if (body) {
        requestBody = body;
    }

    var result = plugin.httpRequest(method, url, headers, requestBody);

    if (result.error) {
        console.log("LinkedIn plugin: Unipile proxy request failed: " + result.error);
        return {
            status: 502,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                error: "Bad Gateway",
                message: "Failed to proxy request to Unipile: " + result.error
            })
        };
    }

    // Return Unipile's response as-is
    // Note: result.body may be a parsed JSON object, so stringify if needed
    var responseBody = result.body;
    if (typeof responseBody === "object" && responseBody !== null) {
        responseBody = JSON.stringify(responseBody);
    }

    return {
        status: result.status,
        headers: result.headers || { "Content-Type": "application/json" },
        body: responseBody || ""
    };
}

// Get invite status for a user by provider_id
function getInviteStatus(providerId) {
    var invites = plugin.getData("invitations_sent") || [];
    for (var i = 0; i < invites.length; i++) {
        if (invites[i].recipient_id === providerId) {
            return invites[i].status;
        }
    }
    return null; // No invite sent
}

// Determine network_distance based on invite status
function getNetworkDistanceByInviteStatus(status) {
    if (status === "accepted") {
        return "FIRST_DEGREE";
    } else if (status === "pending") {
        return "SECOND_DEGREE";
    }
    return "THIRD_DEGREE"; // Not invited or declined
}

// Get cached profile or fetch from Unipile
function getProfileWithCache(identifier, queryParams) {
    var cache = plugin.getData("profiles_cache") || {};

    // Check cache first (cache key is just identifier, ignoring query params)
    if (cache[identifier]) {
        console.log("LinkedIn plugin: Returning cached profile for " + identifier);
        var cachedProfile = cache[identifier].data;

        // Create a copy and override network_distance based on invite status
        var result = JSON.parse(JSON.stringify(cachedProfile));
        var inviteStatus = getInviteStatus(result.provider_id);
        result.network_distance = getNetworkDistanceByInviteStatus(inviteStatus);
        console.log("LinkedIn plugin: Set network_distance to " + result.network_distance + " (invite status: " + (inviteStatus || "none") + ")");

        return result;
    }

    // Try to fetch from Unipile (passing query params for authentication)
    var profile = forwardToUnipile("/api/v1/users/" + identifier, queryParams);
    if (profile) {
        // Cache the result
        cache[identifier] = {
            data: profile,
            cached_at: now()
        };
        plugin.saveData("profiles_cache", cache);
        console.log("LinkedIn plugin: Cached profile for " + identifier);

        // Create a copy and override network_distance based on invite status
        var result = JSON.parse(JSON.stringify(profile));
        var inviteStatus = getInviteStatus(result.provider_id);
        result.network_distance = getNetworkDistanceByInviteStatus(inviteStatus);
        console.log("LinkedIn plugin: Set network_distance to " + result.network_distance + " (invite status: " + (inviteStatus || "none") + ")");

        return result;
    }

    return null;
}

// Get cached posts or fetch from Unipile
function getPostsWithCache(identifier, queryParams) {
    var cache = plugin.getData("posts_cache") || {};

    // Check cache first (cache key is just identifier, ignoring query params)
    if (cache[identifier]) {
        console.log("LinkedIn plugin: Returning cached posts for " + identifier);
        return cache[identifier].data;
    }

    // Try to fetch from Unipile (passing query params for authentication)
    var posts = forwardToUnipile("/api/v1/users/" + identifier + "/posts", queryParams);
    if (posts) {
        // Cache the result
        cache[identifier] = {
            data: posts,
            cached_at: now()
        };
        plugin.saveData("posts_cache", cache);
        console.log("LinkedIn plugin: Cached posts for " + identifier);
        return posts;
    }

    return null;
}

// Update cached profile to FIRST_DEGREE connection
function updateCacheToFirstDegree(identifier) {
    var cache = plugin.getData("profiles_cache") || {};

    // Check if we have this profile cached directly by key
    if (cache[identifier] && cache[identifier].data) {
        cache[identifier].data.network_distance = "FIRST_DEGREE";
        cache[identifier].updated_at = now();
        plugin.saveData("profiles_cache", cache);
        console.log("LinkedIn plugin: Updated " + identifier + " to FIRST_DEGREE connection");
        return true;
    }

    // Search by provider_id if not found by key
    for (var cacheKey in cache) {
        var profile = cache[cacheKey].data;
        if (profile && profile.provider_id === identifier) {
            cache[cacheKey].data.network_distance = "FIRST_DEGREE";
            cache[cacheKey].updated_at = now();
            plugin.saveData("profiles_cache", cache);
            console.log("LinkedIn plugin: Updated " + cacheKey + " (provider_id: " + identifier + ") to FIRST_DEGREE connection");
            return true;
        }
    }

    return false;
}

// Initialize mock data if empty
function initializeData() {
    if (!plugin.getData("initialized")) {
        // Initialize with some mock users
        plugin.saveData("users", {
            "mock_user_001": {
                object: "UserProfile",
                provider: "LINKEDIN",
                provider_id: "ACoAAA" + generateLinkedInId(),
                public_identifier: "john-doe-123",
                first_name: "John",
                last_name: "Doe",
                headline: "Software Engineer at TechCorp",
                location: "San Francisco, CA",
                follower_count: 1250,
                connections_count: 890,
                profile_picture_url: "https://via.placeholder.com/100x100"
            },
            "mock_user_002": {
                object: "UserProfile",
                provider: "LINKEDIN",
                provider_id: "ACoAAA" + generateLinkedInId(),
                public_identifier: "jane-smith-456",
                first_name: "Jane",
                last_name: "Smith",
                headline: "Product Manager | AI Enthusiast",
                location: "New York, NY",
                follower_count: 3200,
                connections_count: 1500,
                profile_picture_url: "https://via.placeholder.com/100x100"
            }
        });

        plugin.saveData("invitations_sent", []);
        plugin.saveData("invitations_received", []);
        plugin.saveData("chats", {});
        plugin.saveData("messages", []);
        plugin.saveData("posts", []);
        plugin.saveData("post_reactions", []);
        plugin.saveData("post_comments", []);
        plugin.saveData("initialized", true);
    }
}

// Handle incoming requests
exports.handleRequest = function(ctx) {
    initializeData();

    var path = ctx.path;
    var method = ctx.method;
    var body = ctx.body || {};
    var queryParams = ctx.query || {};

    console.log("LinkedIn plugin: " + method + " " + path);

    // Remove /linkedin prefix if present
    var apiPath = path.replace(/^\/linkedin/, "");

    // ===== INVITATIONS =====

    // Send invitation
    if (method === "POST" && (apiPath.match(/\/api\/v1\/users\/invitations?$/) || apiPath.match(/\/api\/v1\/users\/invite$/))) {
        var invitation = {
            id: generateId("inv"),
            invitation_id: Date.now().toString(),
            recipient_id: body.provider_id || body.identifier || body.to || "unknown",
            account_id: body.account_id || "",
            message: body.message || "",
            status: "pending",
            sent_at: now()
        };
        var sent = plugin.getData("invitations_sent") || [];
        sent.push(invitation);
        plugin.saveData("invitations_sent", sent);

        return {
            status: 201,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                object: "UserInvitationSent",
                invitation_id: invitation.invitation_id
            })
        };
    }

    // List sent invitations
    if (method === "GET" && apiPath === "/api/v1/users/invitations/sent") {
        var sentInvites = plugin.getData("invitations_sent") || [];
        return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                object: "InvitationList",
                items: sentInvites.map(function(inv) {
                    return {
                        object: "Invitation",
                        id: inv.invitation_id,
                        recipient_id: inv.recipient_id,
                        message: inv.message,
                        status: inv.status,
                        sent_at: inv.sent_at
                    };
                })
            })
        };
    }

    // List received invitations
    if (method === "GET" && apiPath === "/api/v1/users/invitations/received") {
        var receivedInvites = plugin.getData("invitations_received") || [];
        return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                object: "InvitationList",
                items: receivedInvites
            })
        };
    }

    // ===== CHATS & MESSAGES =====

    // Start new chat
    if (method === "POST" && apiPath === "/api/v1/chats") {
        var chatId = generateLinkedInId();
        var messageId = generateLinkedInId();
        var chats = plugin.getData("chats") || {};

        var attendeeIds = body.attendees_ids || [body.attendee_id || "unknown"];
        var attendeeProviderId = attendeeIds[0];

        // Try to get attendee name from profile cache
        var attendeeName = "";
        var profilesCache = plugin.getData("profiles_cache") || {};
        for (var cacheKey in profilesCache) {
            var profile = profilesCache[cacheKey].data;
            if (profile && (profile.provider_id === attendeeProviderId || cacheKey === attendeeProviderId)) {
                attendeeName = (profile.first_name || "") + " " + (profile.last_name || "");
                attendeeName = attendeeName.trim();
                break;
            }
        }

        var newChat = {
            object: "Chat",
            id: chatId,
            account_id: body.account_id || "",
            account_type: "LINKEDIN",
            provider_id: chatId,
            attendee_provider_id: attendeeProviderId,
            name: attendeeName,
            type: attendeeIds.length > 1 ? 1 : 0,
            timestamp: now(),
            unread_count: 0,
            archived: 0,
            muted_until: -1,
            read_only: 0,
            disabledFeatures: [],
            subject: "",
            organization_id: "",
            mailbox_id: "",
            content_type: "inmail",
            folder: ["INBOX"],
            pinned: 0
        };
        chats[chatId] = newChat;
        plugin.saveData("chats", chats);

        // If there's an initial message, save it
        if (body.text) {
            var messages = plugin.getData("messages") || [];
            messages.push({
                object: "Message",
                provider_id: messageId,
                sender_id: "self",
                text: body.text,
                attachments: [],
                id: messageId,
                account_id: body.account_id || "",
                chat_id: chatId,
                chat_provider_id: chatId,
                timestamp: now(),
                is_sender: 1,
                quoted: null,
                reactions: [],
                seen: 0,
                seen_by: {},
                hidden: 0,
                deleted: 0,
                edited: 0,
                is_event: 0,
                delivered: 0,
                behavior: 0,
                event_type: 0,
                original: "",
                replies: 0,
                reply_by: [],
                parent: "",
                sender_attendee_id: "",
                subject: "",
                message_type: "MESSAGE",
                attendee_type: "MEMBER",
                attendee_distance: 1,
                sender_urn: "",
                reply_to: null
            });
            plugin.saveData("messages", messages);
        }

        return {
            status: 201,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                object: "ChatStarted",
                chat_id: chatId,
                message_id: messageId
            })
        };
    }

    // List all chats
    if (method === "GET" && apiPath === "/api/v1/chats") {
        var allChats = plugin.getData("chats") || {};
        var chatList = [];
        for (var cid in allChats) {
            chatList.push(allChats[cid]);
        }
        return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                object: "ChatList",
                items: chatList
            })
        };
    }

    // Get specific chat
    var chatMatch = apiPath.match(/\/api\/v1\/chats\/([^\/]+)$/);
    if (method === "GET" && chatMatch) {
        var chatId = chatMatch[1];
        var chats = plugin.getData("chats") || {};
        var chat = chats[chatId];
        if (chat) {
            // Clone the chat object
            var response = JSON.parse(JSON.stringify(chat));

            // Get last message for this chat
            var allMessages = plugin.getData("messages") || [];
            var chatMessages = allMessages.filter(function(m) { return m.chat_id === chatId; });

            if (chatMessages.length > 0) {
                var lastMsg = chatMessages[chatMessages.length - 1];
                response.lastMessage = {
                    object: "Message",
                    provider_id: lastMsg.id,
                    sender_id: lastMsg.sender_id || "self",
                    text: lastMsg.text || "",
                    attachments: lastMsg.attachments || [],
                    id: lastMsg.id,
                    account_id: chat.account_id,
                    chat_id: chatId,
                    chat_provider_id: chat.provider_id,
                    timestamp: lastMsg.timestamp,
                    is_sender: lastMsg.is_sender || 1,
                    quoted: lastMsg.quoted || null,
                    reactions: lastMsg.reactions || [],
                    seen: lastMsg.seen || 0,
                    seen_by: lastMsg.seen_by || {},
                    hidden: lastMsg.hidden || 0,
                    deleted: lastMsg.deleted || 0,
                    edited: lastMsg.edited || 0,
                    is_event: lastMsg.is_event || 0,
                    delivered: lastMsg.delivered || 0,
                    behavior: lastMsg.behavior || 0,
                    event_type: lastMsg.event_type || 0,
                    original: lastMsg.original || "",
                    replies: lastMsg.replies || 0,
                    reply_by: lastMsg.reply_by || [],
                    parent: lastMsg.parent || "",
                    sender_attendee_id: lastMsg.sender_attendee_id || "",
                    subject: lastMsg.subject || "",
                    message_type: lastMsg.message_type || "MESSAGE",
                    attendee_type: lastMsg.attendee_type || "MEMBER",
                    attendee_distance: lastMsg.attendee_distance || 1,
                    sender_urn: lastMsg.sender_urn || "",
                    reply_to: lastMsg.reply_to || null
                };
            }

            return {
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(response)
            };
        }
        return {
            status: 404,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Chat not found" })
        };
    }

    // Get messages for a chat
    var messagesMatch = apiPath.match(/\/api\/v1\/chats\/([^\/]+)\/messages$/);
    if (method === "GET" && messagesMatch) {
        var chatId = messagesMatch[1];
        var allMessages = plugin.getData("messages") || [];
        var chatMessages = allMessages.filter(function(m) {
            return m.chat_id === chatId;
        });
        return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                object: "MessageList",
                items: chatMessages.reverse() // Most recent first
            })
        };
    }

    // Send message to chat
    if (method === "POST" && messagesMatch) {
        var chatId = messagesMatch[1];
        var messageId = generateLinkedInId();
        var messages = plugin.getData("messages") || [];
        var chats = plugin.getData("chats") || {};
        var chat = chats[chatId];

        if (!chat) {
            return {
                status: 404,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "Chat not found" })
            };
        }

        var newMessage = {
            object: "Message",
            provider_id: messageId,
            sender_id: "self",
            text: body.text || "",
            attachments: [],
            id: messageId,
            account_id: chat.account_id,
            chat_id: chatId,
            chat_provider_id: chat.provider_id,
            timestamp: now(),
            is_sender: 1,
            quoted: null,
            reactions: [],
            seen: 0,
            seen_by: {},
            hidden: 0,
            deleted: 0,
            edited: 0,
            is_event: 0,
            delivered: 0,
            behavior: 0,
            event_type: 0,
            original: "",
            replies: 0,
            reply_by: [],
            parent: "",
            sender_attendee_id: "",
            subject: "",
            message_type: "MESSAGE",
            attendee_type: "MEMBER",
            attendee_distance: 1,
            sender_urn: "",
            reply_to: null
        };

        messages.push(newMessage);
        plugin.saveData("messages", messages);

        return {
            status: 201,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                object: "MessageSent",
                message_id: messageId
            })
        };
    }

    // ===== USERS & PROFILES =====

    // Get own profile
    if (method === "GET" && apiPath === "/api/v1/users/profile") {
        return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                object: "UserProfile",
                provider: "LINKEDIN",
                provider_id: "ACoAAA" + generateLinkedInId(),
                public_identifier: "mock-user",
                first_name: "Mock",
                last_name: "User",
                headline: "Mockingbird Test User",
                location: "Test City",
                follower_count: 100,
                connections_count: 50
            })
        };
    }

    // Get user profile by identifier
    var profileMatch = apiPath.match(/\/api\/v1\/users\/([^\/]+)\/profile$/);
    if (!profileMatch) {
        profileMatch = apiPath.match(/\/api\/v1\/users\/([^\/]+)$/);
    }
    if (method === "GET" && profileMatch && !apiPath.includes("/posts") && !apiPath.includes("/invitations") && !apiPath.includes("/relations")) {
        var identifier = profileMatch[1];

        // Try to get from cache or Unipile first (pass query params for Unipile auth)
        var cachedProfile = getProfileWithCache(identifier, queryParams);
        if (cachedProfile) {
            return {
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cachedProfile)
            };
        }

        // Fall back to local users store
        var users = plugin.getData("users") || {};

        // Check if we have this user
        for (var uid in users) {
            var user = users[uid];
            if (user.public_identifier === identifier || user.provider_id === identifier) {
                return {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(user)
                };
            }
        }

        // Generate a mock user for unknown identifiers
        var mockUser = {
            object: "UserProfile",
            provider: "LINKEDIN",
            provider_id: identifier.startsWith("ACoAAA") ? identifier : "ACoAAA" + generateLinkedInId(),
            public_identifier: identifier.startsWith("ACoAAA") ? "user-" + identifier.substr(0, 8) : identifier,
            first_name: "Unknown",
            last_name: "User",
            headline: "LinkedIn Member",
            location: "Unknown",
            follower_count: Math.floor(Math.random() * 1000),
            connections_count: Math.floor(Math.random() * 500)
        };

        return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(mockUser)
        };
    }

    // Get user posts
    var postsMatch = apiPath.match(/\/api\/v1\/users\/([^\/]+)\/posts$/);
    if (method === "GET" && postsMatch) {
        var userId = postsMatch[1];

        // Try to get from cache or Unipile first (pass query params for Unipile auth)
        var cachedPosts = getPostsWithCache(userId, queryParams);
        if (cachedPosts) {
            // If it's already an array (from Unipile), wrap it
            if (Array.isArray(cachedPosts)) {
                return {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(cachedPosts)
                };
            }
            // If it's already a response object, return it
            return {
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cachedPosts)
            };
        }

        // Fall back to local posts store
        var userPosts = plugin.getData("posts") || [];
        var filtered = userPosts.filter(function(p) {
            return p.author_id === userId;
        });

        return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                object: "PostList",
                items: filtered.length > 0 ? filtered : [],
                cursor: null,
                paging: { page_count: filtered.length }
            })
        };
    }

    // ===== POSTS =====

    // Create post
    if (method === "POST" && apiPath === "/api/v1/posts") {
        var postId = Date.now().toString();
        var posts = plugin.getData("posts") || [];
        var newPost = {
            object: "Post",
            id: postId,
            provider: "LINKEDIN",
            social_id: "urn:li:activity:" + postId,
            text: body.text || "",
            author_id: "self",
            created_at: now(),
            comment_counter: 0,
            reaction_counter: 0,
            repost_counter: 0
        };
        posts.push(newPost);
        plugin.saveData("posts", posts);

        return {
            status: 201,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                object: "PostCreated",
                post_id: postId
            })
        };
    }

    // ===== POST REACTIONS =====

    // Add reaction to post
    var reactionMatch = apiPath.match(/\/api\/v1\/posts\/([^\/]+)\/reaction$/);
    if (method === "POST" && reactionMatch) {
        var postId = reactionMatch[1];
        var reactions = plugin.getData("post_reactions") || [];
        var newReaction = {
            id: generateId("reaction"),
            post_id: postId,
            account_id: body.account_id || "",
            reaction_type: body.reaction_type || body.type || "LIKE",
            created_at: now()
        };
        reactions.push(newReaction);
        plugin.saveData("post_reactions", reactions);

        // Update reaction counter in post if it exists locally
        var posts = plugin.getData("posts") || [];
        for (var i = 0; i < posts.length; i++) {
            if (posts[i].id === postId || posts[i].social_id === postId) {
                posts[i].reaction_counter = (posts[i].reaction_counter || 0) + 1;
                plugin.saveData("posts", posts);
                break;
            }
        }

        // Also check posts_cache
        var postsCache = plugin.getData("posts_cache") || {};
        for (var cacheKey in postsCache) {
            var cachedPosts = postsCache[cacheKey].data;
            if (cachedPosts && cachedPosts.items) {
                for (var j = 0; j < cachedPosts.items.length; j++) {
                    var cachedPost = cachedPosts.items[j];
                    if (cachedPost.id === postId || cachedPost.social_id === postId) {
                        cachedPost.reaction_counter = (cachedPost.reaction_counter || 0) + 1;
                        plugin.saveData("posts_cache", postsCache);
                        break;
                    }
                }
            }
        }

        console.log("LinkedIn plugin: Recorded reaction on post " + postId);

        return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                object: "ReactionAdded",
                reaction_id: newReaction.id
            })
        };
    }

    // Get reactions for a post
    var getReactionsMatch = apiPath.match(/\/api\/v1\/posts\/([^\/]+)\/reactions$/);
    if (method === "GET" && getReactionsMatch) {
        var postId = getReactionsMatch[1];
        var allReactions = plugin.getData("post_reactions") || [];
        var postReactions = allReactions.filter(function(r) {
            return r.post_id === postId;
        });
        return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                object: "ReactionList",
                items: postReactions
            })
        };
    }

    // ===== POST COMMENTS =====

    // Add comment to post
    var commentMatch = apiPath.match(/\/api\/v1\/posts\/([^\/]+)\/comments$/);
    if (method === "POST" && commentMatch) {
        var postId = commentMatch[1];
        var comments = plugin.getData("post_comments") || [];
        var newComment = {
            id: generateId("comment"),
            post_id: postId,
            account_id: body.account_id || "",
            text: body.text || "",
            created_at: now()
        };
        comments.push(newComment);
        plugin.saveData("post_comments", comments);

        // Update comment counter in post if it exists locally
        var posts = plugin.getData("posts") || [];
        for (var i = 0; i < posts.length; i++) {
            if (posts[i].id === postId || posts[i].social_id === postId) {
                posts[i].comment_counter = (posts[i].comment_counter || 0) + 1;
                plugin.saveData("posts", posts);
                break;
            }
        }

        // Also check posts_cache
        var postsCache = plugin.getData("posts_cache") || {};
        for (var cacheKey in postsCache) {
            var cachedPosts = postsCache[cacheKey].data;
            if (cachedPosts && cachedPosts.items) {
                for (var j = 0; j < cachedPosts.items.length; j++) {
                    var cachedPost = cachedPosts.items[j];
                    if (cachedPost.id === postId || cachedPost.social_id === postId) {
                        cachedPost.comment_counter = (cachedPost.comment_counter || 0) + 1;
                        plugin.saveData("posts_cache", postsCache);
                        break;
                    }
                }
            }
        }

        console.log("LinkedIn plugin: Recorded comment on post " + postId);

        return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                object: "CommentSent"
            })
        };
    }

    // Get comments for a post
    var getCommentsMatch = apiPath.match(/\/api\/v1\/posts\/([^\/]+)\/comments$/);
    if (method === "GET" && getCommentsMatch) {
        var postId = getCommentsMatch[1];
        var allComments = plugin.getData("post_comments") || [];
        var postComments = allComments.filter(function(c) {
            return c.post_id === postId;
        });
        return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                object: "CommentList",
                items: postComments
            })
        };
    }

    // Get post
    var postMatch = apiPath.match(/\/api\/v1\/posts\/([^\/]+)$/);
    if (method === "GET" && postMatch) {
        var postId = postMatch[1];
        var posts = plugin.getData("posts") || [];
        var post = posts.find(function(p) { return p.id === postId; });
        if (post) {
            return {
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(post)
            };
        }
        return {
            status: 404,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Post not found" })
        };
    }

    // ===== ACCOUNTS =====

    // List accounts
    if (method === "GET" && apiPath === "/api/v1/accounts") {
        return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                object: "AccountList",
                items: [{
                    object: "Account",
                    id: "mock_account_001",
                    provider: "LINKEDIN",
                    status: "connected",
                    name: "Mock LinkedIn Account"
                }]
            })
        };
    }

    // ===== HOSTED ACCOUNTS =====

    // Handle hosted account link - rewrite api_url to point to Unipile
    if (method === "POST" && apiPath === "/api/v1/hosted/accounts/link") {
        var baseUrl = getUnipileUrl();
        if (!baseUrl) {
            return {
                status: 501,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    error: "Not Implemented",
                    message: "Unipile not configured (missing DNS)"
                })
            };
        }

        // Rewrite api_url to point to actual Unipile API
        var modifiedBody = JSON.parse(JSON.stringify(body));
        if (modifiedBody.api_url) {
            console.log("LinkedIn plugin: Rewriting api_url from " + modifiedBody.api_url + " to " + baseUrl);
            modifiedBody.api_url = baseUrl;
        }

        return proxyToUnipile(method, apiPath, queryParams, modifiedBody);
    }

    // Default: proxy unhandled requests to Unipile
    return proxyToUnipile(method, apiPath, queryParams, body);
};

// Get UI for the plugin dashboard
exports.getUI = function() {
    initializeData();

    var invitesSent = plugin.getData("invitations_sent") || [];
    var messages = plugin.getData("messages") || [];
    var chats = plugin.getData("chats") || {};

    var items = [];

    // Section: Pending Invitations
    var pendingInvites = invitesSent.filter(function(inv) { return inv.status === "pending"; });
    var profilesCache = plugin.getData("profiles_cache") || {};
    if (pendingInvites.length > 0) {
        for (var i = 0; i < pendingInvites.length; i++) {
            var inv = pendingInvites[i];
            var recipientDisplay = inv.recipient_id;
            var recipientName = "";
            var recipientHeadline = "";

            // Try to find cached profile info for this recipient
            var cachedProfile = null;
            for (var cacheKey in profilesCache) {
                var profile = profilesCache[cacheKey].data;
                if (profile && (profile.provider_id === inv.recipient_id || cacheKey === inv.recipient_id)) {
                    cachedProfile = profile;
                    break;
                }
            }

            if (cachedProfile) {
                recipientName = (cachedProfile.first_name || "") + " " + (cachedProfile.last_name || "");
                recipientHeadline = cachedProfile.headline || "";
                recipientDisplay = recipientName.trim() || inv.recipient_id;
            } else if (recipientDisplay && recipientDisplay.startsWith("ACoAA")) {
                // Show a shorter version if it's a provider_id
                recipientDisplay = recipientDisplay.substr(0, 15) + "...";
            }

            var contentText = inv.message ? "Message: " + inv.message : "No message included";
            if (recipientName) {
                contentText += "\nRecipient: " + recipientName;
            }
            if (recipientHeadline) {
                contentText += "\nHeadline: " + recipientHeadline;
            }
            contentText += "\nProvider ID: " + inv.recipient_id;
            if (inv.account_id) {
                contentText += "\nAccount ID: " + inv.account_id;
            }
            items.push({
                id: inv.id,
                title: "Connection Request (Pending)",
                subtitle: "To: " + recipientDisplay + " | Sent: " + inv.sent_at,
                content: contentText,
                actions: [
                    { label: "Mark Accepted", action: "accept_invite" },
                    { label: "Mark Declined", action: "decline_invite" },
                    { label: "Remove", action: "remove_invite" }
                ]
            });
        }
    }

    // Section: Accepted/Declined Invitations (for re-testing)
    var completedInvites = invitesSent.filter(function(inv) { return inv.status === "accepted" || inv.status === "declined"; });
    if (completedInvites.length > 0) {
        for (var i = 0; i < completedInvites.length; i++) {
            var inv = completedInvites[i];
            var recipientDisplay = inv.recipient_id;
            var recipientName = "";

            // Try to find cached profile info for this recipient
            var cachedProfile = null;
            for (var cacheKey in profilesCache) {
                var profile = profilesCache[cacheKey].data;
                if (profile && (profile.provider_id === inv.recipient_id || cacheKey === inv.recipient_id)) {
                    cachedProfile = profile;
                    break;
                }
            }

            if (cachedProfile) {
                recipientName = (cachedProfile.first_name || "") + " " + (cachedProfile.last_name || "");
                recipientDisplay = recipientName.trim() || inv.recipient_id;
            } else if (recipientDisplay && recipientDisplay.startsWith("ACoAA")) {
                recipientDisplay = recipientDisplay.substr(0, 15) + "...";
            }

            var statusLabel = inv.status === "accepted" ? "Accepted" : "Declined";
            items.push({
                id: inv.id,
                title: "Connection Request (" + statusLabel + ")",
                subtitle: "To: " + recipientDisplay + " | " + (inv.updated_at || inv.sent_at),
                content: "Provider ID: " + inv.recipient_id,
                actions: [
                    { label: "Remove", action: "remove_invite" }
                ]
            });
        }
    }

    // Section: Active Chats
    var chatIds = Object.keys(chats);
    if (chatIds.length > 0) {
        for (var i = 0; i < Math.min(chatIds.length, 5); i++) {
            var chat = chats[chatIds[i]];
            var chatMessages = messages.filter(function(m) { return m.chat_id === chat.id; });

            // Show last 3 messages
            var recentMessages = chatMessages.slice(-3);
            var messagesContent = "";
            if (recentMessages.length > 0) {
                for (var j = 0; j < recentMessages.length; j++) {
                    var msg = recentMessages[j];
                    var senderLabel = msg.sender === "self" ? "You" : "Them";
                    if (j > 0) {
                        messagesContent += "\n\n---\n\n";
                    }
                    messagesContent += senderLabel + ": " + msg.text;
                }
            } else {
                messagesContent = "No messages yet";
            }

            // Get attendees for display
            var attendeesList = chat.attendees_ids || chat.attendees || [];
            var attendeeDisplay = attendeesList.join(", ");

            items.push({
                id: "chat_" + chat.id,
                title: "Chat: " + chat.id.substr(0, 12) + "...",
                subtitle: "Attendees: " + attendeeDisplay + " | Messages: " + chatMessages.length,
                content: messagesContent.trim(),
                actions: [
                    { label: "Send Reply", action: "send_chat_reply", hasTextarea: true },
                    { label: "Delete Chat", action: "delete_chat" }
                ]
            });
        }
    }

    // Statistics
    var totalInvites = invitesSent.length;
    var acceptedInvites = invitesSent.filter(function(inv) { return inv.status === "accepted"; }).length;
    var totalMessages = messages.length;
    var approvedMessages = messages.filter(function(m) { return m.status === "approved"; }).length;
    var profilesCache = plugin.getData("profiles_cache") || {};
    var postsCache = plugin.getData("posts_cache") || {};
    var cachedProfiles = Object.keys(profilesCache).length;
    var cachedPosts = Object.keys(postsCache).length;

    // Show configuration status
    var unipileUrl = getUnipileUrl();
    var apiKeyConfigured = getUnipileApiKey() ? "Yes" : "No";
    items.unshift({
        id: "config_status",
        title: "LinkedIn Plugin Configuration",
        subtitle: "Unipile connection and cache settings",
        content: "Unipile DNS: " + (unipileUrl || "Not configured") + "\n" +
                 "API Key configured: " + apiKeyConfigured + "\n" +
                 "Configure via: LINKEDIN_PLUGIN_DNS, LINKEDIN_PLUGIN_API_KEY\n" +
                 "Cached Profiles: " + cachedProfiles + "\n" +
                 "Cached Posts: " + cachedPosts,
        actions: [
            { label: "Clear Cache", action: "clear_cache" }
        ]
    });

    if (totalInvites > 0 || totalMessages > 0 || chatIds.length > 0) {
        items.unshift({
            id: "stats",
            title: "LinkedIn Plugin Statistics",
            subtitle: "Overview of tracked activities",
            content: "Invitations: " + totalInvites + " sent (" + acceptedInvites + " accepted)\n" +
                     "Messages: " + totalMessages + " total (" + approvedMessages + " approved)\n" +
                     "Active Chats: " + chatIds.length,
            actions: []
        });
    }

    if (items.length === 0) {
        items.push({
            id: "empty",
            title: "No Activity Yet",
            subtitle: "LinkedIn plugin is ready",
            content: "The plugin will intercept /linkedin/** requests.\n" +
                     "Send invitations or messages to see them tracked here.",
            actions: []
        });
    }

    return {
        type: "list",
        items: items
    };
    return { success: false, message: "Unknown action: " + action };
};

// Handle actions from the UI
exports.handleAction = function(action, id, data) {
    console.log("LinkedIn plugin action: " + action + " on " + id);

    if (action === "accept_invite" || action === "decline_invite") {
        var invites = plugin.getData("invitations_sent") || [];
        var recipientId = null;
        for (var i = 0; i < invites.length; i++) {
            if (invites[i].id === id) {
                invites[i].status = action === "accept_invite" ? "accepted" : "declined";
                invites[i].updated_at = now();
                recipientId = invites[i].recipient_id;
                break;
            }
        }
        plugin.saveData("invitations_sent", invites);

        return { success: true, message: "Invitation " + (action === "accept_invite" ? "accepted" : "declined") };
    }

    if (action === "remove_invite") {
        var invites = plugin.getData("invitations_sent") || [];
        invites = invites.filter(function(inv) { return inv.id !== id; });
        plugin.saveData("invitations_sent", invites);
        return { success: true, message: "Invitation removed - user can be re-invited" };
    }

    if (action === "approve_message") {
        var messages = plugin.getData("messages") || [];
        for (var i = 0; i < messages.length; i++) {
            if (messages[i].id === id) {
                messages[i].status = "approved";
                messages[i].approved_at = now();
                break;
            }
        }
        plugin.saveData("messages", messages);
        return { success: true, message: "Message approved and sent" };
    }

    if (action === "edit_message") {
        var messages = plugin.getData("messages") || [];
        for (var i = 0; i < messages.length; i++) {
            if (messages[i].id === id) {
                messages[i].text = data.text || messages[i].text;
                messages[i].status = "approved";
                messages[i].approved_at = now();
                break;
            }
        }
        plugin.saveData("messages", messages);
        return { success: true, message: "Message edited and sent" };
    }

    if (action === "discard_message") {
        var messages = plugin.getData("messages") || [];
        messages = messages.filter(function(m) { return m.id !== id; });
        plugin.saveData("messages", messages);
        return { success: true, message: "Message discarded" };
    }

    if (action === "send_chat_reply") {
        // Extract chat_id from id (format: chat_XXXX)
        var chatId = id.replace("chat_", "");
        var messages = plugin.getData("messages") || [];
        var newMessage = {
            id: generateLinkedInId(),
            chat_id: chatId,
            sender: "self",
            text: data.text || "",
            timestamp: now(),
            status: "sent"
        };
        messages.push(newMessage);
        plugin.saveData("messages", messages);
        return { success: true, message: "Reply sent" };
    }

    if (action === "delete_chat") {
        // Extract chat_id from id (format: chat_XXXX)
        var chatId = id.replace("chat_", "");
        var chats = plugin.getData("chats") || {};

        // Delete the chat
        delete chats[chatId];
        plugin.saveData("chats", chats);

        // Also delete all messages for this chat
        var messages = plugin.getData("messages") || [];
        messages = messages.filter(function(m) { return m.chat_id !== chatId; });
        plugin.saveData("messages", messages);

        return { success: true, message: "Chat deleted" };
    }

    if (action === "clear_cache") {
        plugin.saveData("profiles_cache", {});
        plugin.saveData("posts_cache", {});
        return { success: true, message: "Cache cleared successfully" };
    }

    
    if (action === "load_invitations") {
        var invitesSent = plugin.getData("invitations_sent") || [];
        var profilesCache = plugin.getData("profiles_cache") || {};

        // Enrich invitations with profile data
        var enrichedInvitations = invitesSent.map(function(inv) {
            var recipientName = "";
            var recipientHeadline = "";

            // Try to find cached profile info
            for (var cacheKey in profilesCache) {
                var profile = profilesCache[cacheKey].data;
                if (profile && (profile.provider_id === inv.recipient_id || cacheKey === inv.recipient_id)) {
                    recipientName = (profile.first_name || "") + " " + (profile.last_name || "");
                    recipientHeadline = profile.headline || "";
                    break;
                }
            }

            return {
                id: inv.id,
                recipient_id: inv.recipient_id,
                message: inv.message || "",
                status: inv.status,
                sent_at: inv.sent_at,
                recipient_name: recipientName.trim() || null,
                recipient_headline: recipientHeadline || null
            };
        });

        // Calculate stats
        var pending = enrichedInvitations.filter(function(i) { return i.status === "pending"; }).length;
        var accepted = enrichedInvitations.filter(function(i) { return i.status === "accepted"; }).length;
        var declined = enrichedInvitations.filter(function(i) { return i.status === "declined"; }).length;

        return {
            success: true,
            invitations: enrichedInvitations,
            stats: {
                total: enrichedInvitations.length,
                pending: pending,
                accepted: accepted,
                declined: declined
            }
        };
    }


    if (action === "load_user_data") {
        // Aggregate all user data from profiles cache, invitations, messages, and posts
        var profilesCache = plugin.getData("profiles_cache") || {};
        var postsCache = plugin.getData("posts_cache") || {};
        var invitesSent = plugin.getData("invitations_sent") || [];
        var messages = plugin.getData("messages") || [];
        var chats = plugin.getData("chats") || {};
        var reactions = plugin.getData("post_reactions") || [];
        var comments = plugin.getData("post_comments") || [];

        // Build a map of user posts from posts_cache (keyed by user identifier)
        var userPostsMap = {};
        for (var cacheKey in postsCache) {
            var cachedData = postsCache[cacheKey].data;
            if (cachedData && cachedData.items) {
                userPostsMap[cacheKey] = cachedData.items;
            }
        }

        // Extract users from profiles cache
        var users = [];
        for (var cacheKey in profilesCache) {
            var profile = profilesCache[cacheKey].data;
            if (profile) {
                // Determine network distance based on invite status
                var inviteStatus = null;
                for (var i = 0; i < invitesSent.length; i++) {
                    if (invitesSent[i].recipient_id === profile.provider_id) {
                        inviteStatus = invitesSent[i].status;
                        break;
                    }
                }

                profile.network_distance = inviteStatus === "accepted" ? "FIRST_DEGREE" :
                                          inviteStatus === "pending" ? "SECOND_DEGREE" : "THIRD_DEGREE";
                profile.id = profile.provider_id || cacheKey;

                // Attach posts for this user (check by provider_id or cache key)
                var userPosts = userPostsMap[profile.provider_id] || userPostsMap[cacheKey] || [];

                // Helper to check if a reaction/comment post_id matches this post
                function matchesPost(activityPostId, post) {
                    if (!activityPostId) return false;
                    var postId = post.id || "";
                    var socialId = post.social_id || "";

                    // Direct match
                    if (activityPostId === postId || activityPostId === socialId) {
                        return true;
                    }

                    // Extract numeric ID from URN format (e.g., "urn:li:ugcPost:123" -> "123")
                    var activityNumericId = activityPostId.replace(/^urn:li:(ugcPost|activity):/, "");
                    var postNumericId = postId.replace(/^urn:li:(ugcPost|activity):/, "");
                    var socialNumericId = socialId.replace(/^urn:li:(ugcPost|activity):/, "");

                    return activityNumericId === postNumericId ||
                           activityNumericId === socialNumericId ||
                           activityNumericId === postId ||
                           activityPostId === postNumericId;
                }

                // Enrich posts with intercepted reactions and comments
                var enrichedPosts = userPosts.map(function(post) {
                    var postReactions = reactions.filter(function(r) {
                        return matchesPost(r.post_id, post);
                    });
                    var postComments = comments.filter(function(c) {
                        return matchesPost(c.post_id, post);
                    });
                    return {
                        id: post.id,
                        social_id: post.social_id,
                        text: post.text,
                        created_at: post.created_at,
                        reaction_counter: post.reaction_counter || 0,
                        comment_counter: post.comment_counter || 0,
                        intercepted_reactions: postReactions,
                        intercepted_comments: postComments,
                        intercepted_reaction_count: postReactions.length,
                        intercepted_comment_count: postComments.length
                    };
                });

                profile.posts = enrichedPosts;
                users.push(profile);
            }
        }

        // Convert chats object to array
        var chatsArray = [];
        for (var chatId in chats) {
            chatsArray.push(chats[chatId]);
        }

        // Calculate stats
        var connections = users.filter(function(u) { return u.network_distance === "FIRST_DEGREE"; }).length;
        var pendingInvites = invitesSent.filter(function(i) { return i.status === "pending"; }).length;

        return {
            success: true,
            data: {
                users: users,
                invitations: invitesSent,
                messages: messages,
                chats: chatsArray,
                reactions: reactions,
                comments: comments,
                stats: {
                    total_users: users.length,
                    connections: connections,
                    pending_invites: pendingInvites,
                    total_messages: messages.length,
                    total_reactions: reactions.length,
                    total_comments: comments.length
                }
            }
        };
    }

    if (action === "send_message") {
        // id is the user's provider_id or user id
        var userId = id;
        var messageText = data.text || "";
        
        if (!messageText) {
            return { success: false, message: "Message text is required" };
        }
        
        // Get or create chat for this user
        var chats = plugin.getData("chats") || {};
        var chatId = null;
        
        // Find existing chat with this user
        for (var cid in chats) {
            var chat = chats[cid];
            if (chat.attendee_provider_id === userId) {
                chatId = cid;
                break;
            }
        }
        
        // Create new chat if none exists
        if (!chatId) {
            chatId = generateLinkedInId();
            
            // Try to get user name from profiles cache
            var userName = "";
            var profilesCache = plugin.getData("profiles_cache") || {};
            for (var cacheKey in profilesCache) {
                var profile = profilesCache[cacheKey].data;
                if (profile && (profile.provider_id === userId || cacheKey === userId)) {
                    userName = (profile.first_name || "") + " " + (profile.last_name || "");
                    userName = userName.trim();
                    break;
                }
            }
            
            chats[chatId] = {
                object: "Chat",
                id: chatId,
                account_id: "",
                provider_id: chatId,
                attendee_provider_id: userId,
                name: userName,
                type: 0,
                timestamp: now(),
                unread_count: 0
            };
            plugin.saveData("chats", chats);
        }
        
        // Add message
        var messages = plugin.getData("messages") || [];
        var messageId = generateLinkedInId();

        messages.push({
            object: "Message",
            provider_id: messageId,
            sender_id: userId,
            text: messageText,
            attachments: [],
            id: messageId,
            account_id: "",
            chat_id: chatId,
            chat_provider_id: chatId,
            timestamp: now(),
            is_sender: 0,
            quoted: null,
            reactions: [],
            seen: 0,
            seen_by: {},
            hidden: 0,
            deleted: 0,
            edited: 0,
            is_event: 0,
            delivered: 0,
            behavior: 0,
            event_type: 0,
            original: "",
            replies: 0,
            reply_by: [],
            parent: "",
            sender_attendee_id: "",
            subject: "",
            message_type: "MESSAGE",
            attendee_type: "MEMBER",
            attendee_distance: 1,
            sender_urn: "",
            reply_to: null
        });

        plugin.saveData("messages", messages);
        
        return {
            success: true,
            message: "Message sent",
            message_id: messageId,
            chat_id: chatId
        };
    }

    if (action === "delete_user_data") {
        // id is the user's provider_id
        var providerId = id;
        var fullDelete = data.fullDelete || false;

        var deletedCounts = {
            invitations: 0,
            chats: 0,
            messages: 0,
            profile: 0,
            posts: 0,
            reactions: 0,
            comments: 0
        };

        // 1. Delete invitations
        var invites = plugin.getData("invitations_sent") || [];
        var beforeInvites = invites.length;
        invites = invites.filter(function(inv) {
            return inv.recipient_id !== providerId;
        });
        deletedCounts.invitations = beforeInvites - invites.length;
        plugin.saveData("invitations_sent", invites);

        // 2. Delete chats and collect chat IDs
        var chats = plugin.getData("chats") || {};
        var chatIdsToDelete = [];

        for (var chatId in chats) {
            if (chats[chatId].attendee_provider_id === providerId) {
                chatIdsToDelete.push(chatId);
                delete chats[chatId];
                deletedCounts.chats++;
            }
        }
        plugin.saveData("chats", chats);

        // 3. Delete messages for those chats
        var messages = plugin.getData("messages") || [];
        var beforeMessages = messages.length;
        messages = messages.filter(function(msg) {
            return chatIdsToDelete.indexOf(msg.chat_id) === -1;
        });
        deletedCounts.messages = beforeMessages - messages.length;
        plugin.saveData("messages", messages);

        // 4. Delete posts cache and collect post IDs for this user
        var postsCache = plugin.getData("posts_cache") || {};
        var postIdsToDelete = [];

        if (postsCache[providerId]) {
            var userPosts = postsCache[providerId].data?.items || [];
            userPosts.forEach(function(post) {
                if (post.id) postIdsToDelete.push(post.id);
                if (post.social_id) postIdsToDelete.push(post.social_id);
            });
            deletedCounts.posts = userPosts.length;
            delete postsCache[providerId];
            plugin.saveData("posts_cache", postsCache);
        }

        // 5. Delete reactions on those posts
        if (postIdsToDelete.length > 0) {
            var reactions = plugin.getData("post_reactions") || [];
            var beforeReactions = reactions.length;
            reactions = reactions.filter(function(r) {
                // Check if reaction's post_id matches any of the deleted posts
                var postId = r.post_id || "";
                var numericId = postId.replace(/^urn:li:(ugcPost|activity):/, "");
                return !postIdsToDelete.some(function(pid) {
                    var pidNumeric = pid.replace(/^urn:li:(ugcPost|activity):/, "");
                    return postId === pid || numericId === pid || postId === pidNumeric || numericId === pidNumeric;
                });
            });
            deletedCounts.reactions = beforeReactions - reactions.length;
            plugin.saveData("post_reactions", reactions);

            // 6. Delete comments on those posts
            var comments = plugin.getData("post_comments") || [];
            var beforeComments = comments.length;
            comments = comments.filter(function(c) {
                var postId = c.post_id || "";
                var numericId = postId.replace(/^urn:li:(ugcPost|activity):/, "");
                return !postIdsToDelete.some(function(pid) {
                    var pidNumeric = pid.replace(/^urn:li:(ugcPost|activity):/, "");
                    return postId === pid || numericId === pid || postId === pidNumeric || numericId === pidNumeric;
                });
            });
            deletedCounts.comments = beforeComments - comments.length;
            plugin.saveData("post_comments", comments);
        }

        // 7. Delete cached profile (only if fullDelete is true)
        if (fullDelete) {
            var cache = plugin.getData("profiles_cache") || {};

            // Delete by direct key match
            if (cache[providerId]) {
                delete cache[providerId];
                deletedCounts.profile++;
            }

            // Delete by searching provider_id inside cached data
            for (var cacheKey in cache) {
                if (cache[cacheKey].data &&
                    cache[cacheKey].data.provider_id === providerId) {
                    delete cache[cacheKey];
                    deletedCounts.profile++;
                }
            }

            plugin.saveData("profiles_cache", cache);
        }

        return {
            success: true,
            message: fullDelete ? "User fully deleted" : "User data deleted (profile cached)",
            deleted: deletedCounts
        };
    }

    if (action === "load_posts_data") {
        // Aggregate all posts from cache and local storage
        var postsCache = plugin.getData("posts_cache") || {};
        var localPosts = plugin.getData("posts") || [];
        var reactions = plugin.getData("post_reactions") || [];
        var comments = plugin.getData("post_comments") || [];
        var profilesCache = plugin.getData("profiles_cache") || {};

        // Collect all posts from cache
        var allPosts = [];
        for (var cacheKey in postsCache) {
            var cachedData = postsCache[cacheKey].data;
            if (cachedData && cachedData.items) {
                for (var i = 0; i < cachedData.items.length; i++) {
                    var post = cachedData.items[i];
                    // Avoid duplicates by checking id
                    var exists = allPosts.some(function(p) {
                        return p.id === post.id || p.social_id === post.social_id;
                    });
                    if (!exists) {
                        // Get author info from profiles cache
                        var authorName = "";
                        var authorHeadline = "";
                        if (post.author_id) {
                            for (var profileKey in profilesCache) {
                                var profile = profilesCache[profileKey].data;
                                if (profile && (profile.provider_id === post.author_id || profileKey === post.author_id)) {
                                    authorName = (profile.first_name || "") + " " + (profile.last_name || "");
                                    authorHeadline = profile.headline || "";
                                    break;
                                }
                            }
                        }
                        post.author_name = authorName.trim() || null;
                        post.author_headline = authorHeadline || null;
                        allPosts.push(post);
                    }
                }
            }
        }

        // Add local posts that aren't already included
        for (var j = 0; j < localPosts.length; j++) {
            var localPost = localPosts[j];
            var alreadyIncluded = allPosts.some(function(p) {
                return p.id === localPost.id || p.social_id === localPost.social_id;
            });
            if (!alreadyIncluded) {
                allPosts.push(localPost);
            }
        }

        // Enrich posts with reaction and comment counts from intercepted data
        for (var k = 0; k < allPosts.length; k++) {
            var post = allPosts[k];
            var postId = post.id || post.social_id;

            // Count intercepted reactions
            var interceptedReactions = reactions.filter(function(r) {
                return r.post_id === postId || r.post_id === post.social_id;
            });

            // Count intercepted comments
            var interceptedComments = comments.filter(function(c) {
                return c.post_id === postId || c.post_id === post.social_id;
            });

            post.intercepted_reactions = interceptedReactions;
            post.intercepted_comments = interceptedComments;
            post.intercepted_reaction_count = interceptedReactions.length;
            post.intercepted_comment_count = interceptedComments.length;
        }

        // Sort by created_at descending
        allPosts.sort(function(a, b) {
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        });

        // Calculate stats
        var totalReactions = reactions.length;
        var totalComments = comments.length;
        var postsWithActivity = allPosts.filter(function(p) {
            return p.intercepted_reaction_count > 0 || p.intercepted_comment_count > 0;
        }).length;

        return {
            success: true,
            data: {
                posts: allPosts,
                reactions: reactions,
                comments: comments,
                stats: {
                    total_posts: allPosts.length,
                    total_reactions: totalReactions,
                    total_comments: totalComments,
                    posts_with_activity: postsWithActivity
                }
            }
        };
    }

    if (action === "delete_reaction") {
        var reactions = plugin.getData("post_reactions") || [];
        reactions = reactions.filter(function(r) { return r.id !== id; });
        plugin.saveData("post_reactions", reactions);
        return { success: true, message: "Reaction deleted" };
    }

    if (action === "delete_comment") {
        var comments = plugin.getData("post_comments") || [];
        comments = comments.filter(function(c) { return c.id !== id; });
        plugin.saveData("post_comments", comments);
        return { success: true, message: "Comment deleted" };
    }

    if (action === "clear_posts_cache") {
        plugin.saveData("posts_cache", {});
        plugin.saveData("posts", []);
        plugin.saveData("post_reactions", []);
        plugin.saveData("post_comments", []);
        return { success: true, message: "Posts cache and activity cleared" };
    }

    return { success: false, message: "Unknown action: " + action };
};

