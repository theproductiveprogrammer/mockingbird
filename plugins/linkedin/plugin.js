// LinkedIn Plugin - Full Implementation
exports.name = "linkedin";
exports.version = "2.0";
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
        plugin.saveData("initialized", true);
    }
}

// Handle incoming requests
exports.handleRequest = function(ctx) {
    initializeData();

    var path = ctx.path;
    var method = ctx.method;
    var body = ctx.body || {};

    console.log("LinkedIn plugin: " + method + " " + path);

    // Remove /linkedin prefix if present
    var apiPath = path.replace(/^\/linkedin/, "");

    // ===== INVITATIONS =====

    // Send invitation
    if (method === "POST" && (apiPath.match(/\/api\/v1\/users\/invitations?$/) || apiPath.match(/\/api\/v1\/users\/invite$/))) {
        var invitation = {
            id: generateId("inv"),
            invitation_id: Date.now().toString(),
            recipient_id: body.identifier || body.to || "unknown",
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

        var newChat = {
            id: chatId,
            attendees: body.attendees_ids || [body.attendee_id || "unknown"],
            created_at: now(),
            last_message_at: now()
        };
        chats[chatId] = newChat;
        plugin.saveData("chats", chats);

        // If there's an initial message, save it
        if (body.text) {
            var messages = plugin.getData("messages") || [];
            messages.push({
                id: messageId,
                chat_id: chatId,
                sender: "self",
                text: body.text,
                timestamp: now()
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
            return {
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(chat)
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

    // Send message
    if (method === "POST" && apiPath === "/api/v1/messages") {
        var messageId = generateLinkedInId();
        var messages = plugin.getData("messages") || [];
        var newMessage = {
            id: messageId,
            chat_id: body.chat_id,
            sender: "self",
            text: body.text || "",
            timestamp: now(),
            status: "pending_review"
        };
        messages.push(newMessage);
        plugin.saveData("messages", messages);

        return {
            status: 201,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                object: "MessageSent",
                message_id: messageId,
                chat_id: body.chat_id
            })
        };
    }

    // List all messages
    if (method === "GET" && apiPath === "/api/v1/messages") {
        var allMessages = plugin.getData("messages") || [];
        return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                object: "MessageList",
                items: allMessages.slice(-100).reverse() // Last 100, most recent first
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

    // Default: return null to pass through to rules
    return null;
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
    if (pendingInvites.length > 0) {
        for (var i = 0; i < pendingInvites.length; i++) {
            var inv = pendingInvites[i];
            items.push({
                id: inv.id,
                title: "Connection Request (Pending)",
                subtitle: "To: " + inv.recipient_id + " | Sent: " + inv.sent_at,
                content: inv.message ? "Message: " + inv.message : "No message included",
                actions: [
                    { label: "Mark Accepted", action: "accept_invite" },
                    { label: "Mark Declined", action: "decline_invite" }
                ]
            });
        }
    }

    // Section: Messages pending review
    var pendingMessages = messages.filter(function(m) { return m.status === "pending_review"; });
    if (pendingMessages.length > 0) {
        for (var i = 0; i < pendingMessages.length; i++) {
            var msg = pendingMessages[i];
            items.push({
                id: msg.id,
                title: "Message Pending Review",
                subtitle: "Chat: " + msg.chat_id + " | " + msg.timestamp,
                content: msg.text,
                actions: [
                    { label: "Approve & Send", action: "approve_message" },
                    { label: "Edit & Send", action: "edit_message", hasTextarea: true },
                    { label: "Discard", action: "discard_message" }
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
            var lastMessage = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1] : null;

            items.push({
                id: "chat_" + chat.id,
                title: "Chat: " + chat.id.substr(0, 12) + "...",
                subtitle: "Attendees: " + (chat.attendees || []).join(", ") + " | Messages: " + chatMessages.length,
                content: lastMessage ? "Last message: " + lastMessage.text : "No messages yet",
                actions: [
                    { label: "Send Reply", action: "send_chat_reply", hasTextarea: true }
                ]
            });
        }
    }

    // Statistics
    var totalInvites = invitesSent.length;
    var acceptedInvites = invitesSent.filter(function(inv) { return inv.status === "accepted"; }).length;
    var totalMessages = messages.length;
    var approvedMessages = messages.filter(function(m) { return m.status === "approved"; }).length;

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
};

// Handle actions from the UI
exports.handleAction = function(action, id, data) {
    console.log("LinkedIn plugin action: " + action + " on " + id);

    if (action === "accept_invite" || action === "decline_invite") {
        var invites = plugin.getData("invitations_sent") || [];
        for (var i = 0; i < invites.length; i++) {
            if (invites[i].id === id) {
                invites[i].status = action === "accept_invite" ? "accepted" : "declined";
                invites[i].updated_at = now();
                break;
            }
        }
        plugin.saveData("invitations_sent", invites);
        return { success: true, message: "Invitation " + (action === "accept_invite" ? "accepted" : "declined") };
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
            status: "pending_review"
        };
        messages.push(newMessage);
        plugin.saveData("messages", messages);
        return { success: true, message: "Reply added (pending review)" };
    }

    return { success: false, message: "Unknown action: " + action };
};
