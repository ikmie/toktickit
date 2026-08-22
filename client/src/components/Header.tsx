import React from 'react';
import { useRequester } from '../context/RequesterContext';

interface HeaderProps {
  activeTab: 'my-tickets' | 'create-ticket' | 'ticket-detail';
  setActiveTab: (tab: 'my-tickets' | 'create-ticket') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { selectedRequester, openModal } = useRequester();

  return (
    <header className="app-header py-2 mb-4">
      <div className="container d-flex flex-wrap align-items-center justify-content-between">
        {/* App Identity */}
        <div className="d-flex align-items-center gap-3">
          <button
            onClick={() => setActiveTab('my-tickets')}
            className="navbar-brand btn btn-link p-0 text-decoration-none text-white fw-bold fs-4"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              fill="currentColor"
              className="bi bi-clock-history text-white"
              viewBox="0 0 16 16"
            >
              <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022l-.074.997zm2.004.45a7.003 7.003 0 0 0-.985-.299l.219-.976c.383.086.76.2 1.122.343l-.356.932zM3.25 2.5a.5.5 0 0 0 0 1h.5a.5.5 0 0 0 0-1h-.5zm.251 9.176l-.768.641a7 7 0 0 0 .874.874l.642-.769a6 6 0 0 1-.748-.746zm10.748-4.176a.5.5 0 0 0 0 1h.5a.5.5 0 0 0 0-1h-.5z" />
              <path d="M8.5 5.5a.5.5 0 0 0-1 0v3.362l-1.429 2.38a.5.5 0 1 0 .858.515l1.5-2.5A.5.5 0 0 0 8.5 9V5.5z" />
            </svg>
            TokTickIT
          </button>

          {/* Navigation Links */}
          <nav className="d-flex gap-2">
            <button
              onClick={() => setActiveTab('my-tickets')}
              className={`nav-link btn btn-link text-decoration-none ${
                activeTab === 'my-tickets' ? 'active' : ''
              }`}
              data-testid="nav-my-tickets"
            >
              <i className="bi bi-journal-text me-1"></i> My Tickets
            </button>
            <button
              onClick={() => setActiveTab('create-ticket')}
              className={`nav-link btn btn-link text-decoration-none ${
                activeTab === 'create-ticket' ? 'active' : ''
              }`}
              data-testid="nav-create-ticket"
            >
              <i className="bi bi-plus-circle me-1"></i> Create Ticket
            </button>
          </nav>
        </div>

        {/* Selected Requester Identity & Switcher */}
        <div className="d-flex align-items-center gap-2 mt-2 mt-sm-0">
          <button
            onClick={openModal}
            className="requester-badge-btn"
            title="Click to switch Development Requester identity"
            data-testid="change-requester-btn"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-person-circle"
              viewBox="0 0 16 16"
            >
              <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
              <path
                fillRule="evenodd"
                d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"
              />
            </svg>
            <span className="fw-semibold" data-testid="selected-requester-name">
              {selectedRequester ? selectedRequester.name : 'Select Requester'}
            </span>
            <span className="badge bg-light text-dark ms-1 opacity-75">Switch</span>
          </button>
        </div>
      </div>
    </header>
  );
};
