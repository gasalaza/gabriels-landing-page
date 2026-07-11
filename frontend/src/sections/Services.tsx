import { useState, type CSSProperties } from 'react';
import { Reveal, Icon } from '../components';
import { SERVICES } from '../content';
import type { Service } from '../content';

function ServiceCard({ s, featured }: { s: Service; featured: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...servicesStyles.card,
        borderColor: featured || hover ? 'var(--accent-ring)' : 'var(--border)',
        background: featured
          ? 'linear-gradient(180deg, var(--accent-dim) 0%, var(--bg-elevated) 60%)'
          : 'var(--bg-elevated)',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      <div style={servicesStyles.cardHead}>
        <div style={servicesStyles.cardBadge}>{s.badge}</div>
        {featured && <div style={servicesStyles.cardFeatured}>Most popular</div>}
      </div>
      <h3 style={servicesStyles.cardTitle}>{s.title}</h3>
      <p style={servicesStyles.cardDesc}>{s.desc}</p>
      <div style={servicesStyles.divider} />
      <ul style={servicesStyles.points}>
        {s.points.map((p, i) => (
          <li key={i} style={servicesStyles.point}>
            <span style={servicesStyles.checkWrap}>
              <Icon name="check" size={11} />
            </span>
            {p}
          </li>
        ))}
      </ul>
      <a
        href="#contact"
        className={featured ? 'btn btn-primary' : 'btn btn-ghost'}
        style={{ width: '100%', marginTop: 20 }}
      >
        Get a quote
        <Icon name="arrow" size={14} />
      </a>
    </div>
  );
}

export function Services() {
  return (
    <section id="services" style={servicesStyles.section}>
      <div className="wrap">
        <div style={servicesStyles.head}>
          <Reveal>
            <div>
              <div className="section-label">Services</div>
              <h2 className="section-title">Three ways we can work together.</h2>
              <p className="section-sub">
                From a single landing page to a full-stack product or a backend audit — pick the
                scope, I&apos;ll bring the engineering.
              </p>
            </div>
          </Reveal>
        </div>

        <div style={servicesStyles.grid}>
          {SERVICES.map((s, i) => (
            <Reveal key={i} delay={i * 100}>
              <ServiceCard s={s} featured={i === 1} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={320}>
          <div style={servicesStyles.footer}>
            <div style={servicesStyles.footerL}>
              <span className="dot pulse" style={servicesStyles.liveDot} />
              <span>Taking on 1–2 new projects for Q2 2026.</span>
            </div>
            <a href="#contact" className="btn btn-ghost">
              Start a project
              <Icon name="arrow" size={14} />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const servicesStyles = {
  section: {
    background:
      'linear-gradient(180deg, transparent 0%, var(--section-tint) 50%, transparent 100%)',
  } as CSSProperties,
  head: { marginBottom: 56, maxWidth: 700 } as CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 20,
  } as CSSProperties,
  card: {
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '32px 28px',
    transition: 'all 300ms cubic-bezier(0.22, 1, 0.36, 1)',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  } as CSSProperties,
  cardHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  } as CSSProperties,
  cardBadge: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--accent)',
    letterSpacing: '0.05em',
  } as CSSProperties,
  cardFeatured: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    padding: '4px 9px',
    borderRadius: 999,
    background: 'var(--accent)',
    color: 'var(--accent-fg)',
    fontWeight: 500,
  } as CSSProperties,
  cardTitle: {
    fontSize: 20,
    fontWeight: 500,
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
    margin: '0 0 10px',
    textWrap: 'balance',
  } as CSSProperties,
  cardDesc: {
    fontSize: 14,
    lineHeight: 1.55,
    color: 'var(--fg-muted)',
    margin: 0,
    textWrap: 'pretty',
  } as CSSProperties,
  divider: {
    height: 1,
    background: 'var(--border)',
    margin: '22px 0 18px',
  } as CSSProperties,
  points: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    flex: 1,
  } as CSSProperties,
  point: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 13,
    color: 'var(--fg-muted)',
  } as CSSProperties,
  checkWrap: {
    width: 18,
    height: 18,
    borderRadius: 999,
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  } as CSSProperties,
  footer: {
    marginTop: 40,
    padding: '18px 22px',
    border: '1px dashed var(--border)',
    borderRadius: 12,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
    flexWrap: 'wrap',
  } as CSSProperties,
  footerL: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 13,
    color: 'var(--fg-muted)',
    fontFamily: 'var(--font-mono)',
  } as CSSProperties,
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--accent)',
    boxShadow: '0 0 0 3px var(--accent-dim)',
    display: 'inline-block',
  } as CSSProperties,
};
