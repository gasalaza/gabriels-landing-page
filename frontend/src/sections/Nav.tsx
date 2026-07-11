import { useState, useEffect, type CSSProperties } from 'react';
import { Icon } from '../components';
import { useTheme } from '../hooks/useTheme';

const links: [string, string][] = [
  ['About', '#about'],
  ['Stack', '#stack'],
  ['Services', '#services'],
];

const navStyles = {
  nav: (scrolled: boolean): CSSProperties => ({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    padding: scrolled ? '10px 0' : '18px 0',
    background: scrolled ? 'var(--nav-bg)' : 'transparent',
    backdropFilter: scrolled ? 'saturate(160%) blur(12px)' : 'none',
    WebkitBackdropFilter: scrolled ? 'saturate(160%) blur(12px)' : 'none',
    borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
    transition: 'all 300ms cubic-bezier(0.22, 1, 0.36, 1)',
  }),
  inner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
  } as CSSProperties,
  logo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    textDecoration: 'none',
    color: 'var(--fg)',
  } as CSSProperties,
  logoMark: {
    fontFamily: 'var(--font-mono)',
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: '-0.02em',
    padding: '5px 8px',
    border: '1px solid var(--border)',
    borderRadius: 6,
    background: 'var(--bg-elevated)',
  } as CSSProperties,
  logoLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    letterSpacing: '-0.01em',
  } as CSSProperties,
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  } as CSSProperties,
  link: {
    fontFamily: 'var(--font-sans)',
    fontSize: 13,
    color: 'var(--fg-muted)',
    textDecoration: 'none',
    padding: '8px 12px',
    borderRadius: 6,
    transition: 'color 160ms, background 160ms',
  } as CSSProperties,
  themeToggle: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    border: '1px solid var(--border)',
    borderRadius: 6,
    background: 'transparent',
    color: 'var(--fg-muted)',
    cursor: 'pointer',
    transition: 'background 160ms, border-color 160ms',
  } as CSSProperties,
};

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav style={navStyles.nav(scrolled)} aria-label="Main navigation">
      <div className="wrap" style={navStyles.inner}>
        <a href="#top" style={navStyles.logo}>
          <span style={navStyles.logoMark}>
            <span style={{ color: 'var(--accent)' }}>G</span>S
          </span>
          <span style={navStyles.logoLabel}>
            <span style={{ color: 'var(--fg)' }}>gasalaza</span>
            <span style={{ color: 'var(--fg-dim)' }}>.com</span>
          </span>
        </a>
        <div style={navStyles.links}>
          {links.map(([label, href]) => (
            <a key={href} href={href} style={navStyles.link}>
              {label}
            </a>
          ))}
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={navStyles.themeToggle}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
        </button>
        <a href="#contact" className="btn btn-primary" style={{ height: 36 }}>
          Let&apos;s talk
          <Icon name="arrow" size={14} />
        </a>
      </div>
    </nav>
  );
}
