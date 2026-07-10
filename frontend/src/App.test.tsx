import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders key sections', () => {
    render(<App />);

    expect(screen.getAllByText(/gabriel salazar/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/tools i reach for/i)).toBeInTheDocument();
    expect(screen.getByText(/three ways we can work together/i)).toBeInTheDocument();
    expect(screen.getByText(/built secure/i)).toBeInTheDocument();
    expect(screen.getByText(/let's build/i)).toBeInTheDocument();
  });

  it('does not contain the word Microsoft anywhere', () => {
    const { container } = render(<App />);
    expect(container.textContent?.toLowerCase()).not.toContain('microsoft');
  });
});
