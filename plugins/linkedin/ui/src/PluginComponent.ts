import { LitElement, html, css } from 'lit';

// LinkedIn color scheme
const COLORS = {
  primary: '#0A66C2',
  primaryDark: '#004182',
  primaryLight: '#378FE9',
  background: '#F3F2EF',
  white: '#FFFFFF',
  border: '#E0DFDC',
  textPrimary: '#000000',
  textSecondary: '#666666',
  success: '#057642',
  warning: '#F5C75D',
};

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

interface PostsData {
  posts: Post[];
  reactions: Reaction[];
  comments: Comment[];
  stats: {
    total_posts: number;
    total_reactions: number;
    total_comments: number;
    posts_with_activity: number;
  };
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

interface PluginAPI {
  workspace: string;
  action: (action: string, id: string, data?: Record<string, unknown>) => Promise<unknown>;
  refresh: () => void;
}


export class LinkedInPlugin extends LitElement {
  static properties = {
    api: { type: Object },
    userData: { type: Object, state: true },
    selectedUserId: { type: String, state: true },
    expandedPostId: { type: String, state: true },
    loading: { type: Boolean, state: true },
    error: { type: String, state: true },
    messageText: { type: String, state: true },
    sending: { type: Boolean, state: true },
    showAllUsers: { type: Boolean, state: true },
    deleteFullCache: { type: Boolean, state: true },
    deleting: { type: Boolean, state: true },
  };

  api!: PluginAPI;
  userData: UserData | null = null;
  selectedUserId: string | null = null;
  expandedPostId: string | null = null; // Track which post is expanded
  showAllUsers = false; // By default, show only users with invites or messages
  loading = true;
  error: string | null = null;
  messageText = '';
  sending = false;
  deleteFullCache = false; // Checkbox state for full delete
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

    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: #FFFFFF; border: 1px solid #E0DFDC; border-radius: 8px; padding: 1rem; }
    .stat-label { font-size: 0.75rem; color: #666666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem; }
    .stat-value { font-size: 1.5rem; font-weight: 600; color: #000000; }

    .main-content { display: grid; grid-template-columns: 300px 1fr; gap: 1.5rem; }

    .user-list { background: #FFFFFF; border: 1px solid #E0DFDC; border-radius: 8px; max-height: 600px; overflow-y: auto; }
    .user-list-header { padding: 1rem; border-bottom: 1px solid #E0DFDC; background: #F3F2EF; font-weight: 600; font-size: 0.875rem; color: #000000; }

    .user-item { padding: 1rem; border-bottom: 1px solid #E0DFDC; cursor: pointer; transition: background 0.2s; }
    .user-item:hover { background: #F3F2EF; }
    .user-item.selected { background: #E7F3FF; border-left: 3px solid #0A66C2; }
    .user-name { font-weight: 600; color: #000000; font-size: 0.875rem; margin-bottom: 0.25rem; }
    .user-headline { font-size: 0.75rem; color: #666666; margin-bottom: 0.25rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .user-location { font-size: 0.75rem; color: #666666; display: flex; align-items: center; gap: 0.25rem; }

    .user-detail { background: #FFFFFF; border: 1px solid #E0DFDC; border-radius: 8px; padding: 1.5rem; }
    .profile-header { display: flex; gap: 1rem; padding-bottom: 1.5rem; border-bottom: 1px solid #E0DFDC; margin-bottom: 1.5rem; }
    .profile-avatar { width: 80px; height: 80px; border-radius: 50%; background: #F3F2EF; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 600; color: #0A66C2; }
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
    .message { background: #FFFFFF; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.5rem; border-left: 3px solid #E0DFDC; }
    .message.sent { border-left-color: #0A66C2; background: #E7F3FF; }
    .message.received { border-left-color: #057642; background: #F0FFF4; }
    .message-meta { font-size: 0.75rem; color: #666666; margin-bottom: 0.25rem; }
    .message-text { font-size: 0.875rem; color: #000000; }

    .message-form { display: flex; flex-direction: column; gap: 0.75rem; }
    .message-form textarea { padding: 0.75rem; font-size: 0.875rem; border: 1px solid #E0DFDC; border-radius: 8px; font-family: inherit; resize: vertical; }
    .message-form textarea:focus { outline: none; border-color: #0A66C2; }

    button { padding: 0.5rem 1rem; font-size: 0.875rem; border: none; border-radius: 24px; cursor: pointer; font-family: inherit; font-weight: 600; transition: all 0.2s; }
    button.primary { background: #0A66C2; color: white; }
    button.primary:hover { background: #004182; }
    button.primary:disabled { opacity: 0.5; cursor: not-allowed; }
    button.secondary { background: #FFFFFF; color: #0A66C2; border: 1px solid #0A66C2; }
    button.secondary:hover { background: #E7F3FF; }
    button.success { background: #057642; color: white; }
    button.success:hover { background: #045A32; }
    button.danger { background: #CC1016; color: white; }
    button.danger:hover { background: #A00D12; }

    .loading, .error, .empty { text-align: center; padding: 3rem 1.5rem; background: #FFFFFF; border-radius: 8px; }
    .error { background: #FEF2F2; border: 1px solid #FCA5A5; }
    .error h3 { font-size: 1rem; font-weight: 600; color: #991B1B; margin: 0 0 0.5rem 0; }
    .error p { font-size: 0.875rem; color: #B91C1C; margin: 0 0 1rem 0; }
    .empty h3 { font-size: 1rem; color: #666666; margin: 0; }

    /* Tabs */
    .tabs { display: flex; gap: 0; margin-bottom: 1.5rem; background: #FFFFFF; border-radius: 8px; border: 1px solid #E0DFDC; overflow: hidden; }
    .tab { flex: 1; padding: 1rem; text-align: center; cursor: pointer; font-weight: 600; font-size: 0.875rem; color: #666666; border: none; background: transparent; transition: all 0.2s; }
    .tab:hover { background: #F3F2EF; }
    .tab.active { background: #0A66C2; color: white; }

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
    console.log('[LinkedIn Plugin] firstUpdated called, api:', this.api);
    this.loadData();
  }

  async loadData() {
    console.log('[LinkedIn Plugin] loadData called, api:', this.api);
    if (!this.api) {
      console.error('[LinkedIn Plugin] API not initialized');
      this.error = 'API not initialized';
      this.loading = false;
      this.requestUpdate(); // Force re-render
      return;
    }

    try {
      this.loading = true;
      this.error = null;
      console.log('[LinkedIn Plugin] Calling api.action...');

      const result: any = await this.api.action('load_user_data', 'all');
      console.log('[LinkedIn Plugin] Got result:', result);

      if (!result.success) {
        throw new Error(result.message || 'Failed to load user data');
      }

      // The data is in result.result.data
      this.userData = result.result?.data || result.data;
    } catch (err) {
      console.error('[LinkedIn Plugin] Error:', err);
      this.error = err instanceof Error ? err.message : 'Failed to load data';
    } finally {
      this.loading = false;
      console.log('[LinkedIn Plugin] Loading finished, loading:', this.loading, 'error:', this.error);
      this.requestUpdate(); // Force re-render
    }
  }

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

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      this.deleting = true;
      const result: any = await this.api.action('delete_user_data', userId, {
        fullDelete: this.deleteFullCache,
      });

      if (result.success) {
        const deleted = result.result?.deleted || {};
        const summary = `Deleted:\n` +
          `- ${deleted.invitations || 0} invitation(s)\n` +
          `- ${deleted.chats || 0} chat(s)\n` +
          `- ${deleted.messages || 0} message(s)` +
          (this.deleteFullCache ? `\n- ${deleted.profile || 0} cached profile(s)` : '');

        alert(summary);

        // Clear selection and reload data
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

  async handleClearPostsCache() {
    if (!confirm('Are you sure you want to clear all posts data?\n\nThis will remove:\n- All cached posts\n- All intercepted reactions\n- All intercepted comments')) {
      return;
    }

    try {
      const result: any = await this.api.action('clear_posts_cache', 'all');
      if (result.success) {
        this.selectedPostId = null;
        await this.loadData();
      } else {
        alert(result.message || 'Failed to clear posts cache');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to clear posts cache');
    }
  }

  render() {
    if (this.loading) {
      return html`<div class="loading">Loading LinkedIn data...</div>`;
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

    if (!this.userData) {
      return html`<div class="empty"><h3>No data available</h3></div>`;
    }

    const selectedUser = this.selectedUserId
      ? this.userData?.users?.find(u => u.id === this.selectedUserId || u.provider_id === this.selectedUserId)
      : null;

    const userInvitation = selectedUser
      ? this.userData?.invitations?.find(inv => inv.recipient_id === selectedUser.provider_id || inv.recipient_id === selectedUser.id)
      : null;

    // Find the chat with this user (using attendee_provider_id)
    const userChat = selectedUser
      ? this.userData?.chats?.find(chat =>
          chat.attendee_provider_id === selectedUser.provider_id ||
          chat.attendee_provider_id === selectedUser.id
        )
      : null;

    // Get messages for this chat (messages are FROM the user TO the contact)
    const userMessages = userChat
      ? (this.userData?.messages || []).filter(msg => msg.chat_id === userChat.id)
      : [];

    // Get user's posts
    const userPosts = selectedUser?.posts || [];

    // Filter users to only those with activity (unless showAllUsers is true)
    const allUsers = this.userData?.users || [];
    const filteredUsers = this.showAllUsers ? allUsers : allUsers.filter(user => {
      // Check if user has an invitation
      const hasInvite = this.userData?.invitations?.some(inv =>
        inv.recipient_id === user.provider_id || inv.recipient_id === user.id
      );

      // Check if user has a chat (messages)
      const hasChat = this.userData?.chats?.some(chat =>
        chat.attendee_provider_id === user.provider_id || chat.attendee_provider_id === user.id
      );

      // Check if user has posts with intercepted activity
      const hasPostActivity = user.posts?.some(post =>
        (post.intercepted_reaction_count || 0) > 0 || (post.intercepted_comment_count || 0) > 0
      );

      return hasInvite || hasChat || hasPostActivity;
    });

    return html`
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h1>LinkedIn Plugin</h1>
              <p>Manage connections, invitations, messages, and post activity</p>
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
              const postActivity = (user.posts || []).reduce((sum, p) =>
                sum + (p.intercepted_reaction_count || 0) + (p.intercepted_comment_count || 0), 0);
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
                        ${user.location ? html`<span class="user-location">📍 ${user.location}</span>` : ''}
                        ${(user.posts?.length || 0) > 0 ? html`
                          <span style="font-size: 0.7rem; color: #666;">📝 ${user.posts?.length} posts</span>
                        ` : ''}
                        ${postActivity > 0 ? html`
                          <span style="font-size: 0.7rem; color: #0A66C2;">⚡ ${postActivity} activity</span>
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
                    ${selectedUser.location ? html`<span>📍 ${selectedUser.location}</span>` : ''}
                    ${selectedUser.connections_count ? html`<span>🤝 ${selectedUser.connections_count} connections</span>` : ''}
                    ${selectedUser.network_distance ? html`<span>🌐 ${selectedUser.network_distance}</span>` : ''}
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
                      Status: <strong style="text-transform: capitalize">${userInvitation.status}</strong> •
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
                        // Per Unipile API: is_sender=1 means we sent it, is_sender=0 means contact sent it
                        const isSent = msg.is_sender === 1;
                        return html`
                          <div class="message ${isSent ? 'sent' : 'received'}">
                            <div class="message-meta">
                              ${isSent ? `To: ${selectedUser.first_name} ${selectedUser.last_name}` : `From: ${selectedUser.first_name} ${selectedUser.last_name}`} •
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
                          <div class="post-stats" style="margin-top: 0.5rem;">
                            ${(post.intercepted_reaction_count || 0) > 0 ? html`
                              <span class="post-stat reactions">👍 ${post.intercepted_reaction_count} intercepted</span>
                            ` : ''}
                            ${(post.intercepted_comment_count || 0) > 0 ? html`
                              <span class="post-stat comments">💬 ${post.intercepted_comment_count} intercepted</span>
                            ` : ''}
                          </div>
                        ` : ''}

                        <!-- Expanded View: Reactions and Comments -->
                        ${isExpanded && hasActivity ? html`
                          <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #E0DFDC;">
                            <!-- Intercepted Reactions -->
                            ${(post.intercepted_reactions?.length || 0) > 0 ? html`
                              <div style="margin-bottom: 1rem;">
                                <h4 style="font-size: 0.75rem; color: #666; margin: 0 0 0.5rem 0; text-transform: uppercase;">Reactions</h4>
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
                                        ✕
                                      </button>
                                    </div>
                                  </div>
                                `)}
                              </div>
                            ` : ''}

                            <!-- Intercepted Comments -->
                            ${(post.intercepted_comments?.length || 0) > 0 ? html`
                              <div>
                                <h4 style="font-size: 0.75rem; color: #666; margin: 0 0 0.5rem 0; text-transform: uppercase;">Comments</h4>
                                ${post.intercepted_comments?.map(comment => html`
                                  <div class="activity-card comment">
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                      <div style="flex: 1;">
                                        <div class="activity-text">${comment.text}</div>
                                        <div class="activity-meta">
                                          ${new Date(comment.created_at).toLocaleString()}
                                        </div>
                                      </div>
                                      <button
                                        class="secondary"
                                        style="font-size: 0.625rem; padding: 0.25rem 0.5rem;"
                                        @click=${(e: Event) => {
                                          e.stopPropagation();
                                          this.handleDeleteComment(comment.id);
                                        }}
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>
                                `)}
                              </div>
                            ` : ''}
                          </div>
                        ` : ''}
                      </div>
                    `;
                  })}
                </div>
              ` : ''}

              <!-- Delete Section (subtle, at bottom) -->
              <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #F3F2EF;">
                <details>
                  <summary style="font-size: 0.75rem; color: #999999; cursor: pointer; list-style: none; display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 0.625rem;">▶</span> Delete user data
                  </summary>
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
      </div>
    `;
  }
}

// Only define the custom element if it hasn't been defined yet
if (!customElements.get('linkedin-plugin')) {
  customElements.define('linkedin-plugin', LinkedInPlugin);
}

// Export as default for dynamic import
export default LinkedInPlugin;

// Type declaration
declare global {
  interface HTMLElementTagNameMap {
    'linkedin-plugin': LinkedInPlugin;
  }
}
