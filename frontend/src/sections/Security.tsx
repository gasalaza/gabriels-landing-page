import type { CSSProperties } from 'react';
import { Reveal } from '../components';
import { SECURITY_POSTURE } from '../content';

const s = {
  head: { marginBottom: 48, maxWidth: 700 } as CSSProperties,
  intro: {
    fontSize: 'clamp(14px, 1.2vw, 16px)',
    color: 'var(--fg-muted)',
    lineHeight: 1.6,
    maxWidth: 680,
    marginTop: 20,
  } as CSSProperties,
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    background: 'var(--border)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    overflow: 'hidden',
  } as CSSProperties,
  bullet: {
    background: 'var(--bg)',
    padding: '20px 24px',
    fontSize: 14,
    color: 'var(--fg-muted)',
    lineHeight: 1.55,
    display: 'flex',
    gap: 14,
    alignItems: 'baseline',
  } as CSSProperties,
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 2,
    background: 'var(--accent)',
    flexShrink: 0,
    marginTop: 7,
  } as CSSProperties,
  lead: {
    fontWeight: 500,
    color: 'var(--fg)',
  } as CSSProperties,
  linkRow: {
    marginTop: 28,
    fontSize: 14,
    color: 'var(--fg-muted)',
  } as CSSProperties,
  link: {
    color: 'var(--accent)',
    textDecoration: 'none',
    fontWeight: 500,
  } as CSSProperties,
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 24,
  } as CSSProperties,
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 12px',
    border: '1px solid var(--border)',
    borderRadius: 999,
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'var(--fg-muted)',
    background: 'var(--bg-elevated)',
  } as CSSProperties,
  disclosure: {
    marginTop: 48,
    padding: '24px 28px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    maxWidth: 700,
  } as CSSProperties,
  disclosureTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--fg)',
    marginBottom: 10,
  } as CSSProperties,
  disclosureText: {
    fontSize: 13,
    color: 'var(--fg-muted)',
    lineHeight: 1.6,
  } as CSSProperties,
};

export function Security() {
  return (
    <section id="security">
      <div className="wrap">
        <div style={s.head}>
          <Reveal>
            <div>
              <div className="section-label">Security</div>
              <h2 className="section-title">Built Secure</h2>
              <p style={s.intro}>{SECURITY_POSTURE.intro}</p>
            </div>
          </Reveal>
        </div>

        <div style={s.list}>
          {SECURITY_POSTURE.bullets.map((b, i) => (
            <Reveal key={i} delay={i * 60}>
              <div style={s.bullet}>
                <span style={s.bulletDot} />
                <span>
                  <strong style={s.lead}>{b.lead}</strong> — {b.text}
                </span>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={400}>
          <p style={s.linkRow}>
            {SECURITY_POSTURE.linkLine}
            <a href={SECURITY_POSTURE.linkHref} style={s.link}>
              {SECURITY_POSTURE.linkText}
            </a>
            .
          </p>

          <div style={s.chips}>
            {SECURITY_POSTURE.chips.map((c) => (
              <span key={c} style={s.chip}>{c}</span>
            ))}
          </div>
        </Reveal>

        <Reveal delay={500}>
          <div style={s.disclosure}>
            <div style={s.disclosureTitle}>Found a security issue?</div>
            <p style={s.disclosureText}>
              I welcome good-faith vulnerability reports. Please email me at{' '}
              <a href="mailto:security@gasalaza.com" style={s.link}>
                security@gasalaza.com
              </a>{' '}
              with a description of the issue and steps to reproduce. I&apos;ll acknowledge
              your report within 3 business days. Thank you for helping keep this site safe.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
