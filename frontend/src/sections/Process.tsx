import type { CSSProperties } from 'react';
import { Reveal } from '../components';

const steps = [
  {
    badge: '01',
    title: 'Discovery call',
    body: "We talk about your goals, audience, and constraints. I'll tell you honestly if I'm the right fit.",
  },
  {
    badge: '02',
    title: 'Proposal & scope',
    body: "You get a clear scope document — what's included, what's not, and a fixed price. No hourly surprises.",
  },
  {
    badge: '03',
    title: 'Build & deliver',
    body: 'I build in the open with weekly check-ins. You get a fast, secure site with clean code you actually own.',
  },
];

export function Process() {
  return (
    <section id="process" style={processStyles.section}>
      <div className="wrap">
        <Reveal>
          <div style={processStyles.head}>
            <div className="section-label">Process</div>
            <h2 className="section-title">Simple, predictable, no surprises.</h2>
          </div>
        </Reveal>

        <div style={processStyles.grid}>
          {steps.map((step, i) => (
            <Reveal key={i} delay={i * 100}>
              <div style={processStyles.card}>
                <div style={processStyles.badge}>{step.badge}</div>
                <h3 style={processStyles.title}>{step.title}</h3>
                <p style={processStyles.body}>{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const processStyles = {
  section: {} as CSSProperties,
  head: { marginBottom: 56, maxWidth: 700 } as CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 20,
  } as CSSProperties,
  card: {
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '32px 28px',
    background: 'var(--bg-elevated)',
    height: '100%',
  } as CSSProperties,
  badge: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--accent)',
    letterSpacing: '0.05em',
    marginBottom: 20,
  } as CSSProperties,
  title: {
    fontSize: 18,
    fontWeight: 500,
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
    margin: '0 0 10px',
  } as CSSProperties,
  body: {
    fontSize: 14,
    lineHeight: 1.55,
    color: 'var(--fg-muted)',
    margin: 0,
    textWrap: 'pretty',
  } as CSSProperties,
};
