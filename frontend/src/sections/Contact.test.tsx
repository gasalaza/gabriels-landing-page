import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { Contact } from './Contact';

function getSubmitButton() {
  const buttons = screen.getAllByRole('button').filter(
    (btn) => btn.getAttribute('type') === 'submit'
  );
  return buttons[0]!;
}

afterEach(() => {
  cleanup();
});

describe('Contact section', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows validation errors for empty required fields', async () => {
    render(<Contact />);

    fireEvent.click(getSubmitButton());

    expect(await screen.findByText(/your name, please/i)).toBeInTheDocument();
    expect(screen.getByText(/that email doesn't look right/i)).toBeInTheDocument();
  });

  it('submits successfully with empty message (optional)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 201,
      json: async () => ({}),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<Contact />);

    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });

    fireEvent.click(getSubmitButton());

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          message: '',
          projectType: 'landing',
          website: '',
        }),
      });
    });

    expect(await screen.findByText(/message sent/i)).toBeInTheDocument();
  });

  it('submits successfully with correct payload', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 201,
      json: async () => ({}),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<Contact />);

    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/tell me about your project/i), {
      target: { value: 'This is a test message with enough chars.' },
    });

    fireEvent.click(getSubmitButton());

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          message: 'This is a test message with enough chars.',
          projectType: 'landing',
          website: '',
        }),
      });
    });

    expect(await screen.findByText(/message sent/i)).toBeInTheDocument();
  });

  it('shows rate-limit error on 429 response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 429,
      json: async () => ({}),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<Contact />);

    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/tell me about your project/i), {
      target: { value: 'This is a test message with enough chars.' },
    });

    fireEvent.click(getSubmitButton());

    expect(await screen.findByText(/too many messages/i)).toBeInTheDocument();
  });

  it('shows generic error on network failure', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.stubGlobal('fetch', mockFetch);

    render(<Contact />);

    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/tell me about your project/i), {
      target: { value: 'This is a test message with enough chars.' },
    });

    fireEvent.click(getSubmitButton());

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });
});
