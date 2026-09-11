import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StaffTicketDetailPage } from '../../pages/StaffTicketDetailPage';

const mockDetail = {
  id: 1,
  ticketNumber: 'TIC-2026-0001',
  summary: 'Laptop Battery Failure',
  description: 'Battery drains rapidly within 20 minutes of unplugging.',
  requestedPriority: 'HIGH',
  itPriority: 'HIGH',
  currentStatus: 'OPEN',
  problemResolvedIndicated: true,
  ticketDate: '2026-03-01T08:30:00.000Z',
  updatedAt: '2026-03-02T10:00:00.000Z',
  category: { id: 1, name: 'Hardware' },
  relatedSystem: { id: 1, name: 'Faculty Laptop Program', code: 'SYS-HW-01' },
  requester: { id: 1, name: 'Supanut Sopha', email: 'supanut@kmutt.ac.th', department: 'Computer Engineering' },
  owner: { id: 7, name: 'Michael Brown', email: 'michael@toktickit.com', role: 'IT_STAFF' },
  attachments: [],
  comments: [
    {
      id: 101,
      content: 'I have attached battery test logs.',
      createdAt: '2026-03-01T09:00:00.000Z',
      author: { id: 1, name: 'Supanut Sopha', role: 'REQUESTER' },
    },
  ],
  notes: [
    {
      id: 201,
      content: 'Dell RMA request dispatched.',
      createdAt: '2026-03-02T09:30:00.000Z',
      author: { id: 7, name: 'Michael Brown', role: 'IT_STAFF' },
    },
  ],
};

const mockAssignees = [
  { id: 7, name: 'Michael Brown', email: 'michael@toktickit.com', role: 'IT_STAFF', department: 'IT' },
  { id: 8, name: 'Sarah Johnson', email: 'sarah@toktickit.com', role: 'IT_STAFF', department: 'IT' },
];

describe('Lab 03 - StaffTicketDetailPage Component Tests', () => {
  beforeEach(() => {
    localStorage.setItem('toktickit_token', 'mock_staff_token');
    vi.restoreAllMocks();

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/staff/assignees')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockAssignees,
        });
      }
      if (url.includes('/api/staff/tickets/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockDetail,
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  it('renders operational controls, ticket metadata, and resolution indication banner', async () => {
    const onBack = vi.fn();
    render(<StaffTicketDetailPage ticketId={1} onBack={onBack} />);

    await waitFor(() => {
      expect(screen.getByTestId('staff-ticket-summary')).toHaveTextContent('Laptop Battery Failure');
      expect(screen.getByTestId('staff-ticket-description')).toHaveTextContent('Battery drains rapidly');
      expect(screen.getByTestId('requester-resolved-banner')).toBeInTheDocument();
    });

    expect(screen.getByText(/Problem Appears Resolved/i)).toBeInTheDocument();
  });

  it('switches to Internal Notes tab and renders confidential notes with amber background', async () => {
    const onBack = vi.fn();
    render(<StaffTicketDetailPage ticketId={1} onBack={onBack} />);

    await waitFor(() => {
      expect(screen.getByTestId('tab-notes-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('tab-notes-btn'));

    expect(screen.getByTestId('staff-internal-notes-card')).toBeInTheDocument();
    expect(screen.getByText('Dell RMA request dispatched.')).toBeInTheDocument();
    expect(screen.getAllByText(/CONFIDENTIAL/i).length).toBeGreaterThan(0);
  });

  it('allows staff to post an internal note', async () => {
    const onBack = vi.fn();

    globalThis.fetch = vi.fn().mockImplementation((url: string, opts?: any) => {
      if (url.includes('/api/tickets/1/notes') && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 202, content: 'New diagnostic note' }),
        });
      }
      if (url.includes('/api/staff/assignees')) {
        return Promise.resolve({ ok: true, json: async () => mockAssignees });
      }
      return Promise.resolve({ ok: true, json: async () => mockDetail });
    });

    render(<StaffTicketDetailPage ticketId={1} onBack={onBack} />);

    await waitFor(() => {
      expect(screen.getByTestId('tab-notes-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('tab-notes-btn'));

    const input = screen.getByTestId('staff-new-note-input');
    fireEvent.change(input, { target: { value: 'Battery model 4GVGH tested OK.' } });

    const submitBtn = screen.getByTestId('staff-post-note-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tickets/1/notes'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ content: 'Battery model 4GVGH tested OK.' }),
        })
      );
    });
  });

  it('updates IT priority when staff selects priority and clicks update', async () => {
    const onBack = vi.fn();

    globalThis.fetch = vi.fn().mockImplementation((url: string, opts?: any) => {
      if (url.includes('/api/staff/tickets/1/priority') && opts?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: 'IT Priority updated', itPriority: 'URGENT' }),
        });
      }
      if (url.includes('/api/staff/assignees')) {
        return Promise.resolve({ ok: true, json: async () => mockAssignees });
      }
      return Promise.resolve({ ok: true, json: async () => mockDetail });
    });

    render(<StaffTicketDetailPage ticketId={1} onBack={onBack} />);

    await waitFor(() => {
      expect(screen.getByTestId('staff-priority-select')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('staff-priority-select'), { target: { value: 'URGENT' } });
    fireEvent.click(screen.getByTestId('staff-priority-update-btn'));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/staff/tickets/1/priority'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ itPriority: 'URGENT' }),
        })
      );
    });
  });
});
