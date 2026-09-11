import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RequesterProvider } from './context/RequesterContext';
import { Header, type AppNavTab } from './components/Header';
import { RequesterSelectorModal } from './components/RequesterSelectorModal';
import { LoginPage } from './pages/LoginPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { MyTicketsPage } from './pages/MyTicketsPage';
import { CreateTicketPage } from './pages/CreateTicketPage';
import { TicketDetailPage } from './pages/TicketDetailPage';

function AppContent() {
  const { isAuthenticated, mustChangePassword } = useAuth();
  const [activeTab, setActiveTab] = useState<AppNavTab>('my-tickets');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

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
          if (tab === 'my-tickets' || tab === 'staff-queue') setSelectedTicketId(null);
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
