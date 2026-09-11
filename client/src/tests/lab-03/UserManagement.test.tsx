import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserManagementPage } from '../../pages/UserManagementPage';
import { AuthProvider } from '../../context/AuthContext';

const mockUsers = [
  {
    id: 12,
    name: 'John Admin',
    email: 'admin.john@toktickit.com',
    department: 'IT Administration',
    role: 'ADMIN',
    isActive: true,
    mustChangePassword: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 7,
    name: 'Michael Brown',
    email: 'michael.b@toktickit.com',
    department: 'IT Support',
    role: 'IT_STAFF',
    isActive: true,
    mustChangePassword: false,
    createdAt: '2026-01-05T00:00:00.000Z',
  },
  {
    id: 1,
    name: 'Supanut Sopha',
    email: 'supanut.soph@kmutt.ac.th',
    department: 'Computer Engineering',
    role: 'REQUESTER',
    isActive: true,
    mustChangePassword: false,
    createdAt: '2026-01-10T00:00:00.000Z',
  },
];

describe('Lab 03 - UserManagementPage Component Tests', () => {
  beforeEach(() => {
    localStorage.setItem('toktickit_token', 'mock_admin_token');
    localStorage.setItem(
      'toktickit_user',
      JSON.stringify({
        id: 12,
        name: 'John Admin',
        email: 'admin.john@toktickit.com',
        role: 'ADMIN',
        mustChangePassword: false,
      })
    );
    vi.restoreAllMocks();

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/admin/users')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: mockUsers,
            pagination: {
              total: 3,
              page: 1,
              limit: 10,
              totalPages: 1,
            },
          }),
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  it('renders user management heading, controls, and user rows', async () => {
    render(
      <AuthProvider>
        <UserManagementPage />
      </AuthProvider>
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/User Management/i);
    expect(screen.getByTestId('create-user-modal-trigger')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('John Admin')).toBeInTheDocument();
      expect(screen.getByText('Michael Brown')).toBeInTheDocument();
      expect(screen.getByText('Supanut Sopha')).toBeInTheDocument();
    });

    // Check roles
    expect(screen.getByTestId('user-role-badge-12')).toHaveTextContent('ADMIN');
    expect(screen.getByTestId('user-role-badge-7')).toHaveTextContent('IT STAFF');
    expect(screen.getByTestId('user-role-badge-1')).toHaveTextContent('REQUESTER');
  });

  it('disables deactivation button for self (logged in administrator)', async () => {
    render(
      <AuthProvider>
        <UserManagementPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('toggle-status-btn-12')).toBeInTheDocument();
    });

    // Button for user 12 (self) should be disabled
    expect(screen.getByTestId('toggle-status-btn-12')).toBeDisabled();

    // Button for user 7 (not self) should be enabled
    expect(screen.getByTestId('toggle-status-btn-7')).not.toBeDisabled();
  });

  it('opens create user modal and submits new user successfully', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string, opts?: any) => {
      if (url.includes('/api/admin/users') && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            message: 'Created',
            user: { id: 99, name: 'New Staff', role: 'IT_STAFF', email: 'staff.new@kmutt.ac.th' },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          data: mockUsers,
          pagination: { total: 3, page: 1, limit: 10, totalPages: 1 },
        }),
      });
    });

    render(
      <AuthProvider>
        <UserManagementPage />
      </AuthProvider>
    );

    fireEvent.click(screen.getByTestId('create-user-modal-trigger'));

    expect(screen.getByText(/Create New User Account/i)).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('create-user-name'), { target: { value: 'New Staff' } });
    fireEvent.change(screen.getByTestId('create-user-email'), { target: { value: 'staff.new@kmutt.ac.th' } });
    fireEvent.change(screen.getByTestId('create-user-dept'), { target: { value: 'IT Infrastructure' } });
    fireEvent.change(screen.getByTestId('create-user-role'), { target: { value: 'IT_STAFF' } });

    fireEvent.click(screen.getByTestId('create-user-submit-btn'));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/users'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('staff.new@kmutt.ac.th'),
        })
      );
    });
  });

  it('opens reset password modal and submits new password', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string, opts?: any) => {
      if (url.includes('/reset-password') && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: 'Password reset', mustChangePassword: true }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          data: mockUsers,
          pagination: { total: 3, page: 1, limit: 10, totalPages: 1 },
        }),
      });
    });

    render(
      <AuthProvider>
        <UserManagementPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('reset-pwd-btn-7')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('reset-pwd-btn-7'));

    expect(screen.getByText(/Reset Password • Michael Brown/i)).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('reset-pwd-input'), {
      target: { value: 'AdminReset@2026!' },
    });

    fireEvent.click(screen.getByTestId('reset-pwd-submit-btn'));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/users/7/reset-password'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ newPassword: 'AdminReset@2026!' }),
        })
      );
    });
  });
});
