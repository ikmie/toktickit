import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('TokTickIT App - Lab 02', () => {
  it('renders TokTickIT header identity and navigation', async () => {
    render(<App />);

    expect(screen.getByText('TokTickIT')).toBeInTheDocument();
    expect(screen.getByTestId('nav-my-tickets')).toBeInTheDocument();
    expect(screen.getByTestId('nav-create-ticket')).toBeInTheDocument();
    expect(screen.getByTestId('change-requester-btn')).toBeInTheDocument();
  });
});
