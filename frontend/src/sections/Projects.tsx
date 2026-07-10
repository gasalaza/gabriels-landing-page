import { useState, type CSSProperties } from 'react';
import { Reveal, Icon } from '../components';
import { PROJECTS } from '../content';
import type { Project } from '../content';

function ProjectCard({ p, index }: { p: Project; index: number }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={projectsStyles.card}
      role="article"
    >
      <div style={projectsStyles.thumb}>
        <svg width="100%" height="100%" viewBox="0 0 400 240" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <pattern
              id={`stripes-${index}`}
              patternUnits="userSpaceOnUse"
              width="14"
              height="14"
              patternTransform="rotate(45)"
            >
              <rect width="14" height="14" fill="oklch(0.2 0.008 255)" />
              <line x1="0" y1="0" x2="0" y2="14" stroke="oklch(0.24 0.008 255)" strokeWidth="7" />
            </pattern>
          </defs>
          <rect width="400" height="240" fill={`url(#stripes-${index})`} />
        </svg>
        <div style={projectsStyles.thumbLabel}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-dim)' }}>
            [ {p.title.toLowerCase().replace(/\s+/g, '_')}.png ]
          </span>
        </div>
        <div
          style={{
            ...projectsStyles.thumbHover,
            opacity: hover ? 1 : 0,
          }}
        >
          <div style={projectsStyles.thumbArrow}>
            <Icon name="arrowUpRight" size={18} />
          </div>
        </div>
      </div>

      <div style={projectsStyles.body}>
        <div style={projectsStyles.role}>{p.role}</div>
        <h3 style={projectsStyles.title}>{p.title}</h3>
        <p style={projectsStyles.desc}>{p.desc}</p>
        <div style={projectsStyles.tags}>
          {p.tags.map((t, i) => (
            <span key={i} style={projectsStyles.tag}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Projects() {
  return (
    <section id="projects">
      <div className="wrap">
        <div style={projectsStyles.head}>
          <Reveal>
            <div>
              <div className="section-label">Selected projects</div>
              <h2 className="section-title">A few things I&apos;ve built.</h2>
              <p className="section-sub">
                Production work, side projects, and internal tools — the through-line is systems
                that hold up under load.
              </p>
            </div>
          </Reveal>
        </div>

        <div style={projectsStyles.grid}>
          {PROJECTS.map((p, i) => (
            <Reveal key={i} delay={i * 80}>
              <ProjectCard p={p} index={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const projectsStyles = {
  head: { marginBottom: 48, maxWidth: 700 } as CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 20,
  } as CSSProperties,
  card: {
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    overflow: 'hidden',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'border-color 240ms, transform 240ms',
  } as CSSProperties,
  thumb: {
    position: 'relative',
    aspectRatio: '16 / 9',
    background: 'var(--bg)',
    overflow: 'hidden',
    borderBottom: '1px solid var(--border)',
  } as CSSProperties,
  thumbLabel: {
    position: 'absolute',
    top: 12,
    left: 12,
    padding: '4px 8px',
    background: 'oklch(0.14 0.008 255 / 0.75)',
    backdropFilter: 'blur(6px)',
    borderRadius: 4,
    border: '1px solid var(--border)',
  } as CSSProperties,
  thumbHover: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, transparent 40%, var(--accent-dim))',
    transition: 'opacity 260ms',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    padding: 16,
  } as CSSProperties,
  thumbArrow: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    background: 'var(--accent)',
    color: 'var(--accent-fg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as CSSProperties,
  body: { padding: '20px 22px 24px' } as CSSProperties,
  role: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--fg-dim)',
    letterSpacing: '0.04em',
    marginBottom: 8,
  } as CSSProperties,
  title: {
    fontSize: 18,
    fontWeight: 500,
    letterSpacing: '-0.02em',
    margin: '0 0 10px',
  } as CSSProperties,
  desc: {
    fontSize: 13,
    lineHeight: 1.55,
    color: 'var(--fg-muted)',
    margin: '0 0 16px',
    textWrap: 'pretty',
  } as CSSProperties,
  tags: { display: 'flex', flexWrap: 'wrap', gap: 5 } as CSSProperties,
  tag: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    padding: '3px 8px',
    border: '1px solid var(--border)',
    borderRadius: 999,
    color: 'var(--fg-muted)',
    background: 'var(--bg)',
  } as CSSProperties,
};
