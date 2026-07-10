import { useState, type CSSProperties, type FormEvent } from 'react';
import { Reveal, Icon } from '../components';
import { SITE } from '../content';

type FormStatus = 'idle' | 'sending' | 'sent' | 'error';

interface FormData {
  name: string;
  email: string;
  msg: string;
  budget: string;
  website: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  msg?: string;
}

const budgetOpts = [
  { v: 'landing', l: 'Landing page', d: 'Marketing site' },
  { v: 'fullstack', l: 'Full-stack app', d: 'Web app' },
  { v: 'consult', l: 'Security', d: 'Security review' },
  { v: 'other', l: 'Other', d: "let's chat" },
];

function validate(form: FormData): FormErrors {
  const e: FormErrors = {};
  if (!form.name.trim() || form.name.length > 100) e.name = 'Your name, please (max 100 chars).';
  if (!/^\S+@\S+\.\S+$/.test(form.email) || form.email.length > 200)
    e.email = "That email doesn't look right.";
  if (form.msg.trim().length < 10 || form.msg.length > 5000)
    e.msg = 'A bit more detail would help (10–5000 chars).';
  return e;
}

export function Contact() {
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    msg: '',
    budget: 'landing',
    website: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [focus, setFocus] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setStatus('sending');
    setErrorMessage('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: form.msg,
          projectType: form.budget,
          website: form.website,
        }),
      });

      if (res.status === 201) {
        setStatus('sent');
      } else if (res.status === 429) {
        setStatus('error');
        setErrorMessage('Too many messages — please try again later.');
      } else if (res.status === 400) {
        const data = (await res.json()) as { errors?: Record<string, string> };
        setStatus('error');
        if (data.errors) {
          setErrors({
            name: data.errors['name'],
            email: data.errors['email'],
            msg: data.errors['message'],
          });
          setErrorMessage('Please fix the errors above.');
        } else {
          setErrorMessage('Please check your input and try again.');
        }
      } else {
        setStatus('error');
        setErrorMessage('Something went wrong — email me directly.');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Something went wrong — email me directly.');
    }
  };

  const update = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [k]: e.target.value });
    if (errors[k as keyof FormErrors]) setErrors({ ...errors, [k]: undefined });
  };

  return (
    <section id="contact">
      <div className="wrap">
        <div style={contactStyles.grid}>
          <Reveal>
            <div>
              <div className="section-label">Contact</div>
              <h2 className="section-title">
                Let&apos;s build
                <br />
                <em style={contactStyles.em}>something good.</em>
              </h2>
              <p className="section-sub">
                Have a project in mind? Send me a note — I reply within 48 hours.
              </p>

              <div style={contactStyles.directs}>
                <DirectRow icon="mail" label="Email" value={SITE.email} href={`mailto:${SITE.email}`} target="_blank" rel="noopener noreferrer" />
                <DirectRow icon="pin" label="Based in" value={SITE.location} />
              </div>

              <div style={contactStyles.bookCall}>
                <p style={contactStyles.bookCallText}>Prefer to talk? Grab a time.</p>
                <a
                  href="https://cal.com/gasalazacr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  Book a call
                  <Icon name="arrowUpRight" size={14} />
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <form onSubmit={(e) => void submit(e)} style={contactStyles.form} noValidate>
              {status === 'sent' ? (
                <SentScreen
                  name={form.name}
                  onReset={() => {
                    setStatus('idle');
                    setForm({ name: '', email: '', msg: '', budget: 'landing', website: '' });
                    setErrors({});
                  }}
                />
              ) : (
                <>
                  <div style={contactStyles.formHead}>
                    <div style={contactStyles.formDots}>
                      <span style={{ ...contactStyles.fdot, background: '#ff5f57' }} />
                      <span style={{ ...contactStyles.fdot, background: '#febc2e' }} />
                      <span style={{ ...contactStyles.fdot, background: '#28c840' }} />
                    </div>
                    <div style={contactStyles.formTitle}>new_message.tsx</div>
                  </div>

                  <div style={contactStyles.formBody}>
                    {/* Honeypot field */}
                    <div
                      aria-hidden="true"
                      style={{ position: 'absolute', left: '-9999px', height: 0, overflow: 'hidden' }}
                    >
                      <label htmlFor="website">Website</label>
                      <input
                        id="website"
                        name="website"
                        type="text"
                        value={form.website}
                        onChange={update('website')}
                        tabIndex={-1}
                        autoComplete="off"
                      />
                    </div>

                    <Field
                      label="Your name"
                      name="name"
                      value={form.name}
                      onChange={update('name')}
                      error={errors.name}
                      focused={focus === 'name'}
                      onFocus={() => setFocus('name')}
                      onBlur={() => setFocus(null)}
                      placeholder="Jane Doe"
                    />
                    <Field
                      label="Email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={update('email')}
                      error={errors.email}
                      focused={focus === 'email'}
                      onFocus={() => setFocus('email')}
                      onBlur={() => setFocus(null)}
                      placeholder="jane@company.com"
                    />

                    <div>
                      <label style={contactStyles.label} id="project-type-label">
                        Project type
                      </label>
                      <div style={contactStyles.budgetGrid} role="group" aria-labelledby="project-type-label">
                        {budgetOpts.map((o) => (
                          <button
                            key={o.v}
                            type="button"
                            onClick={() => setForm({ ...form, budget: o.v })}
                            style={{
                              ...contactStyles.budgetBtn,
                              ...(form.budget === o.v ? contactStyles.budgetBtnOn : {}),
                            }}
                            aria-pressed={form.budget === o.v}
                          >
                            <div style={contactStyles.budgetL}>{o.l}</div>
                            <div style={contactStyles.budgetD}>{o.d}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <Field
                      label="Tell me about your project"
                      name="msg"
                      value={form.msg}
                      onChange={update('msg')}
                      error={errors.msg}
                      focused={focus === 'msg'}
                      onFocus={() => setFocus('msg')}
                      onBlur={() => setFocus(null)}
                      placeholder="A few lines on goals, timeline, and anything tricky."
                      multiline
                    />

                    {status === 'error' && errorMessage && (
                      <div role="alert" style={contactStyles.errorBanner}>
                        {errorMessage}
                        {errorMessage.includes('email me') && (
                          <> <a href={`mailto:${SITE.email}`} style={{ color: 'var(--accent)' }}>{SITE.email}</a></>
                        )}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={status === 'sending'}
                      style={{ width: '100%', height: 44, marginTop: 4 }}
                    >
                      {status === 'sending' ? (
                        <>
                          <Spinner />
                          Sending…
                        </>
                      ) : (
                        <>
                          Send message
                          <Icon name="send" size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

interface FieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  placeholder: string;
  multiline?: boolean;
  type?: string;
}

function Field({ label, name, value, onChange, error, focused, onFocus, onBlur, placeholder, multiline, type = 'text' }: FieldProps) {
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <div>
      <label htmlFor={name} style={contactStyles.label}>
        {label}
      </label>
      <div
        style={{
          ...contactStyles.inputWrap,
          borderColor: error ? 'oklch(0.65 0.18 25)' : focused ? 'var(--accent)' : 'var(--border)',
          boxShadow: focused && !error ? '0 0 0 3px var(--accent-dim)' : 'none',
        }}
      >
        <Tag
          id={name}
          name={name}
          type={multiline ? undefined : type}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={multiline ? 5 : undefined}
          style={{
            ...contactStyles.input,
            ...(multiline ? { minHeight: 110, resize: 'vertical' as const } : {}),
          }}
        />
      </div>
      {error && <div style={contactStyles.err}>— {error}</div>}
    </div>
  );
}

function DirectRow({ icon, label, value, href, target, rel }: { icon: 'mail' | 'phone' | 'pin'; label: string; value: string; href?: string; target?: string; rel?: string }) {
  const inner = (
    <>
      <div style={contactStyles.directIcon}>
        <Icon name={icon} size={13} />
      </div>
      <div>
        <div style={contactStyles.directL}>{label}</div>
        <div style={contactStyles.directV}>{value}</div>
      </div>
    </>
  );
  return href ? (
    <a href={href} style={contactStyles.directRow} target={target} rel={rel}>{inner}</a>
  ) : (
    <div style={contactStyles.directRow}>{inner}</div>
  );
}

function Spinner() {
  return (
    <span
      style={{
        width: 14,
        height: 14,
        borderRadius: '50%',
        border: '2px solid currentColor',
        borderTopColor: 'transparent',
        animation: 'spin 700ms linear infinite',
        display: 'inline-block',
      }}
    />
  );
}

function SentScreen({ name, onReset }: { name: string; onReset: () => void }) {
  return (
    <div style={contactStyles.sent}>
      <div style={contactStyles.sentIcon}>
        <Icon name="check" size={28} />
      </div>
      <div style={contactStyles.sentTitle}>Message sent</div>
      <div style={contactStyles.sentSub}>
        Thanks{name ? `, ${name.split(' ')[0]}` : ''}. I&apos;ll reply within 48 hours.
      </div>
      <button type="button" className="btn btn-ghost" onClick={onReset} style={{ marginTop: 18 }}>
        Send another
      </button>
    </div>
  );
}

const contactStyles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)',
    gap: 'clamp(32px, 6vw, 80px)',
    alignItems: 'start',
  } as CSSProperties,
  em: { color: 'var(--accent)', fontStyle: 'italic', fontWeight: 500 } as CSSProperties,
  directs: {
    marginTop: 36,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    border: '1px solid var(--border)',
    borderRadius: 12,
    overflow: 'hidden',
    background: 'var(--bg-elevated)',
  } as CSSProperties,
  bookCall: {
    marginTop: 24,
  } as CSSProperties,
  bookCallText: {
    fontSize: 13,
    color: 'var(--fg-muted)',
    margin: '0 0 12px',
  } as CSSProperties,
  directRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 16px',
    borderBottom: '1px solid var(--border)',
    color: 'var(--fg)',
    textDecoration: 'none',
    transition: 'background 160ms',
  } as CSSProperties,
  directIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  } as CSSProperties,
  directL: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--fg-dim)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: 2,
  } as CSSProperties,
  directV: { fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em' } as CSSProperties,
  form: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0 24px 48px -20px oklch(0 0 0 / 0.5)',
    position: 'relative',
  } as CSSProperties,
  formHead: {
    padding: '10px 14px',
    borderBottom: '1px solid var(--border)',
    background: 'oklch(0.2 0.008 255)',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  } as CSSProperties,
  formDots: { display: 'flex', gap: 6 } as CSSProperties,
  fdot: { width: 10, height: 10, borderRadius: '50%' } as CSSProperties,
  formTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--fg-dim)',
  } as CSSProperties,
  formBody: {
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  } as CSSProperties,
  label: {
    display: 'block',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--fg-dim)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 8,
  } as CSSProperties,
  inputWrap: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    transition: 'border-color 160ms, box-shadow 160ms',
  } as CSSProperties,
  input: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--fg)',
    padding: '12px 14px',
    fontFamily: 'var(--font-sans)',
    fontSize: 14,
    lineHeight: 1.5,
    resize: 'none',
  } as CSSProperties,
  err: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'oklch(0.72 0.18 25)',
    marginTop: 6,
  } as CSSProperties,
  errorBanner: {
    padding: '10px 14px',
    borderRadius: 8,
    background: 'oklch(0.65 0.18 25 / 0.1)',
    border: '1px solid oklch(0.65 0.18 25 / 0.3)',
    fontSize: 13,
    color: 'oklch(0.72 0.18 25)',
  } as CSSProperties,
  budgetGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  } as CSSProperties,
  budgetBtn: {
    textAlign: 'left',
    padding: '10px 12px',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--fg-muted)',
    cursor: 'pointer',
    transition: 'all 160ms',
  } as CSSProperties,
  budgetBtnOn: {
    borderColor: 'var(--accent)',
    background: 'var(--accent-dim)',
    color: 'var(--fg)',
    boxShadow: '0 0 0 2px var(--accent-dim)',
  } as CSSProperties,
  budgetL: { fontSize: 13, fontWeight: 500 } as CSSProperties,
  budgetD: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--fg-dim)',
    marginTop: 2,
  } as CSSProperties,
  sent: {
    padding: '60px 28px',
    textAlign: 'center',
    animation: 'fadeIn 360ms ease both',
  } as CSSProperties,
  sentIcon: {
    width: 56,
    height: 56,
    margin: '0 auto 18px',
    borderRadius: '50%',
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'pop 500ms cubic-bezier(0.22, 1.6, 0.36, 1) both',
  } as CSSProperties,
  sentTitle: {
    fontSize: 22,
    fontWeight: 500,
    letterSpacing: '-0.02em',
  } as CSSProperties,
  sentSub: {
    fontSize: 14,
    color: 'var(--fg-muted)',
    marginTop: 8,
  } as CSSProperties,
};
