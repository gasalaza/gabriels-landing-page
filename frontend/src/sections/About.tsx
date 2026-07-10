import type { CSSProperties } from 'react';
import { Reveal } from '../components';
import { SITE } from '../content';

const aboutStyles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)',
    gap: 'clamp(32px, 6vw, 80px)',
    alignItems: 'start',
  } as CSSProperties,
  em: { color: 'var(--accent)', fontStyle: 'italic', fontWeight: 500 } as CSSProperties,
  col: { paddingTop: 44 } as CSSProperties,
  p: {
    fontSize: 'clamp(16px, 1.25vw, 19px)',
    lineHeight: 1.65,
    color: 'var(--fg-muted)',
    margin: '0 0 40px',
    whiteSpace: 'pre-line',
    textWrap: 'pretty',
  } as CSSProperties,
  pillars: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 1,
    background: 'var(--border)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    overflow: 'hidden',
  } as CSSProperties,
  pillar: {
    background: 'var(--bg)',
    padding: '18px 20px',
  } as CSSProperties,
  pillarK: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--fg-dim)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 6,
  } as CSSProperties,
  pillarV: {
    fontSize: 14,
    color: 'var(--fg)',
    lineHeight: 1.5,
  } as CSSProperties,
};

const pillars = [
  { k: 'Backend', v: '10yr · C# / .NET, cloud-native' },
  { k: 'Frontend', v: 'Next.js, React, TypeScript, Tailwind' },
  { k: 'Cloud', v: 'Azure, Service Fabric, AKS, Docker' },
  { k: 'Data', v: 'SQL Server, Cosmos DB, Postgres' },
];

export function About() {
  return (
    <section id="about">
      <div className="wrap">
        <div style={aboutStyles.grid}>
          <Reveal>
            <div>
              <div className="section-label">About</div>
              <h2 className="section-title">
                I like systems that are boring
                <br />— in the <em style={aboutStyles.em}>best</em> way.
              </h2>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div style={aboutStyles.col}>
              <p style={aboutStyles.p}>{SITE.about}</p>
              <div style={aboutStyles.pillars}>
                {pillars.map((p, i) => (
                  <div key={i} style={aboutStyles.pillar}>
                    <div style={aboutStyles.pillarK}>{p.k}</div>
                    <div style={aboutStyles.pillarV}>{p.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
