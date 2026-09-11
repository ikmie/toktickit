import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StaffTicketQueuePage } from '../../pages/StaffTicketQueuePage';

const mockTickets = [
  {
    id: 1,
    ticketNumber: 'TIC-2026-0001',
    summary: 'Laptop Battery Failure',
    ticketDate: '2026-03-01T08:30:00.000Z',
    itPriority: 'HIGH',
    requestedPriority: 'HIGH',
    currentStatus: 'IN_PROGRESS',
    problemResolvedIndicated: false,
    category: { id: 1, name: 'Hardware' },
    relatedSystem: { id: 1, name: 'Faculty Laptop Program', code: 'SYS-HW-01' },
    requester: { id: 1, name: 'Supanut Sopha', email: 'supanut@kmutt.ac.th', department: 'Computer Engineering' },
    owner: { id: 7, name: 'Michael Brown', email: 'michael@toktickit.com', role: 'IT_STAFF' },
    _count: { comments: 2, notes: 1, attachments: 1 },
  },
  {
    id: 7,
    ticketNumber: 'TIC-2026-0007',
    summary: 'VPN Connection Fails',
    ticketDate: '2026-03-05T09:00:00.000Z',
    itPriority: 'HIGH',
    requestedPriority: 'HIGH',
    currentStatus: 'NEW',
    problemResolvedIndicated: true,
    category: { id: 2, name: 'Network' },
    relatedSystem: { id: 2, name: 'Campus VPN Gateway', code: 'SYS-NET-01' },
    requester: { id: 4, name: 'Wichitchai Promrat', email: 'wichitchai@kmutt.ac.th', department: 'Electrical Engineering' },
    owner: null,
    _count: { comments: 0, notes: 0, attachments: 0 },
  },
];

describe('Lab 03 - StaffTicketQueuePage Component Tests', () => {
  beforeEach(() => {
    localStorage.setItem('toktickit_token', 'mock_staff_token');
    vi.restoreAllMocks();

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/categories')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 1, name: 'Hardware' },
            { id: 2, name: 'Network' },
          ],
        });
      }
      if (url.includes('/api/staff/tickets')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: mockTickets,
            pagination: {
              total: 2,
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

  it('renders queue title, table headers, and loaded tickets', async () => {
    const onSelectTicket = vi.fn();
    render(<StaffTicketQueuePage onSelectTicket={onSelectTicket} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/IT Staff.*Ticket Queue/i);

    await waitFor(() => {
      expect(screen.getByText('TIC-2026-0001')).toBeInTheDocument();
      expect(screen.getByText('Laptop Battery Failure')).toBeInTheDocument();
      expect(screen.getByText('TIC-2026-0007')).toBeInTheDocument();
      expect(screen.getByText('VPN Connection Fails')).toBeInTheDocument();
    });

    // Requester indication badge
    expect(screen.getByText(/Problem Resolved Indicated/i)).toBeInTheDocument();
  });

  it('navigates to ticket detail when row or View button is clicked', async () => {
    const onSelectTicket = vi.fn();
    render(<StaffTicketQueuePage onSelectTicket={onSelectTicket} />);

    await waitFor(() => {
      expect(screen.getByTestId('view-btn-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('view-btn-1'));
    expect(onSelectTicket).toHaveBeenCalledWith(1);
  });

  it('triggers claim API call when Claim button is clicked on unassigned ticket', async () => {
    const onSelectTicket = vi.fn();

    globalThis.fetch = vi.fn().mockImplementation((url: string, opts?: any) => {
      if (url.includes('/claim') && opts?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: 'Claimed' }),
        });
      }
      if (url.includes('/api/categories')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          data: mockTickets,
          pagination: { total: 2, page: 1, limit: 10, totalPages: 1 },
        }),
      });
    });

    render(<StaffTicketQueuePage onSelectTicket={onSelectTicket} />);

    await waitFor(() => {
      expect(screen.getByTestId('claim-btn-7')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('claim-btn-7'));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/staff/tickets/7/claim'),
        expect.objectContaining({ method: 'PATCH' })
      );
    });
  });
});
