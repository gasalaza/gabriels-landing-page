import { useState, type CSSProperties } from 'react';
import { Reveal, Icon } from '../components';
import { SITE } from '../content';

function MetaItem({ icon, label, copy }: { icon: 'pin' | 'mail'; label: string; copy?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [hover, setHover] = useState(false);
  const onClick = () => {
    if (!copy) return;
    void navigator.clipboard?.writeText(label);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...heroStyles.metaItem,
        cursor: copy ? 'pointer' : 'default',
        background: hover && copy ? 'var(--bg-elevated)' : 'transparent',
        borderColor: hover && copy ? 'var(--border)' : 'transparent',
      }}
    >
      <Icon name={icon} size={13} style={{ color: 'var(--fg-dim)' }} />
      <span>{copied ? 'copied ✓' : label}</span>
      {copy && !copied && (
        <Icon name="copy" size={11} style={{ color: 'var(--fg-dim)', opacity: hover ? 1 : 0.5 }} />
      )}
    </button>
  );
}

export function Hero() {
  return (
    <section id="top" style={heroStyles.section}>
      <div className="wrap" style={heroStyles.grid}>
        <div>
          <Reveal>
            <div className="chip" style={{ marginBottom: 28 }}>
              <span className="dot pulse" />
              {SITE.available}
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h1 style={heroStyles.h1}>
              Your next site —
              <br />
              built fast,
              <br />
              <span style={heroStyles.accentWord}>built secure.</span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p style={heroStyles.lead}>
              I&apos;m Gabriel, a full-stack engineer with 10+ years of shipping production
              software. I build landing pages and web apps for founders who care about speed,
              security, and getting it right the first time. Security+ &amp; CySA+ certified.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div style={heroStyles.cta}>
              <a
                href="https://cal.com/gasalazacr/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Book a free intro call
                <Icon name="arrowUpRight" size={14} />
              </a>
              <a href="#services" className="btn btn-ghost">
                See how I work
                <Icon name="arrow" size={14} />
              </a>
            </div>
          </Reveal>

          <Reveal delay={340}>
            <div style={heroStyles.meta}>
              <MetaItem icon="pin" label={SITE.location} />
              <MetaItem icon="mail" label={SITE.email} copy />
            </div>
          </Reveal>
        </div>

        <Reveal delay={200} style={heroStyles.right}>
          <div style={heroStyles.photoCard}>
            <div style={heroStyles.photoFrame}>
              <img src="/assets/gabriel.jpeg" alt="Gabriel Salazar" style={heroStyles.photo} />
              <div style={heroStyles.photoOverlay} />
              <div style={heroStyles.photoTag}>
                <span className="dot pulse" style={{ width: 6, height: 6, display: 'inline-block' }} />
                <span>online · Costa Rica (GMT-6)</span>
              </div>
              <div style={heroStyles.photoMeta}>
                <div>
                  <div style={heroStyles.photoK}>Name</div>
                  <div style={heroStyles.photoV}>{SITE.name}</div>
                </div>
                <div>
                  <div style={heroStyles.photoK}>Role</div>
                  <div style={heroStyles.photoV}>Software Engineer</div>
                </div>
              </div>
            </div>

            <div style={heroStyles.stats}>
              {SITE.stats.map((s, i) => (
                <div
                  key={i}
                  style={{
                    ...heroStyles.stat,
                    borderRight: i < SITE.stats.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div style={heroStyles.statN}>{s.n}</div>
                  <div style={heroStyles.statL}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const heroStyles = {
  section: {
    paddingTop: 'clamp(140px, 18vw, 200px)',
    paddingBottom: 'clamp(60px, 8vw, 120px)',
    position: 'relative',
  } as CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr)',
    gap: 'clamp(32px, 6vw, 80px)',
    alignItems: 'center',
  } as CSSProperties,
  h1: {
    fontSize: 'clamp(40px, 6.2vw, 78px)',
    fontWeight: 600,
    lineHeight: 1.02,
    letterSpacing: '-0.035em',
    margin: '0 0 28px',
    textWrap: 'balance',
  } as CSSProperties,
  accentWord: {
    fontStyle: 'italic',
    fontWeight: 500,
    color: 'var(--accent)',
  } as CSSProperties,
  lead: {
    fontSize: 'clamp(16px, 1.3vw, 18px)',
    color: 'var(--fg-muted)',
    lineHeight: 1.6,
    margin: '0 0 36px',
    maxWidth: 540,
    textWrap: 'pretty',
  } as CSSProperties,
  cta: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 36,
  } as CSSProperties,
  meta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    paddingTop: 24,
    borderTop: '1px dashed var(--border)',
  } as CSSProperties,
  metaItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    border: '1px solid transparent',
    borderRadius: 6,
    padding: '6px 10px',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'var(--fg-muted)',
    transition: 'all 140ms',
    background: 'transparent',
  } as CSSProperties,
  right: {} as CSSProperties,
  photoCard: {
    position: 'relative',
  } as CSSProperties,
  photoFrame: {
    position: 'relative',
    aspectRatio: '4 / 5',
    borderRadius: 14,
    overflow: 'hidden',
    border: '1px solid var(--border)',
    background: 'var(--bg-elevated)',
    boxShadow: '0 40px 80px -30px var(--photo-shadow), 0 0 0 1px var(--photo-ring)',
  } as CSSProperties,
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    filter: 'saturate(0.92) contrast(1.02)',
  } as CSSProperties,
  photoOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, transparent 40%, var(--photo-fade) 100%)',
    pointerEvents: 'none',
  } as CSSProperties,
  photoTag: {
    position: 'absolute',
    top: 16,
    left: 16,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    background: 'var(--nav-bg)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid var(--border)',
    borderRadius: 999,
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.04em',
    color: 'var(--fg-muted)',
  } as CSSProperties,
  photoMeta: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  } as CSSProperties,
  photoK: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--photo-label)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: 4,
  } as CSSProperties,
  photoV: {
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--fg)',
    letterSpacing: '-0.01em',
  } as CSSProperties,
  stats: {
    marginTop: 14,
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    overflow: 'hidden',
    background: 'var(--bg-elevated)',
  } as CSSProperties,
  stat: {
    padding: '14px 10px',
    textAlign: 'center',
  } as CSSProperties,
  statN: {
    fontFamily: 'var(--font-mono)',
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--fg)',
    letterSpacing: '-0.02em',
  } as CSSProperties,
  statL: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--fg-dim)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginTop: 3,
  } as CSSProperties,
};
