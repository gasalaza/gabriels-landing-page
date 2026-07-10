import type { CSSProperties } from 'react';
import { Icon } from '../components';
import { SITE } from '../content';

const footerStyles = {
  footer: {
    borderTop: '1px solid var(--border)',
    padding: '40px 0',
    marginTop: 40,
  } as CSSProperties,
  inner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 24,
    flexWrap: 'wrap',
  } as CSSProperties,
  l: { display: 'flex', alignItems: 'center', gap: 14 } as CSSProperties,
  logo: {
    fontFamily: 'var(--font-mono)',
    fontSize: 14,
    fontWeight: 600,
    padding: '7px 10px',
    border: '1px solid var(--border)',
    borderRadius: 6,
    background: 'var(--bg-elevated)',
  } as CSSProperties,
  name: { fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em' } as CSSProperties,
  meta: { fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-dim)', marginTop: 3 } as CSSProperties,
  r: { display: 'flex', gap: 4 } as CSSProperties,
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 12px',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'var(--fg-muted)',
    textDecoration: 'none',
    borderRadius: 6,
    transition: 'all 160ms',
  } as CSSProperties,
};

export function Footer() {
  return (
    <footer style={footerStyles.footer}>
      <div className="wrap" style={footerStyles.inner}>
        <div style={footerStyles.l}>
          <div style={footerStyles.logo}>
            <span style={{ color: 'var(--accent)' }}>G</span>S
          </div>
          <div>
            <div style={footerStyles.name}>{SITE.name}</div>
            <div style={footerStyles.meta}>© 2026</div>
          </div>
        </div>
        <div style={footerStyles.r}>
          <a href={`mailto:${SITE.email}`} style={footerStyles.link} target="_blank" rel="noopener noreferrer">
            <Icon name="mail" size={14} /> email
          </a>
          <a href="https://www.linkedin.com/in/gasalazacr/" style={footerStyles.link} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile">
            <Icon name="linkedin" size={14} /> linkedin
          </a>
        </div>
      </div>
    </footer>
  );
}
