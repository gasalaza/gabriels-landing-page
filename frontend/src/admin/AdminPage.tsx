import { useState, useEffect } from 'react';
import { getMe } from './api';
import { Login } from './Login';
import { Dashboard } from './Dashboard';

export function AdminPage() {
  const [state, setState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [login, setLogin] = useState('');

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((data) => {
        if (!cancelled) {
          setLogin(data.login);
          setState('authenticated');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState('unauthenticated');
        }
      });
    return () => { cancelled = true; };
  }, []);

  if (state === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--fg-muted)', fontSize: 14 }}>Loading…</span>
      </div>
    );
  }

  if (state === 'unauthenticated') {
    return <Login />;
  }

  return (
    <Dashboard
      login={login}
      onLogout={() => setState('unauthenticated')}
    />
  );
}
