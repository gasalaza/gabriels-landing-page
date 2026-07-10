import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { AdminPage } from './AdminPage';

function renderAdmin(route = '/admin') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AdminPage />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
});

describe('AdminPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows Login when getMe returns 401', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'UNAUTHENTICATED' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    renderAdmin();

    const link = await screen.findByRole('link', { name: /sign in with github/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/api/admin/auth/github');
  });

  it('shows Dashboard when getMe returns 200 with login', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/admin/me') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ login: 'gabriel' }),
        });
      }
      if (typeof url === 'string' && url.startsWith('/api/admin/messages')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                id: 'msg-1',
                name: 'Alice',
                email: 'alice@test.com',
                projectType: 'landing',
                message: 'I need a landing page',
                createdAt: '2026-07-01T12:00:00Z',
                read: false,
              },
            ],
            total: 1,
            limit: 20,
            offset: 0,
          }),
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
    });
    vi.stubGlobal('fetch', mockFetch);

    renderAdmin();

    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('I need a landing page')).toBeInTheDocument();
    expect(screen.getByText(/signed in as gabriel/i)).toBeInTheDocument();
  });

  it('renders attacker-controlled message content as text, not HTML (XSS guard)', async () => {
    const xssPayload = '<script>alert(1)</script>';
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/admin/me') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ login: 'gabriel' }),
        });
      }
      if (typeof url === 'string' && url.startsWith('/api/admin/messages')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                id: 'msg-xss',
                name: xssPayload,
                email: 'xss@evil.com',
                projectType: 'other',
                message: xssPayload,
                createdAt: '2026-07-01T12:00:00Z',
                read: false,
              },
            ],
            total: 1,
            limit: 20,
            offset: 0,
          }),
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
    });
    vi.stubGlobal('fetch', mockFetch);

    const { container } = renderAdmin();

    // The XSS payload should appear as text (in name and message cells)
    const matches = await screen.findAllByText(xssPayload);
    expect(matches.length).toBeGreaterThan(0);
    // But no actual script element should exist
    expect(container.querySelector('script')).toBeNull();
  });
});

describe('Login auth param messages', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'UNAUTHENTICATED' }),
    });
    vi.stubGlobal('fetch', mockFetch);
  });

  it('shows "not authorized" when ?auth=forbidden', async () => {
    renderAdmin('/admin?auth=forbidden');
    expect(await screen.findByText(/not authorized/i)).toBeInTheDocument();
  });

  it('shows "sign-in failed" when ?auth=error', async () => {
    renderAdmin('/admin?auth=error');
    expect(await screen.findByText(/sign-in failed/i)).toBeInTheDocument();
  });
});

describe('Mark read', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '__csrf=testcsrf',
    });
  });

  it('sends PATCH with CSRF header when toggling read', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
      if (url === '/api/admin/me') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ login: 'gabriel' }),
        });
      }
      if (typeof url === 'string' && url.startsWith('/api/admin/messages') && !opts?.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                id: 'msg-1',
                name: 'Bob',
                email: 'bob@test.com',
                projectType: 'consult',
                message: 'Need consulting',
                createdAt: '2026-07-01T12:00:00Z',
                read: false,
              },
            ],
            total: 1,
            limit: 20,
            offset: 0,
          }),
        });
      }
      // PATCH response
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    renderAdmin();

    const toggleBtn = await screen.findByRole('button', { name: /mark read bob/i });
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      const patchCall = mockFetch.mock.calls.find(
        (c) => (c as [string, RequestInit?])[1]?.method === 'PATCH',
      ) as [string, RequestInit] | undefined;
      expect(patchCall).toBeDefined();
      expect(patchCall![0]).toBe('/api/admin/messages/msg-1/read');
      expect(patchCall![1].headers).toEqual(
        expect.objectContaining({ 'X-CSRF-Token': 'testcsrf' }),
      );
      expect(JSON.parse(patchCall![1].body as string)).toEqual({ read: true });
    });
  });
});

describe('Logout', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '__csrf=testcsrf',
    });
  });

  it('sends POST logout with CSRF header and returns to login', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
      if (url === '/api/admin/me' && !opts?.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ login: 'gabriel' }),
        });
      }
      if (typeof url === 'string' && url.startsWith('/api/admin/messages') && !opts?.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ items: [], total: 0, limit: 20, offset: 0 }),
        });
      }
      // POST logout
      return Promise.resolve({
        ok: true,
        status: 204,
        json: async () => ({}),
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    renderAdmin();

    // Wait for dashboard to appear
    await screen.findByText(/no messages yet/i);

    const logoutBtn = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutBtn);

    // After logout, login screen shows
    await waitFor(() => {
      expect(screen.getByText(/sign in to manage/i)).toBeInTheDocument();
    });

    // Verify POST was sent with CSRF
    const postCall = mockFetch.mock.calls.find(
      (c) => (c as [string, RequestInit?])[1]?.method === 'POST',
    ) as [string, RequestInit] | undefined;
    expect(postCall).toBeDefined();
    expect(postCall![0]).toBe('/api/admin/logout');
    expect(postCall![1].headers).toEqual(
      expect.objectContaining({ 'X-CSRF-Token': 'testcsrf' }),
    );
  });
});

describe('Delete message', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '__csrf=testcsrf',
    });
  });

  it('deletes a message via detail panel and removes the row', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
      if (url === '/api/admin/me') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ login: 'gabriel' }),
        });
      }
      if (typeof url === 'string' && url.startsWith('/api/admin/messages') && !opts?.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                id: 'msg-del-1',
                name: 'DeleteMe',
                email: 'del@test.com',
                projectType: 'landing',
                message: 'Please delete this',
                createdAt: '2026-07-01T12:00:00Z',
                read: false,
              },
            ],
            total: 1,
            limit: 20,
            offset: 0,
          }),
        });
      }
      if (opts?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          status: 204,
          json: async () => ({}),
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
    });
    vi.stubGlobal('fetch', mockFetch);

    // Stub window.confirm to auto-accept
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderAdmin();

    // Wait for the row to render, then click it to open detail
    const row = await screen.findByText('DeleteMe');
    fireEvent.click(row);

    // Detail panel should show
    const deleteBtn = await screen.findByRole('button', { name: /delete message/i });
    fireEvent.click(deleteBtn);

    // Verify DELETE was called with CSRF header
    await waitFor(() => {
      const deleteCall = mockFetch.mock.calls.find(
        (c) => (c as [string, RequestInit?])[1]?.method === 'DELETE',
      ) as [string, RequestInit] | undefined;
      expect(deleteCall).toBeDefined();
      expect(deleteCall![0]).toBe('/api/admin/messages/msg-del-1');
      expect(deleteCall![1].headers).toEqual(
        expect.objectContaining({ 'X-CSRF-Token': 'testcsrf' }),
      );
    });

    // Row should be removed
    await waitFor(() => {
      expect(screen.queryByText('DeleteMe')).not.toBeInTheDocument();
    });
  });
});

describe('Pagination', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('clicking Next fetches with offset=limit when total > limit', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/admin/me') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ login: 'gabriel' }),
        });
      }
      if (typeof url === 'string' && url.startsWith('/api/admin/messages')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                id: 'msg-1',
                name: 'Some User',
                email: 'u@t.com',
                projectType: 'other',
                message: 'msg',
                createdAt: '2026-07-01T12:00:00Z',
                read: false,
              },
            ],
            total: 25,
            limit: 20,
            offset: 0,
          }),
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
    });
    vi.stubGlobal('fetch', mockFetch);

    renderAdmin();

    // Wait for initial load
    await screen.findByText('Some User');

    const nextBtn = screen.getByRole('button', { name: /next/i });
    expect(nextBtn).not.toBeDisabled();
    fireEvent.click(nextBtn);

    await waitFor(() => {
      const msgCalls = mockFetch.mock.calls.filter(
        (c) => typeof c[0] === 'string' && (c[0] as string).startsWith('/api/admin/messages'),
      );
      expect(msgCalls.length).toBeGreaterThanOrEqual(2);
      const lastCall = msgCalls[msgCalls.length - 1]!;
      expect(lastCall[0]).toContain('offset=20');
    });
  });
});
