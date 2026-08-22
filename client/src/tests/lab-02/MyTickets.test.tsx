import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MyTicketsPage } from '../../pages/MyTicketsPage';
import { RequesterProvider } from '../../context/RequesterContext';

describe('Lab 02 - MyTickets UI Component Tests', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/api/categories')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([{ id: 1, name: 'Hardware' }]),
          });
        }
        if (url.includes('/api/tickets')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: [],
                pagination: { total: 0, page: 1, limit: 5, totalPages: 1 },
              }),
          });
        }
        if (url.includes('/api/requesters')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve([
                { id: 1, name: 'Jennifer Anderson', email: 'j@test.com', department: 'CPE', isActive: true },
              ]),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      })
    );
  });

  it('should render search bar, category, priority, status filters, and create ticket action', async () => {
    render(
      <RequesterProvider>
        <MyTicketsPage onSelectTicket={vi.fn()} onCreateTicket={vi.fn()} />
      </RequesterProvider>
    );

    expect(await screen.findByTestId('search-input')).toBeInTheDocument();
    expect(await screen.findByTestId('category-filter')).toBeInTheDocument();
    expect(await screen.findByTestId('priority-filter')).toBeInTheDocument();
    expect(await screen.findByTestId('status-filter')).toBeInTheDocument();
    expect(await screen.findByTestId('create-ticket-btn')).toBeInTheDocument();
  });
});
