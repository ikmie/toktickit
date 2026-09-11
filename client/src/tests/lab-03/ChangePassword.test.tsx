import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChangePasswordPage } from '../../pages/ChangePasswordPage';
import { AuthProvider } from '../../context/AuthContext';

describe('Lab 03 - ChangePassword Component Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    localStorage.setItem(
      'toktickit_user',
      JSON.stringify({
        id: 10,
        name: 'Alex Thompson',
        email: 'alex.t@toktickit.com',
        role: 'IT_STAFF',
        isActive: true,
        mustChangePassword: true,
      })
    );
    localStorage.setItem('toktickit_token', 'mock-temporary-token');
  });

  it('renders change password inputs and instructions', () => {
    render(
      <AuthProvider>
        <ChangePasswordPage />
      </AuthProvider>
    );

    expect(screen.getByText(/change your password/i)).toBeInTheDocument();
    expect(screen.getByText(/Alex Thompson/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/current \(temporary\) password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save & continue/i })).toBeDisabled();
  });

  it('validates password complexity rules dynamically and enables submit button when valid', () => {
    render(
      <AuthProvider>
        <ChangePasswordPage />
      </AuthProvider>
    );

    const currentInput = screen.getByLabelText(/current \(temporary\) password/i);
    const newInput = screen.getByLabelText(/^new password/i);
    const confirmInput = screen.getByLabelText(/confirm new password/i);
    const saveBtn = screen.getByRole('button', { name: /save & continue/i });

    // Enter current password
    fireEvent.change(currentInput, { target: { value: 'Initial123!' } });
    expect(saveBtn).toBeDisabled();

    // Enter weak password (too short, no special char)
    fireEvent.change(newInput, { target: { value: 'weakpass' } });
    fireEvent.change(confirmInput, { target: { value: 'weakpass' } });
    expect(saveBtn).toBeDisabled();

    // Enter valid compliant password: 8+ chars, upper, lower, number, special char
    fireEvent.change(newInput, { target: { value: 'SecurePass2026!' } });
    fireEvent.change(confirmInput, { target: { value: 'SecurePass2026!' } });

    expect(saveBtn).not.toBeDisabled();
  });

  it('submits password change request when form is submitted', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/api/auth/change-password')) {
        return {
          ok: true,
          json: async () => ({ message: 'Password changed successfully', mustChangePassword: false }),
        };
      }
      return {
        ok: true,
        json: async () => ({
          user: {
            id: 10,
            name: 'Alex Thompson',
            email: 'alex.t@toktickit.com',
            role: 'IT_STAFF',
            mustChangePassword: true,
            isActive: true,
          },
        }),
      };
    });

    const mockSuccess = vi.fn();
    render(
      <AuthProvider>
        <ChangePasswordPage onSuccess={mockSuccess} />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText(/current \(temporary\) password/i), {
      target: { value: 'Initial123!' },
    });
    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: 'SecurePass2026!' },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'SecurePass2026!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /save & continue/i }));

    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalled();
    });
  });
});
