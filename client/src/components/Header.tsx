import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useRequester } from '../context/RequesterContext';

export type AppNavTab =
  | 'my-tickets'
  | 'create-ticket'
  | 'ticket-detail'
  | 'staff-queue'
  | 'staff-ticket-detail'
  | 'user-management';

interface HeaderProps {
  activeTab: AppNavTab;
  setActiveTab: (tab: AppNavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  let authUser = null;
  let logoutFn = () => {};

  try {
    const auth = useAuth();
    authUser = auth.user;
    logoutFn = auth.logout;
  } catch (_e) {
    // Auth context not present in legacy tests
  }

  let selectedRequester = null;
  let openRequesterModal = () => {};
  try {
    const reqCtx = useRequester();
    selectedRequester = reqCtx.selectedRequester;
    openRequesterModal = reqCtx.openModal;
  } catch (_e) {
    // RequesterContext not present
  }

  const role = authUser?.role;
  const isRequester = role === 'REQUESTER' || (!role && selectedRequester);
  const isStaff = role === 'IT_STAFF';
  const isAdmin = role === 'ADMIN';

  const getRoleLabel = () => {
    switch (role) {
      case 'ADMIN':
        return 'Administrator';
      case 'IT_STAFF':
        return 'IT Staff';
      default:
        return 'Requester';
    }
  };

  return (
    <header className="app-header py-2 mb-4" style={{ backgroundColor: 'var(--primary-green, #006B3C)' }}>
      <div className="container d-flex flex-wrap align-items-center justify-content-between">
        {/* App Logo & Brand */}
        <div className="d-flex align-items-center gap-3">
          <button
            onClick={() => {
              if (isAdmin) setActiveTab('user-management');
              else if (isStaff) setActiveTab('staff-queue');
              else setActiveTab('my-tickets');
            }}
            className="navbar-brand btn btn-link p-0 text-decoration-none text-white fw-bold fs-4 d-flex align-items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="26"
              height="26"
              fill="currentColor"
              className="bi bi-clock-history text-white"
              viewBox="0 0 16 16"
            >
              <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022l-.074.997zm2.004.45a7.003 7.003 0 0 0-.985-.299l.219-.976c.383.086.76.2 1.122.343l-.356.932zM3.25 2.5a.5.5 0 0 0 0 1h.5a.5.5 0 0 0 0-1h-.5zm.251 9.176l-.768.641a7 7 0 0 0 .874.874l.642-.769a6 6 0 0 1-.748-.746zm10.748-4.176a.5.5 0 0 0 0 1h.5a.5.5 0 0 0 0-1h-.5z" />
              <path d="M8.5 5.5a.5.5 0 0 0-1 0v3.362l-1.429 2.38a.5.5 0 1 0 .858.515l1.5-2.5A.5.5 0 0 0 8.5 9V5.5z" />
            </svg>
            <span>TokTickIT</span>
          </button>

          {/* Role-Specific Navigation */}
          <nav className="d-flex gap-2">
            {isRequester && (
              <>
                <button
                  onClick={() => setActiveTab('my-tickets')}
                  className={`nav-link btn btn-link text-decoration-none text-white px-2 py-1 ${
                    activeTab === 'my-tickets' || activeTab === 'ticket-detail' ? 'fw-bold border-bottom border-white' : 'opacity-75'
                  }`}
                  data-testid="nav-my-tickets"
                >
                  My Tickets
                </button>
                <button
                  onClick={() => setActiveTab('create-ticket')}
                  className={`nav-link btn btn-link text-decoration-none text-white px-2 py-1 ${
                    activeTab === 'create-ticket' ? 'fw-bold border-bottom border-white' : 'opacity-75'
                  }`}
                  data-testid="nav-create-ticket"
                >
                  Create Ticket
                </button>
              </>
            )}

            {(isStaff || isAdmin) && (
              <button
                onClick={() => setActiveTab('staff-queue')}
                className={`nav-link btn btn-link text-decoration-none text-white px-2 py-1 ${
                  activeTab === 'staff-queue' || activeTab === 'staff-ticket-detail' ? 'fw-bold border-bottom border-white' : 'opacity-75'
                }`}
                data-testid="nav-staff-queue"
              >
                Ticket Queue
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setActiveTab('user-management')}
                className={`nav-link btn btn-link text-decoration-none text-white px-2 py-1 ${
                  activeTab === 'user-management' ? 'fw-bold border-bottom border-white' : 'opacity-75'
                }`}
                data-testid="nav-user-management"
              >
                User Management
              </button>
            )}
          </nav>
        </div>

        {/* User Identity & Logout / Fallback Switcher */}
        <div className="d-flex align-items-center gap-3 mt-2 mt-sm-0">
          {authUser ? (
            <div className="d-flex align-items-center gap-2">
              <div className="text-white text-end d-none d-sm-block">
                <div className="fw-semibold small lh-1" data-testid="authenticated-user-name">
                  {authUser.name}
                </div>
                <span
                  className="badge rounded-pill mt-1"
                  style={{
                    backgroundColor: role === 'ADMIN' ? '#DDD6FE' : role === 'IT_STAFF' ? '#BFDBFE' : '#A7F3D0',
                    color: role === 'ADMIN' ? '#5B21B6' : role === 'IT_STAFF' ? '#1E40AF' : '#065F46',
                    fontSize: '0.7rem',
                  }}
                  data-testid="authenticated-user-role"
                >
                  {getRoleLabel()}
                </span>
              </div>
              <button
                onClick={logoutFn}
                className="btn btn-sm btn-outline-light d-flex align-items-center gap-1"
                data-testid="logout-btn"
                title="Sign out of TokTickIT"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            /* Fallback for Lab 2 test compatibility */
            <button
              onClick={openRequesterModal}
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
          )}
        </div>
      </div>
    </header>
  );
};
