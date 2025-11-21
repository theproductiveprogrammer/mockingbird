import { useState, useEffect } from 'react';
import { PluginComponentProps } from './types';

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

interface SentReply {
  id: string;
  message_id: string;
  original_subject: string;
  original_from: string;
  reply_text: string;
  sent_at: string;
}

interface Config {
  host: string;
  port: string;
  fromEmail: string;
  emailCount: number;
  repliesCount: number;
}

export default function EmailPluginUI({ api }: PluginComponentProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [emailDetails, setEmailDetails] = useState<EmailDetails | null>(null);
  const [replyText, setReplyText] = useState('');
  const [repliedEmails, setRepliedEmails] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async () => {
    try {
      setLoading(true);
      setError(null);

      const result: any = await api.action('load_emails', 'all');

      if (!result.success) {
        throw new Error(result.message || 'Failed to load emails');
      }

      setEmails(result.emails || []);
      setConfig(result.config);
      setRepliedEmails(new Set(result.replied_ids || []));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load emails');
    } finally {
      setLoading(false);
    }
  };

  const viewEmail = async (emailId: string) => {
    try {
      setSelectedEmail(emailId);
      setEmailDetails(null);

      const result: any = await api.action('view_email', `email_${emailId}`);

      if (result.success && result.data) {
        setEmailDetails(result.data);
      }
    } catch (err) {
      console.error('Failed to load email details:', err);
    }
  };

  const handleReply = async (emailId: string) => {
    if (!replyText.trim()) {
      return;
    }

    try {
      setSending(true);
      const result: any = await api.action('reply_email', `email_${emailId}`, {
        text: replyText,
      });

      if (result.success) {
        setRepliedEmails(prev => new Set([...prev, emailId]));
        setReplyText('');
        setSelectedEmail(null);
        setEmailDetails(null);
        await loadEmails(); // Refresh list
      } else {
        alert(result.message || 'Failed to send reply');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-gray-600">Loading emails...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-sm font-medium text-red-900 mb-2">Error</h3>
        <p className="text-xs text-red-700 mb-4">{error}</p>
        <button
          onClick={loadEmails}
          className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Email Plugin (Mailpit)</h2>
          {config && (
            <p className="text-xs text-gray-500 mt-1">
              Mailpit: <span className="font-mono">{config.host}:{config.port}</span> •
              From: <span className="font-mono">{config.fromEmail}</span>
            </p>
          )}
        </div>
        <button
          onClick={loadEmails}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      {config && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Emails</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{config.emailCount}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Replies Sent</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{config.repliesCount}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Workspace</div>
            <div className="text-sm font-medium text-gray-900 mt-1">{api.workspace}</div>
          </div>
        </div>
      )}

      {/* Email List */}
      {emails.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-600">No emails found</p>
          <p className="text-xs text-gray-500 mt-1">
            Make sure Mailpit is running and accessible
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-900">
              Inbox ({emails.length} {emails.length === 1 ? 'email' : 'emails'})
            </h3>
          </div>

          <div className="divide-y divide-gray-200">
            {emails.map((email) => {
              const fromStr = email.From?.Name || email.From?.Address || 'Unknown';
              const subject = email.Subject || '(No Subject)';
              const hasReplied = repliedEmails.has(email.ID);
              const isSelected = selectedEmail === email.ID;

              return (
                <div key={email.ID} className="bg-white hover:bg-gray-50">
                  <div
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => viewEmail(email.ID)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {subject}
                          </h4>
                          {hasReplied && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                              REPLIED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          From: {fromStr} • {email.Created || email.Date || 'Unknown date'}
                        </p>
                        {email.Snippet && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{email.Snippet}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Email Details (expanded) */}
                  {isSelected && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      {emailDetails ? (
                        <div className="space-y-3 mt-3">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-500">From:</span>{' '}
                                <span className="font-medium text-gray-900">
                                  {emailDetails.From.Name || emailDetails.From.Address}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Date:</span>{' '}
                                <span className="font-medium text-gray-900">{emailDetails.Date}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-3">
                            <pre className="text-xs text-gray-900 whitespace-pre-wrap font-sans">
                              {emailDetails.Text || emailDetails.HTML || 'No content'}
                            </pre>
                          </div>

                          {!hasReplied && (
                            <div className="space-y-2">
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Type your reply..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                rows={4}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleReply(email.ID)}
                                  disabled={!replyText.trim() || sending}
                                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {sending ? 'Sending...' : 'Send Reply'}
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedEmail(null);
                                    setEmailDetails(null);
                                    setReplyText('');
                                  }}
                                  className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-xs text-gray-500">Loading details...</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
