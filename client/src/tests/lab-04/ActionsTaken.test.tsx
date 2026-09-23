import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActionsTakenSection } from '../../components/ActionsTakenSection';

const mockActions = [
  {
    id: 1,
    ticketId: 10,
    actionDateTime: '2026-03-12T09:00:00.000Z',
    description: 'Diagnosed damaged RAM module in DIMM slot 2',
    result: 'Module replaced with 16GB DDR4 replacement unit',
    performedById: 5,
    performedBy: {
      id: 5,
      name: 'Michael Brown',
      email: 'michael@toktickit.com',
      role: 'IT_STAFF',
    },
    followUpRequired: true,
    followUpNote: 'Monitor memory stress test overnight',
    attachmentNotes: 'memory_diagnostic_log.txt',
    createdAt: '2026-03-12T09:00:00.000Z',
    updatedAt: '2026-03-12T09:00:00.000Z',
  },
];

const mockAssignees = [
  { id: 5, name: 'Michael Brown', email: 'michael@toktickit.com', role: 'IT_STAFF' },
  { id: 6, name: 'Sarah Johnson', email: 'sarah@toktickit.com', role: 'IT_STAFF' },
];

describe('Lab 04 - ActionsTakenSection Component Tests', () => {
  beforeEach(() => {
    localStorage.setItem('toktickit_token', 'mock_staff_token');
    vi.restoreAllMocks();

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/tickets/10/actions')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ actions: mockActions }),
        });
      }
      if (url.includes('/api/staff/assignees')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockAssignees,
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  it('renders actions table with technical intervention details and follow-up notes', async () => {
    render(<ActionsTakenSection ticketId={10} readOnly={false} />);

    await waitFor(() => {
      expect(screen.getByTestId('actions-taken-section')).toBeInTheDocument();
      expect(screen.getByText('Diagnosed damaged RAM module in DIMM slot 2')).toBeInTheDocument();
      expect(screen.getByText('Module replaced with 16GB DDR4 replacement unit')).toBeInTheDocument();
      expect(screen.getByText('Michael Brown')).toBeInTheDocument();
      expect(screen.getByText('Follow-Up Req.')).toBeInTheDocument();
      expect(screen.getByText('Monitor memory stress test overnight')).toBeInTheDocument();
      expect(screen.getByText('memory_diagnostic_log.txt')).toBeInTheDocument();
    });
  });

  it('renders read-only view for requesters with no record or edit controls', async () => {
    render(<ActionsTakenSection ticketId={10} readOnly={true} />);

    await waitFor(() => {
      expect(screen.getByText('Diagnosed damaged RAM module in DIMM slot 2')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('btn-add-action')).not.toBeInTheDocument();
    expect(screen.queryByTestId('btn-edit-action-1')).not.toBeInTheDocument();
  });

  it('displays empty message when no actions have been recorded yet', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/tickets/10/actions')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ actions: [] }),
        });
      }
      if (url.includes('/api/staff/assignees')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockAssignees,
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(<ActionsTakenSection ticketId={10} readOnly={false} />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-actions-message')).toBeInTheDocument();
      expect(screen.getByText(/No actions taken have been recorded yet/)).toBeInTheDocument();
      expect(screen.getByText(/At least one Action Taken must be recorded before resolving/)).toBeInTheDocument();
    });
  });

  it('opens modal, validates required fields, and submits a new Action Taken', async () => {
    const onActionsUpdated = vi.fn();
    render(<ActionsTakenSection ticketId={10} readOnly={false} onActionsUpdated={onActionsUpdated} />);

    await waitFor(() => {
      expect(screen.getByTestId('btn-add-action')).toBeInTheDocument();
    });

    // Open Modal
    fireEvent.click(screen.getByTestId('btn-add-action'));
    expect(screen.getByTestId('action-modal')).toBeInTheDocument();

    // Fill form
    fireEvent.change(screen.getByTestId('input-action-description'), {
      target: { value: 'Reinstalled operating system with standard image' },
    });
    fireEvent.change(screen.getByTestId('input-action-result'), {
      target: { value: 'OS booting normally without kernel panics' },
    });

    // Toggle follow-up
    fireEvent.click(screen.getByTestId('check-action-followup'));
    expect(screen.getByTestId('input-action-followup-note')).toBeInTheDocument();

    // Fill follow-up note
    fireEvent.change(screen.getByTestId('input-action-followup-note'), {
      target: { value: 'Verify user profile sync tomorrow' },
    });

    // Mock post response
    globalThis.fetch = vi.fn().mockImplementation((_url: string, opts?: any) => {
      if (opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 2,
            description: 'Reinstalled operating system',
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ actions: [...mockActions] }),
      });
    });

    // Submit form
    fireEvent.click(screen.getByTestId('btn-submit-action'));

    await waitFor(() => {
      expect(screen.queryByTestId('action-modal')).not.toBeInTheDocument();
      expect(onActionsUpdated).toHaveBeenCalled();
    });
  });
});
