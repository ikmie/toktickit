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

function AppContent() {
  const { user, isAuthenticated, mustChangePassword } = useAuth();
  const [activeTab, setActiveTab] = useState<AppNavTab>(() => {
    if (user?.role === 'IT_STAFF') return 'staff-queue';
    if (user?.role === 'ADMIN') return 'user-management';
    return 'my-tickets';
  });
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  // Synchronize default tab on role changes
  useEffect(() => {
    if (user?.role === 'IT_STAFF') {
      setActiveTab('staff-queue');
    } else if (user?.role === 'ADMIN') {
      setActiveTab('user-management');
    } else if (user?.role === 'REQUESTER') {
      setActiveTab('my-tickets');
    }
  }, [user?.role]);

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
          if (tab === 'my-tickets' || tab === 'staff-queue' || tab === 'user-management') {
            setSelectedTicketId(null);
          }
        }}
      />

      {/* Legacy Requester Selector Modal retained for fallback */}
      <RequesterSelectorModal />

      {/* Main View Area */}
      <main className="flex-grow-1">
        {activeTab === 'my-tickets' && (
          <MyTicketsPage
            onSelectTicket={handleSelectTicket}
            onCreateTicket={() => setActiveTab('create-ticket')}
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
          <StaffTicketQueuePage onSelectTicket={handleSelectStaffTicket} />
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

        {activeTab === 'user-management' && <UserManagementPage />}
      </main>

      {/* Simple Zen Green Footer */}
      <footer className="py-3 text-center text-muted small border-top mt-auto bg-white">
        TokTickIT &bull; CPE 334 Introduction to Software Engineering &bull; Lab 3 Enterprise
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
