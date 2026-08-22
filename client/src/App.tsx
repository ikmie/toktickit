import { useState } from 'react';
import { RequesterProvider } from './context/RequesterContext';
import { Header } from './components/Header';
import { RequesterSelectorModal } from './components/RequesterSelectorModal';
import { MyTicketsPage } from './pages/MyTicketsPage';
import { CreateTicketPage } from './pages/CreateTicketPage';
import { TicketDetailPage } from './pages/TicketDetailPage';

type TabState = 'my-tickets' | 'create-ticket' | 'ticket-detail';

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabState>('my-tickets');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  const handleSelectTicket = (id: number) => {
    setSelectedTicketId(id);
    setActiveTab('ticket-detail');
  };

  const handleTicketCreated = (id: number) => {
    setSelectedTicketId(id);
    setActiveTab('ticket-detail');
  };

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: 'var(--page-bg)' }}>
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'my-tickets') setSelectedTicketId(null);
        }}
      />

      {/* Global Development Requester Selector Modal */}
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
        TokTickIT &bull; CPE 334 Introduction to Software Engineering &bull; Lab 2 MVP
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <RequesterProvider>
      <AppContent />
    </RequesterProvider>
  );
}
