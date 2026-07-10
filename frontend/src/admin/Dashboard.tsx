import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { getMessages, markRead, logout } from './api';
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
    } catch {
      // optimistic rollback not needed — re-fetch
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
              <div key={m.id} style={{ ...styles.row, opacity: m.read ? 0.6 : 1 }}>
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
                    onClick={() => void handleMarkRead(m.id, m.read)}
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
};
