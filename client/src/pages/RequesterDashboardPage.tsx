import React, { useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';

interface RequesterDashboardMetrics {
  totalOpenTickets: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

interface RecentTicket {
  id: number;
  ticketNumber: string;
  summary: string;
  currentStatus: string;
  requestedPriority: string;
  itPriority: string;
  updatedAt: string;
}

interface RequesterDashboardProps {
  onSelectTicket: (ticketId: number) => void;
  onCreateTicket: () => void;
  onViewMyTickets: (statusFilter?: string) => void;
}

export const RequesterDashboardPage: React.FC<RequesterDashboardProps> = ({
  onSelectTicket,
  onCreateTicket,
  onViewMyTickets,
}) => {
  let user: any = null;
  try {
    const auth = useAuth();
    user = auth.user;
  } catch (_e) {
    // Auth context not present in isolated unit test
  }
  const [metrics, setMetrics] = useState<RequesterDashboardMetrics | null>(null);
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('toktickit_token');
      const res = await fetch(`${API_BASE_URL}/api/dashboards/requester`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const data = await res.json();
      setMetrics(data.metrics);
      setRecentTickets(data.recentTickets || []);
    } catch (err: any) {
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'NEW') return <span className="badge bg-primary">NEW</span>;
    if (s === 'OPEN') return <span className="badge bg-info text-dark">OPEN</span>;
    if (s === 'IN_PROGRESS') return <span className="badge bg-warning text-dark">IN PROGRESS</span>;
    if (s === 'WAITING_FOR_REQUESTER') return <span className="badge bg-warning text-dark">WAITING</span>;
    if (s === 'RESOLVED') return <span className="badge bg-success">RESOLVED</span>;
    if (s === 'CLOSED') return <span className="badge bg-secondary">CLOSED</span>;
    if (s === 'CANCELLED') return <span className="badge bg-dark">CANCELLED</span>;
    return <span className="badge bg-light text-dark border">{status}</span>;
  };

  return (
    <div className="container py-4" data-testid="requester-dashboard">
      {/* Header section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--primary-green, #006B3C)' }} data-testid="welcome-message">
            Welcome, {user?.name || 'User'}!
          </h2>
          <p className="text-muted mb-0">Here's the latest on your requests.</p>
        </div>
        <button
          className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
          onClick={fetchDashboardData}
          data-testid="refresh-dashboard-btn"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          Refresh
        </button>
      </div>

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      {/* Metrics Row */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div
            className="card shadow-sm border-0 h-100 p-3"
            style={{ borderLeft: '4px solid var(--primary-green, #006B3C)', cursor: 'pointer' }}
            onClick={() => onViewMyTickets('OPEN_ALL')}
            data-testid="metric-open-tickets"
          >
            <div className="text-muted small fw-bold">My Open Tickets</div>
            <div className="fs-1 fw-bold my-1" style={{ color: '#1A2E22' }}>
              {loading ? '-' : metrics?.totalOpenTickets ?? 0}
            </div>
            <div className="small text-success text-decoration-none">View all &rarr;</div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div
            className="card shadow-sm border-0 h-100 p-3"
            style={{ borderLeft: '4px solid #D97706', cursor: 'pointer' }}
            onClick={() => onViewMyTickets('IN_PROGRESS')}
            data-testid="metric-in-progress"
          >
            <div className="text-muted small fw-bold">In Progress</div>
            <div className="fs-1 fw-bold my-1" style={{ color: '#1A2E22' }}>
              {loading ? '-' : metrics?.inProgress ?? 0}
            </div>
            <div className="small text-warning text-decoration-none">View all &rarr;</div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div
            className="card shadow-sm border-0 h-100 p-3"
            style={{ borderLeft: '4px solid #15803D', cursor: 'pointer' }}
            onClick={() => onViewMyTickets('RESOLVED')}
            data-testid="metric-resolved"
          >
            <div className="text-muted small fw-bold">Resolved</div>
            <div className="fs-1 fw-bold my-1" style={{ color: '#1A2E22' }}>
              {loading ? '-' : metrics?.resolved ?? 0}
            </div>
            <div className="small text-success text-decoration-none">View all &rarr;</div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div
            className="card shadow-sm border-0 h-100 p-3"
            style={{ borderLeft: '4px solid #64748B', cursor: 'pointer' }}
            onClick={() => onViewMyTickets('CLOSED')}
            data-testid="metric-closed"
          >
            <div className="text-muted small fw-bold">Closed</div>
            <div className="fs-1 fw-bold my-1" style={{ color: '#1A2E22' }}>
              {loading ? '-' : metrics?.closed ?? 0}
            </div>
            <div className="small text-secondary text-decoration-none">View all &rarr;</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="row g-4">
        {/* Recent Tickets List */}
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-bottom">
              <h5 className="mb-0 fw-bold" style={{ color: '#1A2E22' }}>
                My Recent Tickets
              </h5>
              <button
                type="button"
                className="btn btn-link btn-sm text-decoration-none p-0 text-success fw-bold"
                onClick={() => onViewMyTickets()}
              >
                View all
              </button>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-4 text-muted">
                  <div className="spinner-border spinner-border-sm me-2" role="status" />
                  Loading recent tickets...
                </div>
              ) : recentTickets.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <p className="mb-2">You haven't submitted any tickets yet.</p>
                  <button className="btn btn-success btn-sm" onClick={onCreateTicket}>
                    Create Your First Ticket
                  </button>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {recentTickets.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="list-group-item list-group-item-action p-3 d-flex justify-content-between align-items-center"
                      onClick={() => onSelectTicket(t.id)}
                      data-testid={`recent-ticket-${t.id}`}
                    >
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="font-monospace fw-bold text-dark small">
                            {t.ticketNumber}
                          </span>
                          {getStatusBadge(t.currentStatus)}
                        </div>
                        <div className="text-dark fw-medium text-truncate" style={{ maxWidth: '380px' }}>
                          {t.summary}
                        </div>
                      </div>
                      <div className="text-muted small text-end">
                        {new Date(t.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white py-3 border-bottom">
              <h5 className="mb-0 fw-bold" style={{ color: '#1A2E22' }}>
                Quick Actions
              </h5>
            </div>
            <div className="card-body d-flex flex-column gap-3">
              <button
                type="button"
                className="btn btn-success d-flex align-items-center justify-content-center gap-2 py-2"
                onClick={onCreateTicket}
                data-testid="quick-create-ticket-btn"
                style={{ backgroundColor: 'var(--primary-green, #006B3C)', borderColor: 'var(--primary-green, #006B3C)' }}
              >
                <span className="fs-5">+</span> Create Ticket
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2 py-2"
                onClick={() => onViewMyTickets()}
                data-testid="quick-view-tickets-btn"
              >
                <span>📁</span> View My Tickets
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
