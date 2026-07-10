import type { CSSProperties } from 'react';
import { Reveal } from '../components';
import { STACK_GROUPS } from '../content';

const stackStyles = {
  head: { marginBottom: 48, maxWidth: 700 } as CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 1,
    background: 'var(--border)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    overflow: 'hidden',
  } as CSSProperties,
  card: {
    background: 'var(--bg)',
    padding: '28px 24px',
    height: '100%',
    transition: 'background 240ms',
  } as CSSProperties,
  cardHead: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: '1px dashed var(--border)',
  } as CSSProperties,
  cardIdx: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--accent)',
  } as CSSProperties,
  cardTitle: {
    fontSize: 15,
    fontWeight: 500,
    letterSpacing: '-0.015em',
  } as CSSProperties,
  items: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  } as CSSProperties,
  item: {
    fontSize: 13,
    color: 'var(--fg-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontFamily: 'var(--font-mono)',
  } as CSSProperties,
  itemDot: {
    width: 4,
    height: 4,
    borderRadius: 1,
    background: 'var(--fg-dim)',
  } as CSSProperties,
};

export function Stack() {
  return (
    <section id="stack">
      <div className="wrap">
        <div style={stackStyles.head}>
          <Reveal>
            <div>
              <div className="section-label">Stack</div>
              <h2 className="section-title">Tools I reach for.</h2>
              <p className="section-sub">
                Ten years of shipping has narrowed the list. These are the technologies I&apos;ve
                used in production, not just played with.
              </p>
            </div>
          </Reveal>
        </div>

        <div style={stackStyles.grid}>
          {STACK_GROUPS.map((g, i) => (
            <Reveal key={i} delay={i * 80}>
              <div style={stackStyles.card}>
                <div style={stackStyles.cardHead}>
                  <div style={stackStyles.cardIdx}>{String(i + 1).padStart(2, '0')}</div>
                  <div style={stackStyles.cardTitle}>{g.title}</div>
                </div>
                <div style={stackStyles.items}>
                  {g.items.map((it, j) => (
                    <div key={j} style={stackStyles.item}>
                      <span style={stackStyles.itemDot} />
                      {it}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
