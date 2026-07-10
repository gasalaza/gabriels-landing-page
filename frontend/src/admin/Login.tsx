import { useSearchParams } from 'react-router-dom';
import type { CSSProperties } from 'react';

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  } as CSSProperties,
  card: {
    maxWidth: 400,
    width: '100%',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '48px 32px',
    textAlign: 'center',
  } as CSSProperties,
  title: {
    fontSize: 24,
    fontWeight: 600,
    letterSpacing: '-0.02em',
    margin: '0 0 8px',
  } as CSSProperties,
  subtitle: {
    fontSize: 14,
    color: 'var(--fg-muted)',
    margin: '0 0 32px',
  } as CSSProperties,
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 44,
    borderRadius: 'var(--radius-sm)',
    background: 'var(--fg)',
    color: 'var(--bg)',
    fontWeight: 500,
    fontSize: 14,
    textDecoration: 'none',
    transition: 'opacity 160ms',
  } as CSSProperties,
  error: {
    padding: '10px 14px',
    borderRadius: 8,
    background: 'oklch(0.65 0.18 25 / 0.1)',
    border: '1px solid oklch(0.65 0.18 25 / 0.3)',
    fontSize: 13,
    color: 'oklch(0.72 0.18 25)',
    marginBottom: 20,
  } as CSSProperties,
};

export function Login() {
  const [params] = useSearchParams();
  const authStatus = params.get('auth');

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Admin</h1>
        <p style={styles.subtitle}>Sign in to manage contact submissions.</p>

        {authStatus === 'forbidden' && (
          <div style={styles.error} role="alert">
            You&apos;re not authorized to access this area.
          </div>
        )}
        {authStatus === 'error' && (
          <div style={styles.error} role="alert">
            Sign-in failed. Please try again.
          </div>
        )}

        <a href="/api/admin/auth/github" style={styles.link}>
          Sign in with GitHub
        </a>
      </div>
    </div>
  );
}
