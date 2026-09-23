import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequesterDashboardPage } from '../../pages/RequesterDashboardPage';

const mockRequesterData = {
  metrics: {
    totalOpenTickets: 4,
    inProgress: 2,
    resolved: 7,
    closed: 15,
  },
  recentTickets: [
    {
      id: 201,
      ticketNumber: 'TIC-2026-0201',
      summary: 'Printer Paper Jam on Floor 3',
      currentStatus: 'IN_PROGRESS',
      requestedPriority: 'MEDIUM',
      itPriority: 'MEDIUM',
      updatedAt: '2026-03-11T10:00:00.000Z',
    },
    {
      id: 202,
      ticketNumber: 'TIC-2026-0202',
      summary: 'Email Client Sync Issue',
      currentStatus: 'RESOLVED',
      requestedPriority: 'LOW',
      itPriority: 'LOW',
      updatedAt: '2026-03-09T08:00:00.000Z',
    },
  ],
};

describe('Lab 04 - RequesterDashboardPage Component Tests', () => {
  beforeEach(() => {
    localStorage.setItem('toktickit_token', 'mock_requester_token');
    vi.restoreAllMocks();

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/dashboards/requester')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockRequesterData,
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  it('renders requester metric summary cards and recent tickets', async () => {
    const onSelectTicket = vi.fn();
    const onCreateTicket = vi.fn();
    const onViewMyTickets = vi.fn();

    render(
      <RequesterDashboardPage
        onSelectTicket={onSelectTicket}
        onCreateTicket={onCreateTicket}
        onViewMyTickets={onViewMyTickets}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('welcome-message')).toBeInTheDocument();
      expect(screen.getByTestId('metric-open-tickets')).toHaveTextContent('4');
      expect(screen.getByTestId('metric-in-progress')).toHaveTextContent('2');
      expect(screen.getByTestId('metric-resolved')).toHaveTextContent('7');
      expect(screen.getByTestId('metric-closed')).toHaveTextContent('15');
    });

    expect(screen.getByText('Printer Paper Jam on Floor 3')).toBeInTheDocument();
    expect(screen.getByText('Email Client Sync Issue')).toBeInTheDocument();
  });

  it('drills down to filtered My Tickets view when metric cards are clicked', async () => {
    const onSelectTicket = vi.fn();
    const onCreateTicket = vi.fn();
    const onViewMyTickets = vi.fn();

    render(
      <RequesterDashboardPage
        onSelectTicket={onSelectTicket}
        onCreateTicket={onCreateTicket}
        onViewMyTickets={onViewMyTickets}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('metric-open-tickets')).toBeInTheDocument();
    });

    // Click My Open Tickets
    fireEvent.click(screen.getByTestId('metric-open-tickets'));
    expect(onViewMyTickets).toHaveBeenCalledWith('OPEN_ALL');

    // Click In Progress
    fireEvent.click(screen.getByTestId('metric-in-progress'));
    expect(onViewMyTickets).toHaveBeenCalledWith('IN_PROGRESS');

    // Click Resolved
    fireEvent.click(screen.getByTestId('metric-resolved'));
    expect(onViewMyTickets).toHaveBeenCalledWith('RESOLVED');
  });

  it('triggers quick actions: create ticket and view tickets', async () => {
    const onSelectTicket = vi.fn();
    const onCreateTicket = vi.fn();
    const onViewMyTickets = vi.fn();

    render(
      <RequesterDashboardPage
        onSelectTicket={onSelectTicket}
        onCreateTicket={onCreateTicket}
        onViewMyTickets={onViewMyTickets}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('quick-create-ticket-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('quick-create-ticket-btn'));
    expect(onCreateTicket).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('quick-view-tickets-btn'));
    expect(onViewMyTickets).toHaveBeenCalled();
  });

  it('navigates to ticket detail when recent ticket item is clicked', async () => {
    const onSelectTicket = vi.fn();
    const onCreateTicket = vi.fn();
    const onViewMyTickets = vi.fn();

    render(
      <RequesterDashboardPage
        onSelectTicket={onSelectTicket}
        onCreateTicket={onCreateTicket}
        onViewMyTickets={onViewMyTickets}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('recent-ticket-201')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('recent-ticket-201'));
    expect(onSelectTicket).toHaveBeenCalledWith(201);
  });
});
