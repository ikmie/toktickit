import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TicketDetailPage } from '../../pages/TicketDetailPage';
import { RequesterProvider } from '../../context/RequesterContext';

describe('Lab 02 - RequesterTicketDetail UI Component Tests', () => {
  it('should render loading indicator initially', () => {
    render(
      <RequesterProvider>
        <TicketDetailPage ticketId={1} onBack={vi.fn()} />
      </RequesterProvider>
    );

    expect(screen.getByText('Loading ticket detail...')).toBeInTheDocument();
  });
});
