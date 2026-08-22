import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateTicketPage } from '../../pages/CreateTicketPage';
import { RequesterProvider } from '../../context/RequesterContext';

describe('Lab 02 - CreateTicket UI Component Tests', () => {
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
        if (url.includes('/api/related-systems')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([{ id: 1, name: 'Corporate Laptop', code: 'LAPTOP' }]),
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

  it('should render form fields with required red asterisks and system generated preview', async () => {
    render(
      <RequesterProvider>
        <CreateTicketPage onSuccess={vi.fn()} onCancel={vi.fn()} />
      </RequesterProvider>
    );

    expect(await screen.findByText('Create Support Ticket')).toBeInTheDocument();
    expect(await screen.findByTestId('summary-input')).toBeInTheDocument();
    expect(await screen.findByTestId('description-input')).toBeInTheDocument();
    expect(await screen.findByTestId('submit-ticket-btn')).toBeInTheDocument();
  });

  it('should show inline field validation errors when submitting empty required fields', async () => {
    render(
      <RequesterProvider>
        <CreateTicketPage onSuccess={vi.fn()} onCancel={vi.fn()} />
      </RequesterProvider>
    );

    const submitBtn = await screen.findByTestId('submit-ticket-btn');
    fireEvent.click(submitBtn);

    expect(await screen.findByTestId('summary-error')).toHaveTextContent('Summary is required.');
    expect(await screen.findByTestId('description-error')).toHaveTextContent('Description is required.');
  });
});
