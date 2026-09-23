import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StaffTicketDetailPage } from '../../pages/StaffTicketDetailPage';

const mockTicketWithoutActions = {
  id: 15,
  ticketNumber: 'TIC-2026-0015',
  summary: 'VPN Disconnects randomly after 10 minutes',
  description: 'Tunnel drops during remote meetings.',
  requestedPriority: 'HIGH',
  itPriority: 'HIGH',
  currentStatus: 'IN_PROGRESS',
  ticketDate: '2026-03-01T08:30:00.000Z',
  updatedAt: '2026-03-02T10:00:00.000Z',
  category: { id: 1, name: 'Network' },
  relatedSystem: { id: 1, name: 'Campus VPN Gateway', code: 'SYS-NET-01' },
  requester: { id: 1, name: 'Supanut Sopha', email: 'supanut@kmutt.ac.th', department: 'CPE' },
  owner: { id: 7, name: 'Michael Brown', email: 'michael@toktickit.com', role: 'IT_STAFF' },
  attachments: [],
  comments: [],
  notes: [],
  actions: [],
};

const mockTicketWithActions = {
  ...mockTicketWithoutActions,
  actions: [
    {
      id: 50,
      ticketId: 15,
      actionDateTime: '2026-03-02T09:00:00.000Z',
      description: 'Adjusted MTU packet size and reinstalled tunnel profile',
      result: 'Connection stability verified with ping tests',
      performedById: 7,
      performedBy: { id: 7, name: 'Michael Brown', role: 'IT_STAFF' },
      followUpRequired: false,
    },
  ],
};

const mockAssignees = [
  { id: 7, name: 'Michael Brown', email: 'michael@toktickit.com', role: 'IT_STAFF', department: 'IT' },
];

describe('Lab 04 - TicketWorkflow & Resolution Gate Component Tests', () => {
  beforeEach(() => {
    localStorage.setItem('toktickit_token', 'mock_staff_token');
    vi.restoreAllMocks();
  });

  it('enforces Resolution Gate: displays warning banner when trying to resolve ticket with 0 actions', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/staff/assignees')) {
        return Promise.resolve({ ok: true, json: async () => mockAssignees });
      }
      if (url.includes('/api/staff/tickets/15')) {
        return Promise.resolve({ ok: true, json: async () => mockTicketWithoutActions });
      }
      if (url.includes('/api/tickets/15/actions')) {
        return Promise.resolve({ ok: true, json: async () => ({ actions: [] }) });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(<StaffTicketDetailPage ticketId={15} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('staff-ticket-summary')).toHaveTextContent('VPN Disconnects randomly');
    });

    // Select RESOLVED status in dropdown
    const statusSelect = screen.getByTestId('staff-status-select');
    fireEvent.change(statusSelect, { target: { value: 'RESOLVED' } });

    // Warning banner should be rendered
    await waitFor(() => {
      expect(screen.getByTestId('resolution-gate-warning')).toBeInTheDocument();
      expect(screen.getByText(/At least one Action Taken must be recorded before this ticket can be marked as Resolved/i)).toBeInTheDocument();
    });

    // Resolution summary input should NOT be shown while 0 actions
    expect(screen.queryByTestId('staff-resolution-summary')).not.toBeInTheDocument();
  });

  it('allows resolution when ticket has at least one Action Taken and sends expectedUpdatedAt', async () => {
    let capturedBody: any = null;

    globalThis.fetch = vi.fn().mockImplementation((url: string, opts?: any) => {
      if (opts?.method === 'PATCH' && url.includes('/api/staff/tickets/15/status')) {
        capturedBody = JSON.parse(opts.body);
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ...mockTicketWithActions,
            currentStatus: 'RESOLVED',
            resolutionSummary: 'MTU fixed and profile updated',
          }),
        });
      }
      if (url.includes('/api/staff/assignees')) {
        return Promise.resolve({ ok: true, json: async () => mockAssignees });
      }
      if (url.includes('/api/staff/tickets/15')) {
        return Promise.resolve({ ok: true, json: async () => mockTicketWithActions });
      }
      if (url.includes('/api/tickets/15/actions')) {
        return Promise.resolve({ ok: true, json: async () => ({ actions: mockTicketWithActions.actions }) });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(<StaffTicketDetailPage ticketId={15} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('staff-ticket-summary')).toHaveTextContent('VPN Disconnects randomly');
    });

    // Select RESOLVED status
    const statusSelect = screen.getByTestId('staff-status-select');
    fireEvent.change(statusSelect, { target: { value: 'RESOLVED' } });

    // Warning banner should NOT be shown
    expect(screen.queryByTestId('resolution-gate-warning')).not.toBeInTheDocument();

    // Resolution summary textarea should be shown
    await waitFor(() => {
      expect(screen.getByTestId('staff-resolution-summary')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('staff-resolution-summary'), {
      target: { value: 'MTU fixed and profile updated' },
    });

    // Click Update Status
    fireEvent.click(screen.getByTestId('staff-status-update-btn'));

    await waitFor(() => {
      expect(capturedBody).not.toBeNull();
      expect(capturedBody.status).toBe('RESOLVED');
      expect(capturedBody.resolutionSummary).toBe('MTU fixed and profile updated');
      expect(capturedBody.expectedUpdatedAt).toBe('2026-03-02T10:00:00.000Z');
    });
  });
});
