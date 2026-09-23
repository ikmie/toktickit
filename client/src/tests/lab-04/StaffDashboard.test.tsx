import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StaffDashboardPage } from '../../pages/StaffDashboardPage';

const mockStaffMetrics = {
  metrics: {
    new: 12,
    open: 24,
    inProgress: 15,
    waitingForRequester: 6,
    myAssigned: 8,
    unassigned: 5,
    urgentHigh: 4,
    recentActionsCount: 19,
  },
  statusBreakdown: {
    NEW: 12,
    OPEN: 24,
    IN_PROGRESS: 15,
    WAITING_FOR_REQUESTER: 6,
    RESOLVED: 45,
    CLOSED: 80,
  },
  recentTickets: [
    {
      id: 101,
      ticketNumber: 'TIC-2026-0101',
      summary: 'Main Router Network Flapping',
      status: 'OPEN',
      itPriority: 'URGENT',
      requesterName: 'Alice Wong',
      ownerName: 'Bob Miller',
      actionsCount: 2,
      updatedAt: '2026-03-10T14:30:00.000Z',
    },
    {
      id: 102,
      ticketNumber: 'TIC-2026-0102',
      summary: 'Software License Request',
      status: 'IN_PROGRESS',
      itPriority: 'LOW',
      requesterName: 'Charlie Tan',
      ownerName: 'Unassigned',
      actionsCount: 0,
      updatedAt: '2026-03-10T12:00:00.000Z',
    },
  ],
};

describe('Lab 04 - StaffDashboardPage Component Tests', () => {
  beforeEach(() => {
    localStorage.setItem('toktickit_token', 'mock_staff_token');
    vi.restoreAllMocks();

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/dashboards/staff')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockStaffMetrics,
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  it('renders operational metric cards with accurate values and recent activity', async () => {
    const onSelectTicket = vi.fn();
    const onNavigateToQueue = vi.fn();

    render(
      <StaffDashboardPage
        onSelectTicket={onSelectTicket}
        onNavigateToQueue={onNavigateToQueue}
      />
    );

    // Initial loading or loaded elements
    await waitFor(() => {
      expect(screen.getByTestId('staff-welcome-message')).toBeInTheDocument();
      expect(screen.getByTestId('metric-new-tickets')).toHaveTextContent('12');
      expect(screen.getByTestId('metric-open-tickets')).toHaveTextContent('24');
      expect(screen.getByTestId('metric-in-progress-tickets')).toHaveTextContent('15');
      expect(screen.getByTestId('metric-waiting-tickets')).toHaveTextContent('6');
      expect(screen.getByTestId('metric-my-assigned')).toHaveTextContent('8');
      expect(screen.getByTestId('metric-unassigned-tickets')).toHaveTextContent('5');
      expect(screen.getByTestId('metric-urgent-tickets')).toHaveTextContent('4');
    });

    // Check recent ticket item
    expect(screen.getByText('Main Router Network Flapping')).toBeInTheDocument();
    expect(screen.getByText(/TIC-2026-0101/)).toBeInTheDocument();
  });

  it('navigates to queue with appropriate filter when metric card is clicked (drill-down)', async () => {
    const onSelectTicket = vi.fn();
    const onNavigateToQueue = vi.fn();

    render(
      <StaffDashboardPage
        onSelectTicket={onSelectTicket}
        onNavigateToQueue={onNavigateToQueue}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('metric-new-tickets')).toBeInTheDocument();
    });

    // Click "New" metric card
    fireEvent.click(screen.getByTestId('metric-new-tickets'));
    expect(onNavigateToQueue).toHaveBeenCalledWith({ status: 'NEW' });

    // Click "My Assigned" metric card
    fireEvent.click(screen.getByTestId('metric-my-assigned'));
    expect(onNavigateToQueue).toHaveBeenCalledWith({ ownership: 'my' });

    // Click "Unassigned" card
    fireEvent.click(screen.getByTestId('metric-unassigned-tickets'));
    expect(onNavigateToQueue).toHaveBeenCalledWith({ ownership: 'unassigned' });
  });

  it('opens ticket detail when a recent ticket is clicked', async () => {
    const onSelectTicket = vi.fn();
    const onNavigateToQueue = vi.fn();

    render(
      <StaffDashboardPage
        onSelectTicket={onSelectTicket}
        onNavigateToQueue={onNavigateToQueue}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('recent-queue-ticket-101')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('recent-queue-ticket-101'));
    expect(onSelectTicket).toHaveBeenCalledWith(101);
  });

  it('renders safe failure feedback when dashboard data fails to load', async () => {
    globalThis.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Database query timeout' }),
      })
    );

    render(
      <StaffDashboardPage
        onSelectTicket={vi.fn()}
        onNavigateToQueue={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-error-alert')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-error-alert')).toHaveTextContent(/Failed to load dashboard metrics/);
    });
  });
});
