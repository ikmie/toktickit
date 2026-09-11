import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from './App';

describe('TokTickIT App - Authentication & Navigation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders login screen when unauthenticated', async () => {
    render(<App />);

    expect(screen.getByText('TokTickIT')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders TokTickIT header and Requester navigation when authenticated', async () => {
    localStorage.setItem(
      'toktickit_user',
      JSON.stringify({
        id: 1,
        name: 'Supanut Sopha',
        email: 'supanut.soph@kmutt.ac.th',
        role: 'REQUESTER',
        isActive: true,
        mustChangePassword: false,
      })
    );
    localStorage.setItem('toktickit_token', 'mock-valid-token');

    render(<App />);

    expect(screen.getByText('TokTickIT')).toBeInTheDocument();
    expect(screen.getByTestId('nav-my-tickets')).toBeInTheDocument();
    expect(screen.getByTestId('nav-create-ticket')).toBeInTheDocument();
    expect(screen.getByTestId('logout-btn')).toBeInTheDocument();
  });
});
