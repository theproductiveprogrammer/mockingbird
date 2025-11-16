// Email Plugin - Mailpit Integration
exports.name = "email";
exports.version = "1.0";
exports.routes = []; // No routes to intercept - this is a UI-only plugin
exports.config_env = "EMAIL_PLUGIN_";

// Helper to get Mailpit API URL
function getMailpitUrl() {
    var host = plugin.getConfig("HOST") || "localhost";
    var port = plugin.getConfig("PORT") || "8025";
    return "http://" + host + ":" + port;
}

// Helper to generate unique IDs
function generateId(prefix) {
    return prefix + "_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

// Helper to get current ISO timestamp
function now() {
    return new Date().toISOString();
}

// Fetch emails from Mailpit
function fetchEmails() {
    var url = getMailpitUrl() + "/api/v1/messages";
    var result = plugin.httpRequest("GET", url, {}, null);

    if (result.error) {
        console.log("Failed to fetch emails: " + result.error);
        return [];
    }

    if (result.status !== 200) {
        console.log("Mailpit returned status: " + result.status);
        return [];
    }

    var body = result.body;
    if (body && body.messages) {
        return body.messages;
    }

    return [];
}

// Fetch single email details
function fetchEmailDetails(messageId) {
    var url = getMailpitUrl() + "/api/v1/message/" + messageId;
    var result = plugin.httpRequest("GET", url, {}, null);

    if (result.error || result.status !== 200) {
        return null;
    }

    return result.body;
}

// Send reply email via Mailpit
function sendReply(originalEmail, replyText) {
    var url = getMailpitUrl() + "/api/v1/send";

    // Build reply email with proper headers
    var replyEmail = {
        From: {
            Email: plugin.getConfig("FROM_EMAIL") || "mockingbird@localhost",
            Name: plugin.getConfig("FROM_NAME") || "Mockingbird"
        },
        To: [{
            Email: originalEmail.From.Address,
            Name: originalEmail.From.Name || originalEmail.From.Address
        }],
        Subject: "Re: " + originalEmail.Subject.replace(/^Re:\s*/i, ""),
        Text: replyText + "\n\n---\nOn " + originalEmail.Date + ", " + (originalEmail.From.Name || originalEmail.From.Address) + " wrote:\n" + originalEmail.Text,
        Headers: {
            "In-Reply-To": originalEmail.MessageID,
            "References": originalEmail.MessageID
        }
    };

    var result = plugin.httpRequest("POST", url, {
        "Content-Type": "application/json"
    }, replyEmail);

    if (result.error) {
        return { success: false, message: "Failed to send: " + result.error };
    }

    if (result.status === 200 || result.status === 201) {
        return { success: true, message: "Reply sent successfully" };
    }

    return { success: false, message: "Send failed with status: " + result.status };
}

// No request handling needed - this is a UI-only plugin
exports.handleRequest = function(ctx) {
    return null;
};

// Get UI for the plugin dashboard
exports.getUI = function() {
    var items = [];

    // Get config info
    var mailpitUrl = getMailpitUrl();
    var configuredHost = plugin.getConfig("HOST") || "localhost";
    var configuredPort = plugin.getConfig("PORT") || "8025";

    // Fetch emails from Mailpit
    var emails = fetchEmails();
    var sentReplies = plugin.getData("sent_replies") || [];

    // Show configuration status
    items.push({
        id: "config_status",
        title: "Email Plugin Configuration",
        subtitle: "Mailpit connection settings",
        content: "Mailpit URL: " + mailpitUrl + "\n" +
                 "Configure via: EMAIL_PLUGIN_HOST, EMAIL_PLUGIN_PORT\n" +
                 "From Email: " + (plugin.getConfig("FROM_EMAIL") || "mockingbird@localhost") + "\n" +
                 "Emails found: " + emails.length + "\n" +
                 "Replies sent: " + sentReplies.length,
        actions: [
            { label: "Refresh", action: "refresh_emails" }
        ]
    });

    // Show recent emails
    if (emails.length === 0) {
        items.push({
            id: "no_emails",
            title: "No Emails Found",
            subtitle: "Mailpit inbox is empty or not accessible",
            content: "Make sure Mailpit is running and accessible at " + mailpitUrl + "\n" +
                     "Check your EMAIL_PLUGIN_HOST and EMAIL_PLUGIN_PORT config values.",
            actions: []
        });
    } else {
        // Show first 10 emails
        var maxEmails = Math.min(emails.length, 10);
        for (var i = 0; i < maxEmails; i++) {
            var email = emails[i];
            var fromStr = email.From ? (email.From.Name || email.From.Address || "Unknown") : "Unknown";
            var subject = email.Subject || "(No Subject)";
            var snippet = email.Snippet || "";

            // Check if we've replied to this email
            var hasReplied = sentReplies.some(function(reply) {
                return reply.message_id === email.ID;
            });

            var statusLabel = hasReplied ? " [REPLIED]" : "";

            items.push({
                id: "email_" + email.ID,
                title: subject + statusLabel,
                subtitle: "From: " + fromStr + " | " + email.Date,
                content: snippet.substring(0, 500) + (snippet.length > 500 ? "..." : ""),
                actions: hasReplied ? [
                    { label: "View Details", action: "view_email" }
                ] : [
                    { label: "Reply", action: "reply_email", hasTextarea: true },
                    { label: "View Details", action: "view_email" }
                ]
            });
        }

        if (emails.length > maxEmails) {
            items.push({
                id: "more_emails",
                title: "More Emails Available",
                subtitle: "Showing " + maxEmails + " of " + emails.length + " emails",
                content: "Additional emails are available in Mailpit",
                actions: []
            });
        }
    }

    return {
        type: "list",
        items: items
    };
};

// Handle actions from the UI
exports.handleAction = function(action, id, data) {
    console.log("Email plugin action: " + action + " on " + id);

    if (action === "refresh_emails") {
        // Just reload - getUI will fetch fresh data
        return { success: true, message: "Emails refreshed" };
    }

    if (action === "view_email") {
        // Extract message ID from id (format: email_XXXX)
        var messageId = id.replace("email_", "");
        var emailDetails = fetchEmailDetails(messageId);

        if (!emailDetails) {
            return { success: false, message: "Failed to fetch email details" };
        }

        // Store in data for potential future use
        var viewedEmails = plugin.getData("viewed_emails") || [];
        viewedEmails.push({
            id: messageId,
            viewed_at: now(),
            subject: emailDetails.Subject
        });
        plugin.saveData("viewed_emails", viewedEmails);

        return {
            success: true,
            message: "Email details loaded",
            data: {
                subject: emailDetails.Subject,
                from: emailDetails.From,
                to: emailDetails.To,
                date: emailDetails.Date,
                text: emailDetails.Text,
                html: emailDetails.HTML
            }
        };
    }

    if (action === "reply_email") {
        if (!data.text || data.text.trim() === "") {
            return { success: false, message: "Reply text cannot be empty" };
        }

        // Extract message ID from id (format: email_XXXX)
        var messageId = id.replace("email_", "");
        var emailDetails = fetchEmailDetails(messageId);

        if (!emailDetails) {
            return { success: false, message: "Failed to fetch email for reply" };
        }

        // Send the reply
        var sendResult = sendReply(emailDetails, data.text);

        if (sendResult.success) {
            // Track the reply
            var sentReplies = plugin.getData("sent_replies") || [];
            sentReplies.push({
                id: generateId("reply"),
                message_id: messageId,
                original_subject: emailDetails.Subject,
                original_from: emailDetails.From.Address,
                reply_text: data.text,
                sent_at: now()
            });
            plugin.saveData("sent_replies", sentReplies);
        }

        return sendResult;
    }

    return { success: false, message: "Unknown action: " + action };
};
