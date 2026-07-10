import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { getMessages, markRead, logout, deleteMessage } from './api';
import type { Message } from './api';

interface DashboardProps {
  login: string;
  onLogout: () => void;
}

export function Dashboard({ login, onLogout }: DashboardProps) {
  const [items, setItems] = useState<Message[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Message | null>(null);
  const limit = 20;

  const fetchMessages = useCallback(async (currentOffset: number) => {
    setLoading(true);
    try {
      const data = await getMessages(limit, currentOffset);
      setItems(data.items);
      setTotal(data.total);
    } catch {
      // silently handle — if session expired the parent will catch on next getMe
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMessages(offset);
  }, [offset, fetchMessages]);

  const handleMarkRead = async (id: string, currentRead: boolean) => {
    try {
      await markRead(id, !currentRead);
      setItems((prev) =>
        prev.map((m) => (m.id === id ? { ...m, read: !currentRead } : m)),
      );
      setSelected((prev) => (prev?.id === id ? { ...prev, read: !currentRead } : prev));
    } catch {
      void fetchMessages(offset);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this message? This cannot be undone.')) return;
    try {
      await deleteMessage(id);
      setItems((prev) => prev.filter((m) => m.id !== id));
      setTotal((prev) => prev - 1);
      if (selected?.id === id) setSelected(null);
    } catch {
      void fetchMessages(offset);
    }
  };

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  const hasNext = offset + limit < total;
  const hasPrev = offset > 0;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Messages</h1>
          <span style={styles.meta}>Signed in as {login}</span>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => void handleLogout()}
          aria-label="Logout"
        >
          Logout
        </button>
      </header>

      {loading && items.length === 0 ? (
        <div style={styles.empty}>Loading…</div>
      ) : total === 0 ? (
        <div style={styles.empty}>No messages yet.</div>
      ) : (
        <>
          <div style={styles.table}>
            <div style={styles.tableHead}>
              <span style={styles.cellName}>Name</span>
              <span style={styles.cellEmail}>Email</span>
              <span style={styles.cellType}>Type</span>
              <span style={styles.cellMsg}>Message</span>
              <span style={styles.cellDate}>Date</span>
              <span style={styles.cellAction}>Read</span>
            </div>
            {items.map((m) => (
              <div
                key={m.id}
                style={{ ...styles.row, opacity: m.read ? 0.6 : 1, cursor: 'pointer' }}
                onClick={() => setSelected(m)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelected(m); }}
                aria-label={`View message from ${m.name}`}
              >
                <span style={styles.cellName}>{m.name}</span>
                <span style={styles.cellEmail}>{m.email}</span>
                <span style={styles.cellType}>{m.projectType}</span>
                <span style={styles.cellMsg}>{m.message}</span>
                <span style={styles.cellDate}>
                  {new Date(m.createdAt).toLocaleDateString()}
                </span>
                <span style={styles.cellAction}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); void handleMarkRead(m.id, m.read); }}
                    style={styles.toggleBtn}
                    aria-label={m.read ? `Mark unread ${m.name}` : `Mark read ${m.name}`}
                  >
                    {m.read ? '✓' : '○'}
                  </button>
                </span>
              </div>
            ))}
          </div>

          <div style={styles.pagination}>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={!hasPrev}
              onClick={() => setOffset((o) => Math.max(0, o - limit))}
            >
              Previous
            </button>
            <span style={styles.pageInfo}>
              {offset + 1}–{Math.min(offset + limit, total)} of {total}
            </span>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={!hasNext}
              onClick={() => setOffset((o) => o + limit)}
            >
              Next
            </button>
          </div>
        </>
      )}

      {selected && (
        <MessageDetail
          message={selected}
          onClose={() => setSelected(null)}
          onMarkRead={(read) => void handleMarkRead(selected.id, !read)}
          onDelete={() => void handleDelete(selected.id)}
        />
      )}
    </div>
  );
}

interface MessageDetailProps {
  message: Message;
  onClose: () => void;
  onMarkRead: (read: boolean) => void;
  onDelete: () => void;
}

function MessageDetail({ message, onClose, onMarkRead, onDelete }: MessageDetailProps) {
  const replySubject = encodeURIComponent('Re: your project inquiry');
  const mailtoHref = `mailto:${message.email}?subject=${replySubject}`;

  return (
    <div style={styles.overlay} onClick={onClose} role="dialog" aria-label="Message detail">
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.panelHeader}>
          <h2 style={styles.panelTitle}>Message</h2>
          <button
            type="button"
            onClick={onClose}
            style={styles.closeBtn}
            aria-label="Close detail"
          >
            ✕
          </button>
        </div>

        <div style={styles.panelBody}>
          <div style={styles.fieldRow}>
            <span style={styles.fieldLabel}>From</span>
            <span style={styles.fieldValue}>{message.name}</span>
          </div>
          <div style={styles.fieldRow}>
            <span style={styles.fieldLabel}>Email</span>
            <span style={styles.fieldValue}>{message.email}</span>
          </div>
          <div style={styles.fieldRow}>
            <span style={styles.fieldLabel}>Type</span>
            <span style={styles.fieldValue}>{message.projectType}</span>
          </div>
          <div style={styles.fieldRow}>
            <span style={styles.fieldLabel}>Date</span>
            <span style={styles.fieldValue}>
              {new Date(message.createdAt).toLocaleString()}
            </span>
          </div>
          <div style={styles.fieldRow}>
            <span style={styles.fieldLabel}>Status</span>
            <span style={styles.fieldValue}>{message.read ? 'Read' : 'Unread'}</span>
          </div>

          <div style={styles.messageBlock}>
            <span style={styles.fieldLabel}>Message</span>
            <div style={styles.messageContent}>
              {message.message || '(no message)'}
            </div>
          </div>
        </div>

        <div style={styles.panelActions}>
          <a
            href={mailtoHref}
            className="btn btn-primary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            Reply
          </a>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => onMarkRead(message.read)}
          >
            {message.read ? 'Mark unread' : 'Mark read'}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onDelete}
            style={{ color: 'oklch(0.72 0.18 25)' }}
            aria-label="Delete message"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '24px clamp(20px, 4vw, 48px)',
    minHeight: '100vh',
  } as CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 24,
  } as CSSProperties,
  title: {
    fontSize: 28,
    fontWeight: 600,
    letterSpacing: '-0.02em',
    margin: 0,
  } as CSSProperties,
  meta: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'var(--fg-dim)',
  } as CSSProperties,
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    color: 'var(--fg-muted)',
    fontSize: 15,
  } as CSSProperties,
  table: {
    border: '1px solid var(--border)',
    borderRadius: 12,
    overflow: 'hidden',
  } as CSSProperties,
  tableHead: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.2fr 0.7fr 2fr 0.8fr 0.5fr',
    gap: 8,
    padding: '12px 16px',
    background: 'var(--bg-elevated)',
    borderBottom: '1px solid var(--border)',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--fg-dim)',
  } as CSSProperties,
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.2fr 0.7fr 2fr 0.8fr 0.5fr',
    gap: 8,
    padding: '14px 16px',
    borderBottom: '1px solid var(--border)',
    fontSize: 13,
    alignItems: 'center',
    transition: 'opacity 200ms',
  } as CSSProperties,
  cellName: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as CSSProperties,
  cellEmail: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--fg-muted)' } as CSSProperties,
  cellType: { fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-dim)' } as CSSProperties,
  cellMsg: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--fg-muted)' } as CSSProperties,
  cellDate: { fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-dim)' } as CSSProperties,
  cellAction: { textAlign: 'center' } as CSSProperties,
  toggleBtn: {
    background: 'none',
    border: '1px solid var(--border)',
    borderRadius: 6,
    width: 28,
    height: 28,
    cursor: 'pointer',
    color: 'var(--accent)',
    fontSize: 14,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as CSSProperties,
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 20,
  } as CSSProperties,
  pageInfo: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'var(--fg-dim)',
  } as CSSProperties,
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 100,
    background: 'oklch(0 0 0 / 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  } as CSSProperties,
  panel: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    width: '100%',
    maxWidth: 560,
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 24px 48px -20px oklch(0 0 0 / 0.5)',
  } as CSSProperties,
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid var(--border)',
  } as CSSProperties,
  panelTitle: {
    fontSize: 18,
    fontWeight: 600,
    letterSpacing: '-0.02em',
    margin: 0,
  } as CSSProperties,
  closeBtn: {
    background: 'none',
    border: '1px solid var(--border)',
    borderRadius: 6,
    width: 32,
    height: 32,
    cursor: 'pointer',
    color: 'var(--fg-muted)',
    fontSize: 14,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as CSSProperties,
  panelBody: {
    padding: 20,
    overflowY: 'auto',
    flex: 1,
  } as CSSProperties,
  fieldRow: {
    display: 'flex',
    gap: 12,
    padding: '8px 0',
    borderBottom: '1px solid var(--border)',
    fontSize: 13,
    alignItems: 'baseline',
  } as CSSProperties,
  fieldLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--fg-dim)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    minWidth: 60,
    flexShrink: 0,
  } as CSSProperties,
  fieldValue: {
    color: 'var(--fg)',
    wordBreak: 'break-word',
  } as CSSProperties,
  messageBlock: {
    marginTop: 12,
  } as CSSProperties,
  messageContent: {
    marginTop: 8,
    padding: 14,
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 14,
    lineHeight: 1.6,
    color: 'var(--fg)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxHeight: 260,
    overflowY: 'auto',
  } as CSSProperties,
  panelActions: {
    display: 'flex',
    gap: 8,
    padding: '16px 20px',
    borderTop: '1px solid var(--border)',
  } as CSSProperties,
};
