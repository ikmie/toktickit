import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

describe('TokTickIT UI Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // UI-01
  it('UI-01: TokTickIT heading renders correctly', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('TokTickIT IT Service Desk');
  });

  // UI-02
  it('UI-02: Loading state changes to category list on successful Check System click', async () => {
    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      if (url.toString().endsWith('/health')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'ok', service: 'TokTickIT API' }),
        } as Response);
      }
      if (url.toString().endsWith('/categories')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { id: 1, name: 'Account and Access' },
              { id: 2, name: 'Hardware' },
              { id: 3, name: 'Software' },
              { id: 4, name: 'Network' },
            ]),
        } as Response);
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<App />);
    const checkBtn = screen.getByRole('button', { name: /check system/i });
    fireEvent.click(checkBtn);

    // Verify loading state or status update
    await waitFor(() => {
      expect(screen.getByTestId('system-status')).toHaveTextContent('Online');
    });

    expect(screen.getByText(/Account and Access/i)).toBeInTheDocument();
    expect(screen.getByText(/Hardware/i)).toBeInTheDocument();
    expect(screen.getByText(/Software/i)).toBeInTheDocument();
    expect(screen.getByText(/Network/i)).toBeInTheDocument();
  });

  // UI-03
  it('UI-03: API failure displays a useful error message', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.reject(new Error('Network error'))
    );

    render(<App />);
    const checkBtn = screen.getByRole('button', { name: /check system/i });
    fireEvent.click(checkBtn);

    await waitFor(() => {
      expect(screen.getByTestId('system-status')).toHaveTextContent('Offline');
    });

    expect(screen.getByTestId('error-message')).toHaveTextContent(
      'Unable to connect to TokTickIT API'
    );
  });
});
