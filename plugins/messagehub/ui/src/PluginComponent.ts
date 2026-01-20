import { LitElement, html, css } from 'lit';

// Color schemes
const COLORS = {
  // LinkedIn colors
  linkedinPrimary: '#0A66C2',
  linkedinPrimaryDark: '#004182',
  // WhatsApp colors
  whatsappPrimary: '#25D366',
  whatsappPrimaryDark: '#128C7E',
  whatsappLight: '#DCF8C6',
  // Common colors
  background: '#F3F2EF',
  white: '#FFFFFF',
  border: '#E0DFDC',
  textPrimary: '#000000',
  textSecondary: '#666666',
  success: '#057642',
  warning: '#F5C75D',
  danger: '#CC1016',
};

// LinkedIn interfaces
interface User {
  id: string;
  provider_id: string;
  public_identifier?: string;
  first_name: string;
  last_name: string;
  headline?: string;
  location?: string;
  profile_picture_url?: string;
  follower_count?: number;
  connections_count?: number;
  network_distance?: string;
  posts?: Post[];
}

interface Invitation {
  id: string;
  recipient_id: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  sent_at: string;
}

interface Message {
  id: string;
  chat_id: string;
  text: string;
  sender: string;
  timestamp: string;
  is_sender?: number;
}

interface Chat {
  id: string;
  attendee_provider_id: string;
  name?: string;
  timestamp: string;
}

interface Reaction {
  id: string;
  post_id: string;
  account_id: string;
  reaction_type: string;
  created_at: string;
}

interface Comment {
  id: string;
  post_id: string;
  account_id: string;
  text: string;
  created_at: string;
}

interface Post {
  id: string;
  social_id?: string;
  text: string;
  author_id?: string;
  author_name?: string;
  author_headline?: string;
  created_at: string;
  reaction_counter?: number;
  comment_counter?: number;
  repost_counter?: number;
  intercepted_reactions?: Reaction[];
  intercepted_comments?: Comment[];
  intercepted_reaction_count?: number;
  intercepted_comment_count?: number;
}

interface UserData {
  users: User[];
  invitations: Invitation[];
  messages: Message[];
  chats: Chat[];
  reactions: Reaction[];
  comments: Comment[];
  stats: {
    total_users: number;
    connections: number;
    pending_invites: number;
    total_messages: number;
    total_reactions: number;
    total_comments: number;
  };
}

// WhatsApp interfaces
interface WhatsAppContact {
  phone: string;
  name: string;
  created_at: string;
}

interface WhatsAppChat {
  id: string;
  contact_phone: string;
  name: string;
  timestamp: string;
  message_count?: number;
  last_message?: WhatsAppMessage | null;
}

interface WhatsAppMessage {
  id: string;
  chat_id: string;
  text: string;
  is_sender: number;
  timestamp: string;
  sender_id?: string;
}

interface WhatsAppData {
  contacts: WhatsAppContact[];
  chats: WhatsAppChat[];
  messages: WhatsAppMessage[];
  stats: {
    total_contacts: number;
    total_chats: number;
    total_messages: number;
  };
}

interface PluginAPI {
  workspace: string;
  action: (action: string, id: string, data?: Record<string, unknown>) => Promise<unknown>;
  refresh: () => void;
}


export class MessageHubPlugin extends LitElement {
  static properties = {
    api: { type: Object },
    activeTab: { type: String, state: true },
    // LinkedIn state
    userData: { type: Object, state: true },
    selectedUserId: { type: String, state: true },
    expandedPostId: { type: String, state: true },
    showAllUsers: { type: Boolean, state: true },
    deleteFullCache: { type: Boolean, state: true },
    // WhatsApp state
    whatsappData: { type: Object, state: true },
    selectedChatId: { type: String, state: true },
    newContactPhone: { type: String, state: true },
    newContactName: { type: String, state: true },
    // Common state
    loading: { type: Boolean, state: true },
    error: { type: String, state: true },
    messageText: { type: String, state: true },
    sending: { type: Boolean, state: true },
    deleting: { type: Boolean, state: true },
  };

  api!: PluginAPI;
  activeTab: 'linkedin' | 'whatsapp' = 'linkedin';

  // LinkedIn state
  userData: UserData | null = null;
  selectedUserId: string | null = null;
  expandedPostId: string | null = null;
  showAllUsers = false;
  deleteFullCache = false;

  // WhatsApp state
  whatsappData: WhatsAppData | null = null;
  selectedChatId: string | null = null;
  newContactPhone = '';
  newContactName = '';

  // Common state
  loading = true;
  error: string | null = null;
  messageText = '';
  sending = false;
  deleting = false;

  static styles = css`
    :host {
      display: block;
      font-family: -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #F3F2EF;
    }

    .container { padding: 1.5rem; min-height: 600px; }
    .header { background: #FFFFFF; border: 1px solid #E0DFDC; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .header h1 { margin: 0 0 0.5rem 0; font-size: 1.5rem; color: #000000; font-weight: 600; }
    .header p { margin: 0; font-size: 0.875rem; color: #666666; }

    /* Tab styles */
    .tabs { display: flex; gap: 0; margin-bottom: 1.5rem; background: #FFFFFF; border-radius: 8px; border: 1px solid #E0DFDC; overflow: hidden; }
    .tab { flex: 1; padding: 1rem; text-align: center; cursor: pointer; font-weight: 600; font-size: 0.875rem; color: #666666; border: none; background: transparent; transition: all 0.2s; }
    .tab:hover { background: #F3F2EF; }
    .tab.active.linkedin { background: #0A66C2; color: white; }
    .tab.active.whatsapp { background: #25D366; color: white; }

    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: #FFFFFF; border: 1px solid #E0DFDC; border-radius: 8px; padding: 1rem; }
    .stat-label { font-size: 0.75rem; color: #666666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem; }
    .stat-value { font-size: 1.5rem; font-weight: 600; color: #000000; }

    .main-content { display: grid; grid-template-columns: 300px 1fr; gap: 1.5rem; }

    .user-list, .chat-list { background: #FFFFFF; border: 1px solid #E0DFDC; border-radius: 8px; max-height: 600px; overflow-y: auto; }
    .user-list-header, .chat-list-header { padding: 1rem; border-bottom: 1px solid #E0DFDC; background: #F3F2EF; font-weight: 600; font-size: 0.875rem; color: #000000; }

    .user-item, .chat-item { padding: 1rem; border-bottom: 1px solid #E0DFDC; cursor: pointer; transition: background 0.2s; }
    .user-item:hover, .chat-item:hover { background: #F3F2EF; }
    .user-item.selected { background: #E7F3FF; border-left: 3px solid #0A66C2; }
    .chat-item.selected { background: #DCF8C6; border-left: 3px solid #25D366; }
    .user-name, .chat-name { font-weight: 600; color: #000000; font-size: 0.875rem; margin-bottom: 0.25rem; }
    .user-headline, .chat-phone { font-size: 0.75rem; color: #666666; margin-bottom: 0.25rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .user-location { font-size: 0.75rem; color: #666666; display: flex; align-items: center; gap: 0.25rem; }
    .chat-preview { font-size: 0.75rem; color: #999999; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .user-detail, .chat-detail { background: #FFFFFF; border: 1px solid #E0DFDC; border-radius: 8px; padding: 1.5rem; }
    .profile-header { display: flex; gap: 1rem; padding-bottom: 1.5rem; border-bottom: 1px solid #E0DFDC; margin-bottom: 1.5rem; }
    .profile-avatar { width: 80px; height: 80px; border-radius: 50%; background: #F3F2EF; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 600; color: #0A66C2; }
    .profile-avatar.whatsapp { color: #25D366; }
    .profile-info { flex: 1; }
    .profile-name { font-size: 1.5rem; font-weight: 600; color: #000000; margin: 0 0 0.25rem 0; }
    .profile-headline { font-size: 1rem; color: #666666; margin: 0 0 0.5rem 0; }
    .profile-meta { display: flex; gap: 1rem; font-size: 0.875rem; color: #666666; }

    .section { margin-bottom: 1.5rem; }
    .section-title { font-size: 1rem; font-weight: 600; color: #000000; margin: 0 0 1rem 0; }

    .invitation-card { background: #FFF9E6; border: 1px solid #F5C75D; border-radius: 8px; padding: 1rem; }
    .invitation-message { font-size: 0.875rem; color: #666666; margin-bottom: 0.75rem; font-style: italic; }
    .invitation-actions { display: flex; gap: 0.5rem; }

    .messages-container { background: #F3F2EF; border-radius: 8px; padding: 1rem; max-height: 300px; overflow-y: auto; margin-bottom: 1rem; }
    .messages-container.whatsapp { background: #ECE5DD; }
    .message { background: #FFFFFF; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.5rem; border-left: 3px solid #E0DFDC; }
    .message.sent { border-left-color: #0A66C2; background: #E7F3FF; }
    .message.received { border-left-color: #057642; background: #F0FFF4; }
    .message.wa-sent { border-left: none; background: #DCF8C6; margin-left: 2rem; border-radius: 8px 0 8px 8px; }
    .message.wa-received { border-left: none; background: #FFFFFF; margin-right: 2rem; border-radius: 0 8px 8px 8px; }
    .message-meta { font-size: 0.75rem; color: #666666; margin-bottom: 0.25rem; }
    .message-text { font-size: 0.875rem; color: #000000; }
    .message-time { font-size: 0.625rem; color: #999999; text-align: right; margin-top: 0.25rem; }

    .message-form { display: flex; flex-direction: column; gap: 0.75rem; }
    .message-form textarea { padding: 0.75rem; font-size: 0.875rem; border: 1px solid #E0DFDC; border-radius: 8px; font-family: inherit; resize: vertical; }
    .message-form textarea:focus { outline: none; border-color: #0A66C2; }
    .message-form.whatsapp textarea:focus { border-color: #25D366; }

    .new-contact-form { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .new-contact-form input { padding: 0.5rem; font-size: 0.875rem; border: 1px solid #E0DFDC; border-radius: 4px; font-family: inherit; }
    .new-contact-form input:focus { outline: none; border-color: #25D366; }

    button { padding: 0.5rem 1rem; font-size: 0.875rem; border: none; border-radius: 24px; cursor: pointer; font-family: inherit; font-weight: 600; transition: all 0.2s; }
    button.primary { background: #0A66C2; color: white; }
    button.primary:hover { background: #004182; }
    button.primary:disabled { opacity: 0.5; cursor: not-allowed; }
    button.primary.whatsapp { background: #25D366; }
    button.primary.whatsapp:hover { background: #128C7E; }
    button.secondary { background: #FFFFFF; color: #0A66C2; border: 1px solid #0A66C2; }
    button.secondary:hover { background: #E7F3FF; }
    button.secondary.whatsapp { color: #25D366; border-color: #25D366; }
    button.secondary.whatsapp:hover { background: #DCF8C6; }
    button.success { background: #057642; color: white; }
    button.success:hover { background: #045A32; }
    button.danger { background: #CC1016; color: white; }
    button.danger:hover { background: #A00D12; }

    .loading, .error, .empty { text-align: center; padding: 3rem 1.5rem; background: #FFFFFF; border-radius: 8px; }
    .error { background: #FEF2F2; border: 1px solid #FCA5A5; }
    .error h3 { font-size: 1rem; font-weight: 600; color: #991B1B; margin: 0 0 0.5rem 0; }
    .error p { font-size: 0.875rem; color: #B91C1C; margin: 0 0 1rem 0; }
    .empty h3 { font-size: 1rem; color: #666666; margin: 0; }

    /* Posts */
    .post-item { padding: 1rem; border-bottom: 1px solid #E0DFDC; cursor: pointer; transition: background 0.2s; }
    .post-item:hover { background: #F3F2EF; }
    .post-item.selected { background: #E7F3FF; border-left: 3px solid #0A66C2; }
    .post-text { font-size: 0.875rem; color: #000000; margin-bottom: 0.5rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .post-meta { font-size: 0.75rem; color: #666666; display: flex; gap: 1rem; align-items: center; }
    .post-stats { display: flex; gap: 0.75rem; }
    .post-stat { display: flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; }
    .post-stat.reactions { color: #0A66C2; }
    .post-stat.comments { color: #057642; }

    .activity-card { background: #F3F2EF; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.5rem; }
    .activity-card.reaction { border-left: 3px solid #0A66C2; }
    .activity-card.comment { border-left: 3px solid #057642; }
    .activity-type { font-size: 0.75rem; font-weight: 600; color: #666666; margin-bottom: 0.25rem; text-transform: uppercase; }
    .activity-text { font-size: 0.875rem; color: #000000; }
    .activity-meta { font-size: 0.75rem; color: #999999; margin-top: 0.25rem; }
  `;

  firstUpdated() {
    console.log('[MessageHub Plugin] firstUpdated called, api:', this.api);
    this.loadData();
  }

  async loadData() {
    console.log('[MessageHub Plugin] loadData called');
    if (!this.api) {
      console.error('[MessageHub Plugin] API not initialized');
      this.error = 'API not initialized';
      this.loading = false;
      this.requestUpdate();
      return;
    }

    try {
      this.loading = true;
      this.error = null;

      // Load both LinkedIn and WhatsApp data in parallel
      const [linkedinResult, whatsappResult]: any[] = await Promise.all([
        this.api.action('load_user_data', 'all'),
        this.api.action('load_whatsapp_data', 'all'),
      ]);

      console.log('[MessageHub Plugin] LinkedIn result:', linkedinResult);
      console.log('[MessageHub Plugin] WhatsApp result:', whatsappResult);

      if (linkedinResult.success) {
        this.userData = linkedinResult.result?.data || linkedinResult.data;
      }

      if (whatsappResult.success) {
        this.whatsappData = whatsappResult.result?.data || whatsappResult.data;
      }
    } catch (err) {
      console.error('[MessageHub Plugin] Error:', err);
      this.error = err instanceof Error ? err.message : 'Failed to load data';
    } finally {
      this.loading = false;
      this.requestUpdate();
    }
  }

  // LinkedIn handlers
  async handleInviteAction(inviteId: string, action: string) {
    try {
      const result: any = await this.api.action(action, inviteId);
      if (result.success) {
        await this.loadData();
      } else {
        alert(result.message || 'Action failed');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    }
  }

  async handleSendMessage(userId: string) {
    if (!this.messageText.trim()) return;

    try {
      this.sending = true;
      const result: any = await this.api.action('send_message', userId, {
        text: this.messageText,
      });

      if (result.success) {
        this.messageText = '';
        await this.loadData();
      } else {
        alert(result.message || 'Failed to send message');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      this.sending = false;
    }
  }

  async handleDeleteUser(userId: string, userName: string) {
    const deleteType = this.deleteFullCache ? 'full delete (including cache)' : 'delete data (keep cache)';
    const confirmMessage = `Are you sure you want to ${deleteType} for ${userName}?\n\nThis will remove:\n- Invitations\n- Messages\n- Chats${this.deleteFullCache ? '\n- Cached profile' : ''}`;

    if (!confirm(confirmMessage)) return;

    try {
      this.deleting = true;
      const result: any = await this.api.action('delete_user_data', userId, {
        fullDelete: this.deleteFullCache,
      });

      if (result.success) {
        this.selectedUserId = null;
        this.deleteFullCache = false;
        await this.loadData();
      } else {
        alert(result.message || 'Failed to delete user data');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user data');
    } finally {
      this.deleting = false;
    }
  }

  async handleDeleteReaction(reactionId: string) {
    try {
      const result: any = await this.api.action('delete_reaction', reactionId);
      if (result.success) {
        await this.loadData();
      } else {
        alert(result.message || 'Failed to delete reaction');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete reaction');
    }
  }

  async handleDeleteComment(commentId: string) {
    try {
      const result: any = await this.api.action('delete_comment', commentId);
      if (result.success) {
        await this.loadData();
      } else {
        alert(result.message || 'Failed to delete comment');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete comment');
    }
  }

  // WhatsApp handlers
  async handleStartWhatsAppChat() {
    if (!this.newContactPhone.trim()) {
      alert('Phone number is required');
      return;
    }

    try {
      this.sending = true;
      const result: any = await this.api.action('start_whatsapp_chat', 'new', {
        phone: this.newContactPhone,
        name: this.newContactName || this.newContactPhone,
      });

      if (result.success) {
        this.newContactPhone = '';
        this.newContactName = '';
        this.selectedChatId = result.result?.chat_id || result.chat_id;
        await this.loadData();
      } else {
        alert(result.message || 'Failed to start chat');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start chat');
    } finally {
      this.sending = false;
    }
  }

  async handleSendWhatsAppMessage() {
    if (!this.messageText.trim() || !this.selectedChatId) return;

    try {
      this.sending = true;
      const result: any = await this.api.action('send_whatsapp_message', this.selectedChatId, {
        text: this.messageText,
      });

      if (result.success) {
        this.messageText = '';
        await this.loadData();
      } else {
        alert(result.message || 'Failed to send message');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      this.sending = false;
    }
  }

  async handleSimulateIncomingMessage() {
    if (!this.messageText.trim() || !this.selectedChatId) return;

    try {
      this.sending = true;
      const result: any = await this.api.action('simulate_incoming_message', this.selectedChatId, {
        text: this.messageText,
      });

      if (result.success) {
        this.messageText = '';
        await this.loadData();
      } else {
        alert(result.message || 'Failed to simulate message');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to simulate message');
    } finally {
      this.sending = false;
    }
  }

  async handleDeleteWhatsAppChat(chatId: string) {
    if (!confirm('Are you sure you want to delete this chat and all its messages?')) return;

    try {
      const result: any = await this.api.action('delete_whatsapp_chat', chatId);
      if (result.success) {
        this.selectedChatId = null;
        await this.loadData();
      } else {
        alert(result.message || 'Failed to delete chat');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete chat');
    }
  }

  async handleClearWhatsAppData() {
    if (!confirm('Are you sure you want to clear ALL WhatsApp data?\n\nThis will remove:\n- All contacts\n- All chats\n- All messages')) return;

    try {
      const result: any = await this.api.action('clear_whatsapp_data', 'all');
      if (result.success) {
        this.selectedChatId = null;
        await this.loadData();
      } else {
        alert(result.message || 'Failed to clear WhatsApp data');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to clear WhatsApp data');
    }
  }

  render() {
    if (this.loading) {
      return html`<div class="loading">Loading MessageHub data...</div>`;
    }

    if (this.error) {
      return html`
        <div class="error">
          <h3>Error</h3>
          <p>${this.error}</p>
          <button class="danger" @click=${() => this.loadData()}>Retry</button>
        </div>
      `;
    }

    return html`
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h1>MessageHub</h1>
              <p>Multi-platform messaging: LinkedIn + WhatsApp</p>
            </div>
            <button
              class="secondary"
              @click=${() => this.loadData()}
              ?disabled=${this.loading}
            >
              ${this.loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <button
            class="tab ${this.activeTab === 'linkedin' ? 'active linkedin' : ''}"
            @click=${() => { this.activeTab = 'linkedin'; this.requestUpdate(); }}
          >
            LinkedIn
          </button>
          <button
            class="tab ${this.activeTab === 'whatsapp' ? 'active whatsapp' : ''}"
            @click=${() => { this.activeTab = 'whatsapp'; this.requestUpdate(); }}
          >
            WhatsApp
          </button>
        </div>

        ${this.activeTab === 'linkedin' ? this.renderLinkedIn() : this.renderWhatsApp()}
      </div>
    `;
  }

  renderLinkedIn() {
    if (!this.userData) {
      return html`<div class="empty"><h3>No LinkedIn data available</h3></div>`;
    }

    const selectedUser = this.selectedUserId
      ? this.userData?.users?.find(u => u.id === this.selectedUserId || u.provider_id === this.selectedUserId)
      : null;

    const userInvitation = selectedUser
      ? this.userData?.invitations?.find(inv => inv.recipient_id === selectedUser.provider_id || inv.recipient_id === selectedUser.id)
      : null;

    const userChat = selectedUser
      ? this.userData?.chats?.find(chat =>
          chat.attendee_provider_id === selectedUser.provider_id ||
          chat.attendee_provider_id === selectedUser.id
        )
      : null;

    const userMessages = userChat
      ? (this.userData?.messages || []).filter(msg => msg.chat_id === userChat.id)
      : [];

    const userPosts = selectedUser?.posts || [];

    const allUsers = this.userData?.users || [];
    const filteredUsers = this.showAllUsers ? allUsers : allUsers.filter(user => {
      const hasInvite = this.userData?.invitations?.some(inv =>
        inv.recipient_id === user.provider_id || inv.recipient_id === user.id
      );
      const hasChat = this.userData?.chats?.some(chat =>
        chat.attendee_provider_id === user.provider_id || chat.attendee_provider_id === user.id
      );
      const hasPostActivity = user.posts?.some(post =>
        (post.intercepted_reaction_count || 0) > 0 || (post.intercepted_comment_count || 0) > 0
      );
      return hasInvite || hasChat || hasPostActivity;
    });

    return html`
      <!-- Stats -->
      <div class="stats" style="grid-template-columns: repeat(6, 1fr);">
        <div class="stat-card">
          <div class="stat-label">Users</div>
          <div class="stat-value">${this.userData?.stats?.total_users || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Connections</div>
          <div class="stat-value">${this.userData?.stats?.connections || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Invites</div>
          <div class="stat-value">${this.userData?.stats?.pending_invites || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Messages</div>
          <div class="stat-value">${this.userData?.stats?.total_messages || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Reactions</div>
          <div class="stat-value">${this.userData?.stats?.total_reactions || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Comments</div>
          <div class="stat-value">${this.userData?.stats?.total_comments || 0}</div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <!-- User List -->
        <div class="user-list">
          <div class="user-list-header" style="display: flex; justify-content: space-between; align-items: center;">
            <span>Users (${filteredUsers.length})</span>
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-weight: normal; cursor: pointer; opacity: 0.6;">
              <input
                type="checkbox"
                .checked=${this.showAllUsers}
                @change=${(e: Event) => {
                  this.showAllUsers = (e.target as HTMLInputElement).checked;
                  this.requestUpdate();
                }}
                style="cursor: pointer;"
              />
              Show cached
            </label>
          </div>
          ${filteredUsers.map(user => {
            const isSelected = this.selectedUserId === user.id || this.selectedUserId === user.provider_id;
            const totalLikes = (user.posts || []).reduce((sum, p) => sum + (p.intercepted_reaction_count || 0), 0);
            const totalComments = (user.posts || []).reduce((sum, p) => sum + (p.intercepted_comment_count || 0), 0);
            return html`
              <div
                class="user-item ${isSelected ? 'selected' : ''}"
                @click=${() => {
                  this.selectedUserId = user.id;
                  this.expandedPostId = null;
                  this.requestUpdate();
                }}
              >
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  ${user.profile_picture_url ? html`
                    <img src="${user.profile_picture_url}" alt="${user.first_name} ${user.last_name}"
                         style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />
                  ` : html`
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: #0A66C2; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.875rem;">
                      ${user.first_name?.charAt(0)}${user.last_name?.charAt(0)}
                    </div>
                  `}
                  <div style="flex: 1; min-width: 0;">
                    <div class="user-name">${user.first_name} ${user.last_name}</div>
                    ${user.headline ? html`<div class="user-headline">${user.headline}</div>` : ''}
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.25rem;">
                      ${user.location ? html`<span class="user-location">${user.location}</span>` : ''}
                      ${(user.posts?.length || 0) > 0 ? html`
                        <span style="font-size: 0.7rem; color: #666;">${user.posts?.length} ${user.posts?.length === 1 ? 'post' : 'posts'}</span>
                      ` : ''}
                      ${totalLikes > 0 ? html`
                        <span style="font-size: 0.7rem; color: #0A66C2;">${totalLikes} likes</span>
                      ` : ''}
                      ${totalComments > 0 ? html`
                        <span style="font-size: 0.7rem; color: #057642;">${totalComments} comments</span>
                      ` : ''}
                    </div>
                  </div>
                </div>
              </div>
            `;
          })}
        </div>

        <!-- User Detail -->
        <div class="user-detail" style="overflow-y: auto; max-height: 600px;">
          ${selectedUser ? html`
            <!-- Profile Header -->
            <div class="profile-header">
              <div class="profile-avatar">
                ${selectedUser.first_name.charAt(0)}${selectedUser.last_name.charAt(0)}
              </div>
              <div class="profile-info">
                <h2 class="profile-name">${selectedUser.first_name} ${selectedUser.last_name}</h2>
                ${selectedUser.headline ? html`<p class="profile-headline">${selectedUser.headline}</p>` : ''}
                <div class="profile-meta">
                  ${selectedUser.location ? html`<span>${selectedUser.location}</span>` : ''}
                  ${selectedUser.connections_count ? html`<span>${selectedUser.connections_count} connections</span>` : ''}
                  ${selectedUser.network_distance ? html`<span>${selectedUser.network_distance}</span>` : ''}
                </div>
              </div>
            </div>

            <!-- Invitation Section -->
            ${userInvitation ? html`
              <div class="section">
                <h3 class="section-title">Connection Request</h3>
                <div class="invitation-card">
                  ${userInvitation.message ? html`<div class="invitation-message">"${userInvitation.message}"</div>` : ''}
                  <div style="font-size: 0.75rem; color: #666666; margin-bottom: 0.75rem;">
                    Status: <strong style="text-transform: capitalize">${userInvitation.status}</strong> |
                    Sent: ${new Date(userInvitation.sent_at).toLocaleDateString()}
                  </div>
                  ${userInvitation.status === 'pending' ? html`
                    <div class="invitation-actions">
                      <button class="success" @click=${() => this.handleInviteAction(userInvitation.id, 'accept_invite')}>
                        ${selectedUser.first_name} accepts
                      </button>
                      <button class="danger" @click=${() => this.handleInviteAction(userInvitation.id, 'decline_invite')}>
                        ${selectedUser.first_name} declines
                      </button>
                    </div>
                  ` : ''}
                </div>
              </div>
            ` : ''}

            <!-- Messages Section (only visible for accepted connections) -->
            ${selectedUser.network_distance === 'FIRST_DEGREE' ? html`
              <div class="section">
                <h3 class="section-title">Messages (${userMessages.length})</h3>

                ${userMessages.length > 0 ? html`
                  <div class="messages-container">
                    ${userMessages.map(msg => {
                      const isSent = msg.is_sender === 1;
                      return html`
                        <div class="message ${isSent ? 'sent' : 'received'}">
                          <div class="message-meta">
                            ${isSent ? `To: ${selectedUser.first_name}` : `From: ${selectedUser.first_name}`} |
                            ${new Date(msg.timestamp).toLocaleString()}
                          </div>
                          <div class="message-text">${msg.text}</div>
                        </div>
                      `;
                    })}
                  </div>
                ` : html`
                  <p style="color: #666666; font-size: 0.875rem; margin-bottom: 1rem;">
                    No messages yet. Start a conversation!
                  </p>
                `}

                <!-- Message Form -->
                <div class="message-form">
                  <textarea
                    rows="3"
                    placeholder="${selectedUser.first_name} replies"
                    .value=${this.messageText}
                    @input=${(e: Event) => {
                      this.messageText = (e.target as HTMLTextAreaElement).value;
                      this.requestUpdate();
                    }}
                  ></textarea>
                  <button
                    class="primary"
                    ?disabled=${!this.messageText.trim() || this.sending}
                    @click=${() => this.handleSendMessage(selectedUser.id)}
                  >
                    ${this.sending ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </div>
            ` : ''}

            <!-- Posts Section -->
            ${userPosts.length > 0 ? html`
              <div class="section">
                <h3 class="section-title">Posts (${userPosts.length})</h3>
                ${userPosts.map(post => {
                  const isExpanded = this.expandedPostId === (post.id || post.social_id);
                  const hasActivity = (post.intercepted_reaction_count || 0) > 0 || (post.intercepted_comment_count || 0) > 0;
                  return html`
                    <div
                      class="post-item"
                      style="cursor: pointer; border: 1px solid #E0DFDC; border-radius: 8px; margin-bottom: 0.75rem; ${isExpanded ? 'border-color: #0A66C2;' : ''}"
                      @click=${() => {
                        this.expandedPostId = isExpanded ? null : (post.id || post.social_id || null);
                        this.requestUpdate();
                      }}
                    >
                      <div class="post-text" style="${isExpanded ? '-webkit-line-clamp: unset;' : ''}">${post.text || '(No text)'}</div>
                      <div class="post-meta">
                        ${post.created_at ? html`<span>${new Date(post.created_at).toLocaleDateString()}</span>` : ''}
                        <span style="opacity: 0.6;">Original: ${post.reaction_counter || 0} reactions, ${post.comment_counter || 0} comments</span>
                      </div>
                      ${hasActivity ? html`
                        ${(post.intercepted_reaction_count || 0) > 0 ? html`
                          <div class="post-stats" style="margin-top: 0.5rem;">
                            <span class="post-stat reactions">${post.intercepted_reaction_count} ${post.intercepted_reaction_count === 1 ? 'like' : 'likes'}</span>
                          </div>
                        ` : ''}
                        ${(post.intercepted_comments?.length || 0) > 0 ? html`
                          <div style="margin-top: 0.5rem;">
                            ${post.intercepted_comments?.map(comment => html`
                              <div style="display: flex; align-items: flex-start; gap: 0.5rem; padding: 0.5rem; background: #F3F2EF; border-radius: 6px; margin-bottom: 0.25rem;">
                                <div style="flex: 1; font-size: 0.8rem; color: #333;">${comment.text}</div>
                                <button
                                  class="secondary"
                                  style="font-size: 0.6rem; padding: 0.15rem 0.4rem; flex-shrink: 0;"
                                  @click=${(e: Event) => {
                                    e.stopPropagation();
                                    this.handleDeleteComment(comment.id);
                                  }}
                                >
                                  x
                                </button>
                              </div>
                            `)}
                          </div>
                        ` : ''}
                      ` : ''}

                      ${isExpanded && (post.intercepted_reactions?.length || 0) > 0 ? html`
                        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #E0DFDC;">
                          <h4 style="font-size: 0.75rem; color: #666; margin: 0 0 0.5rem 0;">Likes</h4>
                          ${post.intercepted_reactions?.map(reaction => html`
                            <div class="activity-card reaction">
                              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <div>
                                  <div class="activity-type">${reaction.reaction_type || 'LIKE'}</div>
                                  <div class="activity-meta">
                                    ${new Date(reaction.created_at).toLocaleString()}
                                  </div>
                                </div>
                                <button
                                  class="secondary"
                                  style="font-size: 0.625rem; padding: 0.25rem 0.5rem;"
                                  @click=${(e: Event) => {
                                    e.stopPropagation();
                                    this.handleDeleteReaction(reaction.id);
                                  }}
                                >
                                  x
                                </button>
                              </div>
                            </div>
                          `)}
                        </div>
                      ` : ''}
                    </div>
                  `;
                })}
              </div>
            ` : ''}

            <!-- Delete Section -->
            <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #F3F2EF;">
              <details>
                <summary style="font-size: 0.75rem; color: #999999; cursor: pointer;">Delete user data</summary>
                <div style="margin-top: 0.75rem; padding-left: 1rem;">
                  <p style="font-size: 0.75rem; color: #999999; margin: 0 0 0.5rem 0;">
                    Remove invitations, messages, and chats for testing.
                  </p>
                  <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <label style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; color: #999999; cursor: pointer;">
                      <input
                        type="checkbox"
                        .checked=${this.deleteFullCache}
                        @change=${(e: Event) => {
                          this.deleteFullCache = (e.target as HTMLInputElement).checked;
                          this.requestUpdate();
                        }}
                        style="cursor: pointer;"
                      />
                      Also delete cached profile
                    </label>
                    <button
                      class="secondary"
                      ?disabled=${this.deleting}
                      @click=${() => this.handleDeleteUser(selectedUser.id, `${selectedUser.first_name} ${selectedUser.last_name}`)}
                      style="font-size: 0.75rem; padding: 0.35rem 0.75rem;"
                    >
                      ${this.deleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </details>
            </div>
          ` : html`
            <div class="empty">
              <h3>Select a user to view their profile</h3>
              <p style="color: #666666; font-size: 0.875rem; margin-top: 0.5rem;">
                Users with invites, messages, or post activity will be shown.
              </p>
            </div>
          `}
        </div>
      </div>
    `;
  }

  renderWhatsApp() {
    const chats = this.whatsappData?.chats || [];
    const selectedChat = this.selectedChatId
      ? chats.find(c => c.id === this.selectedChatId)
      : null;

    const chatMessages = selectedChat
      ? (this.whatsappData?.messages || []).filter(m => m.chat_id === selectedChat.id)
      : [];

    return html`
      <!-- Stats -->
      <div class="stats" style="grid-template-columns: repeat(3, 1fr);">
        <div class="stat-card">
          <div class="stat-label">Contacts</div>
          <div class="stat-value">${this.whatsappData?.stats?.total_contacts || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Chats</div>
          <div class="stat-value">${this.whatsappData?.stats?.total_chats || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Messages</div>
          <div class="stat-value">${this.whatsappData?.stats?.total_messages || 0}</div>
        </div>
      </div>

      <!-- New Chat Form -->
      <div style="background: #FFFFFF; border: 1px solid #E0DFDC; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
        <h3 style="font-size: 0.875rem; font-weight: 600; color: #000000; margin: 0 0 0.75rem 0;">Start New Chat</h3>
        <div class="new-contact-form">
          <input
            type="text"
            placeholder="Phone (e.g., +61412345678)"
            .value=${this.newContactPhone}
            @input=${(e: Event) => {
              this.newContactPhone = (e.target as HTMLInputElement).value;
              this.requestUpdate();
            }}
            style="flex: 1; min-width: 150px;"
          />
          <input
            type="text"
            placeholder="Name (optional)"
            .value=${this.newContactName}
            @input=${(e: Event) => {
              this.newContactName = (e.target as HTMLInputElement).value;
              this.requestUpdate();
            }}
            style="flex: 1; min-width: 120px;"
          />
          <button
            class="primary whatsapp"
            ?disabled=${!this.newContactPhone.trim() || this.sending}
            @click=${() => this.handleStartWhatsAppChat()}
          >
            Start Chat
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <!-- Chat List -->
        <div class="chat-list">
          <div class="chat-list-header" style="display: flex; justify-content: space-between; align-items: center;">
            <span>Chats (${chats.length})</span>
            ${chats.length > 0 ? html`
              <button
                class="secondary whatsapp"
                style="font-size: 0.625rem; padding: 0.25rem 0.5rem;"
                @click=${() => this.handleClearWhatsAppData()}
              >
                Clear All
              </button>
            ` : ''}
          </div>
          ${chats.length === 0 ? html`
            <div style="padding: 2rem; text-align: center; color: #666666;">
              <p style="margin: 0; font-size: 0.875rem;">No chats yet</p>
              <p style="margin: 0.5rem 0 0 0; font-size: 0.75rem;">Start a new chat above</p>
            </div>
          ` : ''}
          ${chats.map(chat => {
            const isSelected = this.selectedChatId === chat.id;
            return html`
              <div
                class="chat-item ${isSelected ? 'selected' : ''}"
                @click=${() => {
                  this.selectedChatId = chat.id;
                  this.messageText = '';
                  this.requestUpdate();
                }}
              >
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <div style="width: 40px; height: 40px; border-radius: 50%; background: #25D366; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.875rem;">
                    ${chat.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div style="flex: 1; min-width: 0;">
                    <div class="chat-name">${chat.name || chat.contact_phone}</div>
                    <div class="chat-phone">${chat.contact_phone}</div>
                    ${chat.last_message ? html`
                      <div class="chat-preview">${chat.last_message.text}</div>
                    ` : ''}
                  </div>
                  <div style="text-align: right; font-size: 0.625rem; color: #999;">
                    ${chat.message_count || 0} msgs
                  </div>
                </div>
              </div>
            `;
          })}
        </div>

        <!-- Chat Detail -->
        <div class="chat-detail" style="overflow-y: auto; max-height: 600px;">
          ${selectedChat ? html`
            <!-- Chat Header -->
            <div class="profile-header">
              <div class="profile-avatar whatsapp">
                ${selectedChat.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div class="profile-info">
                <h2 class="profile-name">${selectedChat.name || selectedChat.contact_phone}</h2>
                <p class="profile-headline">${selectedChat.contact_phone}</p>
                <div class="profile-meta">
                  <span>${chatMessages.length} messages</span>
                </div>
              </div>
              <button
                class="danger"
                style="font-size: 0.75rem; padding: 0.35rem 0.75rem;"
                @click=${() => this.handleDeleteWhatsAppChat(selectedChat.id)}
              >
                Delete Chat
              </button>
            </div>

            <!-- Messages -->
            <div class="section">
              <h3 class="section-title">Conversation</h3>

              <div class="messages-container whatsapp" style="max-height: 350px;">
                ${chatMessages.length === 0 ? html`
                  <p style="color: #666666; font-size: 0.875rem; text-align: center; padding: 2rem;">
                    No messages yet. Send or simulate a message below.
                  </p>
                ` : ''}
                ${chatMessages.map(msg => {
                  const isSent = msg.is_sender === 1;
                  return html`
                    <div class="message ${isSent ? 'wa-sent' : 'wa-received'}">
                      <div class="message-text">${msg.text}</div>
                      <div class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</div>
                    </div>
                  `;
                })}
              </div>

              <!-- Message Form -->
              <div class="message-form whatsapp">
                <textarea
                  rows="2"
                  placeholder="Type a message..."
                  .value=${this.messageText}
                  @input=${(e: Event) => {
                    this.messageText = (e.target as HTMLTextAreaElement).value;
                    this.requestUpdate();
                  }}
                ></textarea>
                <div style="display: flex; gap: 0.5rem;">
                  <button
                    class="primary whatsapp"
                    style="flex: 1;"
                    ?disabled=${!this.messageText.trim() || this.sending}
                    @click=${() => this.handleSendWhatsAppMessage()}
                  >
                    ${this.sending ? 'Sending...' : 'Send (as App)'}
                  </button>
                  <button
                    class="secondary whatsapp"
                    style="flex: 1;"
                    ?disabled=${!this.messageText.trim() || this.sending}
                    @click=${() => this.handleSimulateIncomingMessage()}
                  >
                    ${this.sending ? 'Sending...' : 'Receive (from Contact)'}
                  </button>
                </div>
              </div>
            </div>
          ` : html`
            <div class="empty">
              <h3>Select a chat to view messages</h3>
              <p style="color: #666666; font-size: 0.875rem; margin-top: 0.5rem;">
                WhatsApp messages are fully mocked locally.
              </p>
              <p style="color: #999999; font-size: 0.75rem; margin-top: 0.25rem;">
                No data is sent to Unipile for WhatsApp.
              </p>
            </div>
          `}
        </div>
      </div>
    `;
  }
}

// Only define the custom element if it hasn't been defined yet
if (!customElements.get('messagehub-plugin')) {
  customElements.define('messagehub-plugin', MessageHubPlugin);
}

// Export as default for dynamic import
export default MessageHubPlugin;

// Type declaration
declare global {
  interface HTMLElementTagNameMap {
    'messagehub-plugin': MessageHubPlugin;
  }
}
