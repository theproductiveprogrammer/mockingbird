import { LitElement, html, css } from 'lit';

interface Email {
  ID: string;
  From?: { Name?: string; Address: string };
  Subject?: string;
  Created?: string;
  Date?: string;
  Snippet?: string;
}

interface EmailDetails {
  Subject: string;
  From: { Name?: string; Address: string };
  To: Array<{ Name?: string; Address: string }>;
  Date: string;
  Text?: string;
  HTML?: string;
}

interface Config {
  host: string;
  port: string;
  fromEmail: string;
  emailCount: number;
  repliesCount: number;
}

interface PluginAPI {
  workspace: string;
  action: (action: string, id: string, data?: Record<string, unknown>) => Promise<unknown>;
  refresh: () => void;
}

export class EmailPlugin extends LitElement {
  static properties = {
    api: { type: Object },
    emails: { type: Array, state: true },
    config: { type: Object, state: true },
    loading: { type: Boolean, state: true },
    error: { type: String, state: true },
    selectedEmail: { type: String, state: true },
    emailDetails: { type: Object, state: true },
    replyText: { type: String, state: true },
    repliedEmails: { type: Object, state: true },
    sending: { type: Boolean, state: true },
  };

  api!: PluginAPI;
  emails: Email[] = [];
  config: Config | null = null;
  loading = true;
  error: string | null = null;
  selectedEmail: string | null = null;
  emailDetails: EmailDetails | null = null;
  replyText = '';
  repliedEmails = new Set<string>();
  sending = false;

  static styles = css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      background: white;
      padding: 20px;
    }

    .container { padding: 1.5rem 0; display: flex; flex-direction: column; gap: 1.5rem; }

    .header { display: flex; justify-content: space-between; align-items: center; }
    .header h2 { font-size: 1.125rem; font-weight: 600; color: #111827; margin: 0; }
    .header p { font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem; }
    .header .mono { font-family: monospace; }

    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .stat-card { background: white; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; }
    .stat-label { font-size: 0.75rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.025em; }
    .stat-value { font-size: 1.5rem; font-weight: bold; color: #111827; margin-top: 0.25rem; }
    .stat-value-sm { font-size: 0.875rem; font-weight: 500; color: #111827; margin-top: 0.25rem; }

    .inbox { background: white; border: 1px solid #e5e7eb; border-radius: 0.5rem; overflow: hidden; }
    .inbox-header { padding: 0.75rem 1rem; border-bottom: 1px solid #e5e7eb; background: #f9fafb; }
    .inbox-header h3 { font-size: 0.875rem; font-weight: 500; color: #111827; margin: 0; }

    .email-item { border-bottom: 1px solid #e5e7eb; background: white; }
    .email-item:hover { background: #f9fafb; }
    .email-header { padding: 0.75rem 1rem; cursor: pointer; }
    .email-title { font-size: 0.875rem; font-weight: 500; color: #111827; margin: 0 0 0.25rem 0; display: flex; align-items: center; gap: 0.5rem; }
    .email-meta { font-size: 0.75rem; color: #6b7280; }
    .email-snippet { font-size: 0.75rem; color: #4b5563; margin-top: 0.25rem; }

    .badge { padding: 0.125rem 0.5rem; font-size: 0.75rem; font-weight: 500; background: #d1fae5; color: #065f46; border-radius: 0.25rem; }

    .email-details { padding: 0 1rem 1rem 1rem; border-top: 1px solid #f3f4f6; }
    .detail-box { background: #f9fafb; border-radius: 0.5rem; padding: 0.75rem; margin-top: 0.75rem; }
    .detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; font-size: 0.75rem; }
    .detail-content { background: #f9fafb; border-radius: 0.5rem; padding: 0.75rem; margin-top: 0.75rem; }
    .detail-content pre { margin: 0; font-size: 0.75rem; white-space: pre-wrap; font-family: sans-serif; color: #111827; }

    .reply-form { margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .reply-form textarea { width: 100%; padding: 0.5rem 0.75rem; font-size: 0.875rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-family: inherit; resize: vertical; }
    .reply-form textarea:focus { outline: none; ring: 2px; ring-color: #3b82f6; border-color: #3b82f6; }
    .reply-buttons { display: flex; gap: 0.5rem; }

    button { padding: 0.5rem 1rem; font-size: 0.875rem; border: none; border-radius: 0.375rem; cursor: pointer; font-family: inherit; transition: background 0.2s; }
    button.primary { background: #2563eb; color: white; }
    button.primary:hover { background: #1d4ed8; }
    button.primary:disabled { opacity: 0.5; cursor: not-allowed; }
    button.secondary { background: #e5e7eb; color: #374151; }
    button.secondary:hover { background: #d1d5db; }
    button.danger { background: #dc2626; color: white; }
    button.danger:hover { background: #b91c1c; }

    .loading, .error, .empty { text-align: center; padding: 3rem 1.5rem; }
    .error { background: #fef2f2; border: 1px solid #fecaca; border-radius: 0.5rem; }
    .error h3 { font-size: 0.875rem; font-weight: 500; color: #991b1b; margin: 0 0 0.5rem 0; }
    .error p { font-size: 0.75rem; color: #b91c1c; margin: 0 0 1rem 0; }
    .empty { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; }
    .empty p { margin: 0; font-size: 0.875rem; color: #4b5563; }
    .empty p.small { font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem; }
  `;

  firstUpdated() {
    console.log('[Email Plugin] firstUpdated called, api:', this.api);
    this.loadEmails();
  }

  async loadEmails() {
    console.log('[Email Plugin] loadEmails called, api:', this.api);
    if (!this.api) {
      console.error('[Email Plugin] API not initialized');
      this.error = 'API not initialized';
      this.loading = false;
      return;
    }

    try {
      this.loading = true;
      this.error = null;
      console.log('[Email Plugin] Calling api.action...');

      const result: any = await this.api.action('load_emails', 'all');
      console.log('[Email Plugin] Got result:', result);

      if (!result.success) {
        throw new Error(result.message || 'Failed to load emails');
      }

      this.emails = result.emails || [];
      this.config = result.config;
      this.repliedEmails = new Set(result.replied_ids || []);
      console.log('[Email Plugin] Loaded', this.emails.length, 'emails');
    } catch (err) {
      console.error('[Email Plugin] Error:', err);
      this.error = err instanceof Error ? err.message : 'Failed to load emails';
    } finally {
      this.loading = false;
      console.log('[Email Plugin] Loading finished, loading:', this.loading, 'error:', this.error);
      this.requestUpdate(); // Force re-render
    }
  }

  async viewEmail(emailId: string) {
    this.selectedEmail = emailId;
    this.emailDetails = null;

    try {
      const result: any = await this.api.action('view_email', `email_${emailId}`);

      if (result.success && result.data) {
        this.emailDetails = result.data;
      }
    } catch (err) {
      console.error('Failed to load email details:', err);
    }
  }

  async handleReply(emailId: string) {
    if (!this.replyText.trim()) return;

    try {
      this.sending = true;
      const result: any = await this.api.action('reply_email', `email_${emailId}`, {
        text: this.replyText,
      });

      if (result.success) {
        this.repliedEmails.add(emailId);
        this.replyText = '';
        this.selectedEmail = null;
        this.emailDetails = null;
        await this.loadEmails();
      } else {
        alert(result.message || 'Failed to send reply');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send reply');
    } finally {
      this.sending = false;
    }
  }

  render() {
    if (this.loading) {
      return html`<div class="loading">Loading emails...</div>`;
    }

    if (this.error) {
      return html`
        <div class="error">
          <h3>Error</h3>
          <p>${this.error}</p>
          <button class="danger" @click=${() => this.loadEmails()}>Retry</button>
        </div>
      `;
    }

    return html`
      <div class="container">
        <div class="header">
          <div>
            <h2>Email Plugin (Mailpit)</h2>
            ${this.config ? html`
              <p>
                Mailpit: <span class="mono">${this.config.host}:${this.config.port}</span> •
                From: <span class="mono">${this.config.fromEmail}</span>
              </p>
            ` : ''}
          </div>
          <button class="primary" @click=${() => this.loadEmails()}>Refresh</button>
        </div>

        ${this.config ? html`
          <div class="stats">
            <div class="stat-card">
              <div class="stat-label">Emails</div>
              <div class="stat-value">${this.config.emailCount}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Replies Sent</div>
              <div class="stat-value">${this.config.repliesCount}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Workspace</div>
              <div class="stat-value-sm">${this.api.workspace}</div>
            </div>
          </div>
        ` : ''}

        ${this.emails.length === 0 ? html`
          <div class="empty">
            <p>No emails found</p>
            <p class="small">Make sure Mailpit is running and accessible</p>
          </div>
        ` : html`
          <div class="inbox">
            <div class="inbox-header">
              <h3>Inbox (${this.emails.length} ${this.emails.length === 1 ? 'email' : 'emails'})</h3>
            </div>

            ${this.emails.map(email => {
              const fromStr = email.From?.Name || email.From?.Address || 'Unknown';
              const subject = email.Subject || '(No Subject)';
              const hasReplied = this.repliedEmails.has(email.ID);
              const isSelected = this.selectedEmail === email.ID;

              return html`
                <div class="email-item">
                  <div class="email-header" @click=${() => this.viewEmail(email.ID)}>
                    <div class="email-title">
                      <span>${subject}</span>
                      ${hasReplied ? html`<span class="badge">REPLIED</span>` : ''}
                    </div>
                    <div class="email-meta">
                      From: ${fromStr} • ${email.Created || email.Date || 'Unknown date'}
                    </div>
                    ${email.Snippet ? html`<div class="email-snippet">${email.Snippet}</div>` : ''}
                  </div>

                  ${isSelected ? html`
                    <div class="email-details">
                      ${this.emailDetails ? html`
                        <div class="detail-box">
                          <div class="detail-grid">
                            <div><span style="color: #6b7280">From:</span> ${this.emailDetails.From.Name || this.emailDetails.From.Address}</div>
                            <div><span style="color: #6b7280">Date:</span> ${this.emailDetails.Date}</div>
                          </div>
                        </div>

                        <div class="detail-content">
                          <pre>${this.emailDetails.Text || this.emailDetails.HTML || 'No content'}</pre>
                        </div>

                        ${!hasReplied ? html`
                          <div class="reply-form">
                            <textarea
                              rows="4"
                              placeholder="Type your reply..."
                              .value=${this.replyText}
                              @input=${(e: Event) => this.replyText = (e.target as HTMLTextAreaElement).value}
                            ></textarea>
                            <div class="reply-buttons">
                              <button
                                class="primary"
                                ?disabled=${!this.replyText.trim() || this.sending}
                                @click=${() => this.handleReply(email.ID)}
                              >
                                ${this.sending ? 'Sending...' : 'Send Reply'}
                              </button>
                              <button
                                class="secondary"
                                @click=${() => {
                                  this.selectedEmail = null;
                                  this.emailDetails = null;
                                  this.replyText = '';
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ` : ''}
                      ` : html`<div style="text-align: center; padding: 1rem; font-size: 0.75rem; color: #6b7280">Loading details...</div>`}
                    </div>
                  ` : ''}
                </div>
              `;
            })}
          </div>
        `}
      </div>
    `;
  }
}

// Only define the custom element if it hasn't been defined yet
if (!customElements.get('email-plugin')) {
  customElements.define('email-plugin', EmailPlugin);
}

export default EmailPlugin;

declare global {
  interface HTMLElementTagNameMap {
    'email-plugin': EmailPlugin;
  }
}
