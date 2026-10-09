import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RequesterProvider } from './context/RequesterContext';
import { Header, type AppNavTab } from './components/Header';
import { RequesterSelectorModal } from './components/RequesterSelectorModal';
import { LoginPage } from './pages/LoginPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { MyTicketsPage } from './pages/MyTicketsPage';
import { CreateTicketPage } from './pages/CreateTicketPage';
import { TicketDetailPage } from './pages/TicketDetailPage';
import { StaffTicketQueuePage } from './pages/StaffTicketQueuePage';
import { StaffTicketDetailPage } from './pages/StaffTicketDetailPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { RequesterDashboardPage } from './pages/RequesterDashboardPage';
import { StaffDashboardPage } from './pages/StaffDashboardPage';

function getRequestedTabFromUrl(): AppNavTab | null {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab')?.toLowerCase();

  if (
    path.includes('/dashboard') ||
    hash.includes('dashboard') ||
    tab === 'dashboard'
  ) {
    return 'dashboard';
  }

  if (
    path.includes('/admin') ||
    path.includes('/user-management') ||
    hash.includes('admin') ||
    hash.includes('user-management') ||
    tab === 'admin' ||
    tab === 'user-management'
  ) {
    return 'user-management';
  }

  if (
    path.includes('/staff') ||
    path.includes('/queue') ||
    hash.includes('staff') ||
    hash.includes('queue') ||
    tab === 'staff' ||
    tab === 'staff-queue'
  ) {
    return 'staff-queue';
  }

  if (
    path.includes('/create-ticket') ||
    path.includes('/new-ticket') ||
    hash.includes('create-ticket') ||
    tab === 'create-ticket'
  ) {
    return 'create-ticket';
  }

  if (
    path.includes('/my-tickets') ||
    path.includes('/tickets') ||
    hash.includes('my-tickets') ||
    tab === 'my-tickets'
  ) {
    return 'my-tickets';
  }

  return null;
}

function AppContent() {
  const { user, isAuthenticated, mustChangePassword } = useAuth();
  const [activeTab, setActiveTab] = useState<AppNavTab>(() => {
    const requested = getRequestedTabFromUrl();
    if (requested) return requested;
    return 'dashboard';
  });
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [queueFilter, setQueueFilter] = useState<{ status?: string; ownership?: string; priority?: string } | undefined>(undefined);
  const [myTicketsFilter, setMyTicketsFilter] = useState<string | undefined>(undefined);

  // Synchronize default tab on role changes ONLY IF user did not explicitly request another tab in the URL
  useEffect(() => {
    const requested = getRequestedTabFromUrl();
    if (requested) {
      setActiveTab(requested);
      return;
    }
    setActiveTab('dashboard');
  }, [user?.role]);

  // Support direct URL pathname/hash navigation (e.g. /admin/users, #admin, #staff, #my-tickets, #dashboard)
  useEffect(() => {
    const handleUrlChange = () => {
      const requested = getRequestedTabFromUrl();
      if (requested) {
        setActiveTab(requested);
      }
    };
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  // If user is not authenticated, render LoginPage
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // BR-02: User with mustChangePassword = true cannot enter normal app
  if (mustChangePassword) {
    return <ChangePasswordPage />;
  }

  const handleSelectTicket = (id: number) => {
    setSelectedTicketId(id);
    setActiveTab('ticket-detail');
  };

  const handleSelectStaffTicket = (id: number) => {
    setSelectedTicketId(id);
    setActiveTab('staff-ticket-detail');
  };

  const handleTicketCreated = (id: number) => {
    setSelectedTicketId(id);
    setActiveTab('ticket-detail');
  };

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: 'var(--page-bg, #F5F7F6)' }}>
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (typeof window !== 'undefined') {
            if (tab === 'user-management') {
              window.history.pushState({}, '', '/admin/users');
            } else if (tab === 'staff-queue') {
              window.history.pushState({}, '', '/staff/tickets');
            } else if (tab === 'create-ticket') {
              window.history.pushState({}, '', '/create-ticket');
            } else if (tab === 'dashboard') {
              window.history.pushState({}, '', '/dashboard');
            } else {
              window.history.pushState({}, '', '/');
            }
          }
          if (tab === 'my-tickets' || tab === 'staff-queue' || tab === 'user-management' || tab === 'dashboard') {
            setSelectedTicketId(null);
          }
        }}
      />

      {/* Legacy Requester Selector Modal retained for fallback */}
      <RequesterSelectorModal />

      {/* Main View Area */}
      <main className="flex-grow-1">
        {activeTab === 'dashboard' && (
          user?.role === 'IT_STAFF' || user?.role === 'ADMIN' ? (
            <StaffDashboardPage
              onSelectTicket={handleSelectStaffTicket}
              onNavigateToQueue={(filters) => {
                setQueueFilter(filters);
                setActiveTab('staff-queue');
              }}
              onCreateTicket={() => setActiveTab('create-ticket')}
              onNavigateToUserManagement={() => setActiveTab('user-management')}
            />
          ) : (
            <RequesterDashboardPage
              onSelectTicket={handleSelectTicket}
              onCreateTicket={() => setActiveTab('create-ticket')}
              onViewMyTickets={(filter) => {
                setMyTicketsFilter(filter === 'OPEN_ALL' ? undefined : filter);
                setActiveTab('my-tickets');
              }}
            />
          )
        )}

        {activeTab === 'my-tickets' && (
          <MyTicketsPage
            onSelectTicket={handleSelectTicket}
            onCreateTicket={() => setActiveTab('create-ticket')}
            initialStatus={myTicketsFilter}
          />
        )}

        {activeTab === 'create-ticket' && (
          <CreateTicketPage
            onSuccess={handleTicketCreated}
            onCancel={() => setActiveTab('my-tickets')}
          />
        )}

        {activeTab === 'ticket-detail' && selectedTicketId !== null && (
          <TicketDetailPage
            ticketId={selectedTicketId}
            onBack={() => {
              setActiveTab('my-tickets');
              setSelectedTicketId(null);
            }}
          />
        )}

        {activeTab === 'staff-queue' && (
          <StaffTicketQueuePage
            onSelectTicket={handleSelectStaffTicket}
            initialStatus={queueFilter?.status}
            initialOwnership={queueFilter?.ownership}
            initialPriority={queueFilter?.priority}
          />
        )}

        {activeTab === 'staff-ticket-detail' && selectedTicketId !== null && (
          <StaffTicketDetailPage
            ticketId={selectedTicketId}
            onBack={() => {
              setActiveTab('staff-queue');
              setSelectedTicketId(null);
            }}
          />
        )}

        {activeTab === 'user-management' && (
          <UserManagementPage
            onBack={() => {
              if (typeof window !== 'undefined') {
                window.history.pushState({}, '', '/');
                window.location.hash = '';
              }
              setActiveTab(user?.role === 'ADMIN' ? 'user-management' : 'dashboard');
            }}
          />
        )}
      </main>

      {/* Simple Zen Green Footer */}
      <footer className="py-3 text-center text-muted small border-top mt-auto bg-white">
        TokTickIT &bull; CPE 334 Introduction to Software Engineering &bull; Lab 4 Service-Desk Increment
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RequesterProvider>
        <AppContent />
      </RequesterProvider>
    </AuthProvider>
  );
}
