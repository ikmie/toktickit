import React, { useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';

interface StaffDashboardMetrics {
  new: number;
  open: number;
  inProgress: number;
  waitingForRequester: number;
  myAssigned: number;
  unassigned: number;
  urgentHigh: number;
  recentActionsCount: number;
}

interface RecentTicketItem {
  id: number;
  ticketNumber: string;
  summary: string;
  status: string;
  itPriority: string;
  requesterName: string;
  ownerName: string;
  actionsCount: number;
  updatedAt: string;
}

interface AdminUserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  byRole: {
    REQUESTER: number;
    IT_STAFF: number;
    ADMIN: number;
  };
}

interface StaffDashboardPageProps {
  onSelectTicket: (ticketId: number) => void;
  onNavigateToQueue: (filters?: { status?: string; ownership?: string; priority?: string }) => void;
  onCreateTicket?: () => void;
  onNavigateToUserManagement?: () => void;
}

export const StaffDashboardPage: React.FC<StaffDashboardPageProps> = ({
  onSelectTicket,
  onNavigateToQueue,
  onCreateTicket,
  onNavigateToUserManagement,
}) => {
  let user: any = null;
  try {
    const auth = useAuth();
    user = auth.user;
  } catch (_e) {
    // Auth context not present in isolated unit test
  }
  const [metrics, setMetrics] = useState<StaffDashboardMetrics | null>(null);
  const [recentTickets, setRecentTickets] = useState<RecentTicketItem[]>([]);
  const [adminStats, setAdminStats] = useState<AdminUserStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {};
    const token = localStorage.getItem('toktickit_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = user?.role === 'ADMIN' ? `${API_BASE_URL}/api/dashboards/admin` : `${API_BASE_URL}/api/dashboards/staff`;
      const res = await fetch(endpoint, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error('Failed to load dashboard metrics');
      }

      const data = await res.json();
      if (user?.role === 'ADMIN') {
        setMetrics(data.operational);
        setAdminStats(data.userStats);
        setRecentTickets(data.recentTickets || []);
      } else {
        setMetrics(data.metrics);
        setRecentTickets(data.recentTickets || []);
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

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
    <div className="container py-4" data-testid="staff-dashboard">
      {/* Welcome & Refresh Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--primary-green, #006B3C)' }} data-testid="staff-welcome-message">
            Welcome back, {user?.name || 'Staff Member'}!
          </h2>
          <p className="text-muted mb-0">Here's what's happening with your queue today.</p>
        </div>
        <button
          className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
          onClick={fetchDashboardData}
          data-testid="refresh-staff-dashboard-btn"
          style={{ borderColor: 'var(--primary-green, #006B3C)', color: 'var(--primary-green, #006B3C)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          Refresh
        </button>
      </div>

      {error && <div className="alert alert-danger mb-4" data-testid="dashboard-error-alert">{error}</div>}

      {/* Five Primary Metrics Cards (Matches PDF Page 5 Layout) */}
      <div className="row g-3 mb-4">
        {/* New */}
        <div className="col-6 col-md-4 col-lg">
          <div
            className="card shadow-sm border-0 h-100 p-3 text-center"
            style={{ borderTop: '4px solid #3B82F6', cursor: 'pointer' }}
            onClick={() => onNavigateToQueue({ status: 'NEW' })}
            data-testid="metric-new-tickets"
          >
            <div className="text-muted small fw-bold mb-1">New</div>
            <div className="fs-2 fw-bold" style={{ color: '#1A2E22' }}>
              {loading ? '-' : metrics?.new ?? 0}
            </div>
            <div className="small text-primary mt-1">&rarr; Filter New</div>
          </div>
        </div>

        {/* Open */}
        <div className="col-6 col-md-4 col-lg">
          <div
            className="card shadow-sm border-0 h-100 p-3 text-center"
            style={{ borderTop: '4px solid #06B6D4', cursor: 'pointer' }}
            onClick={() => onNavigateToQueue({ status: 'OPEN' })}
            data-testid="metric-open-tickets"
          >
            <div className="text-muted small fw-bold mb-1">Open</div>
            <div className="fs-2 fw-bold" style={{ color: '#1A2E22' }}>
              {loading ? '-' : metrics?.open ?? 0}
            </div>
            <div className="small text-info mt-1">&rarr; Filter Open</div>
          </div>
        </div>

        {/* In Progress */}
        <div className="col-6 col-md-4 col-lg">
          <div
            className="card shadow-sm border-0 h-100 p-3 text-center"
            style={{ borderTop: '4px solid #F59E0B', cursor: 'pointer' }}
            onClick={() => onNavigateToQueue({ status: 'IN_PROGRESS' })}
            data-testid="metric-in-progress-tickets"
          >
            <div className="text-muted small fw-bold mb-1">In Progress</div>
            <div className="fs-2 fw-bold" style={{ color: '#1A2E22' }}>
              {loading ? '-' : metrics?.inProgress ?? 0}
            </div>
            <div className="small text-warning mt-1">&rarr; Filter In Progress</div>
          </div>
        </div>

        {/* Waiting for Requester */}
        <div className="col-6 col-md-4 col-lg">
          <div
            className="card shadow-sm border-0 h-100 p-3 text-center"
            style={{ borderTop: '4px solid #EC4899', cursor: 'pointer' }}
            onClick={() => onNavigateToQueue({ status: 'WAITING_FOR_REQUESTER' })}
            data-testid="metric-waiting-tickets"
          >
            <div className="text-muted small fw-bold mb-1">Waiting for Requester</div>
            <div className="fs-2 fw-bold" style={{ color: '#1A2E22' }}>
              {loading ? '-' : metrics?.waitingForRequester ?? 0}
            </div>
            <div className="small text-danger mt-1">&rarr; Filter Waiting</div>
          </div>
        </div>

        {/* My Assigned */}
        <div className="col-12 col-md-4 col-lg">
          <div
            className="card shadow-sm border-0 h-100 p-3 text-center"
            style={{ borderTop: '4px solid var(--primary-green, #006B3C)', cursor: 'pointer' }}
            onClick={() => onNavigateToQueue({ ownership: 'my' })}
            data-testid="metric-my-assigned"
          >
            <div className="text-muted small fw-bold mb-1">My Assigned</div>
            <div className="fs-2 fw-bold" style={{ color: 'var(--primary-green, #006B3C)' }}>
              {loading ? '-' : metrics?.myAssigned ?? 0}
            </div>
            <div className="small text-success mt-1">&rarr; View My Queue</div>
          </div>
        </div>
      </div>

      {/* Operational Highlights (Unassigned, Urgent, Actions Taken) */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div
            className="card shadow-sm border-0 p-3 d-flex flex-row align-items-center justify-content-between"
            style={{ cursor: 'pointer', borderLeft: '4px solid #EF4444' }}
            onClick={() => onNavigateToQueue({ ownership: 'unassigned' })}
            data-testid="metric-unassigned-tickets"
          >
            <div>
              <div className="text-muted small fw-bold">Unassigned Tickets</div>
              <div className="fs-3 fw-bold text-dark">{loading ? '-' : metrics?.unassigned ?? 0}</div>
            </div>
            <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
              Needs Owner
            </span>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div
            className="card shadow-sm border-0 p-3 d-flex flex-row align-items-center justify-content-between"
            style={{ cursor: 'pointer', borderLeft: '4px solid #DC2626' }}
            onClick={() => onNavigateToQueue({ priority: 'HIGH' })}
            data-testid="metric-urgent-tickets"
          >
            <div>
              <div className="text-muted small fw-bold">High & Urgent Priority</div>
              <div className="fs-3 fw-bold text-danger">{loading ? '-' : metrics?.urgentHigh ?? 0}</div>
            </div>
            <span className="badge bg-danger text-white px-2 py-1">Urgent Queue</span>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div
            className="card shadow-sm border-0 p-3 d-flex flex-row align-items-center justify-content-between"
            style={{ borderLeft: '4px solid var(--primary-green, #006B3C)' }}
            data-testid="metric-recent-actions"
          >
            <div>
              <div className="text-muted small fw-bold">Total Actions Taken</div>
              <div className="fs-3 fw-bold text-success">{loading ? '-' : metrics?.recentActionsCount ?? 0}</div>
            </div>
            <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
              Active Interventions
            </span>
          </div>
        </div>
      </div>

      {/* Main Operational Split: Recent Queue Tickets & Quick Actions */}
      <div className="row g-4">
        {/* Recent Tickets Table/List */}
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-bottom">
              <h5 className="mb-0 fw-bold" style={{ color: '#1A2E22' }}>
                Recent Operational Activity
              </h5>
              <button
                type="button"
                className="btn btn-link btn-sm text-decoration-none p-0 text-success fw-bold"
                onClick={() => onNavigateToQueue()}
                data-testid="btn-view-all-queue"
              >
                View all queue &rarr;
              </button>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-4 text-muted">
                  <div className="spinner-border spinner-border-sm me-2" role="status" />
                  Loading activity...
                </div>
              ) : recentTickets.length === 0 ? (
                <div className="text-center py-5 text-muted" data-testid="empty-queue-activity">
                  <p className="mb-0">No active tickets found in the queue.</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {recentTickets.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="list-group-item list-group-item-action p-3 d-flex justify-content-between align-items-center"
                      onClick={() => onSelectTicket(t.id)}
                      data-testid={`recent-queue-ticket-${t.id}`}
                    >
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="font-monospace fw-bold text-dark small">{t.ticketNumber}</span>
                          {getStatusBadge(t.status)}
                          {t.itPriority && (
                            <span
                              className={`badge ${
                                t.itPriority === 'URGENT' || t.itPriority === 'HIGH'
                                  ? 'bg-danger'
                                  : 'bg-light text-dark border'
                              }`}
                            >
                              {t.itPriority}
                            </span>
                          )}
                          {t.actionsCount > 0 && (
                            <span className="badge rounded-pill bg-light text-success border border-success-subtle">
                              🛠️ {t.actionsCount} {t.actionsCount === 1 ? 'action' : 'actions'}
                            </span>
                          )}
                        </div>
                        <div className="text-dark fw-medium text-truncate" style={{ maxWidth: '420px' }}>
                          {t.summary}
                        </div>
                        <div className="small text-muted mt-1">
                          Requester: <span className="text-dark">{t.requesterName}</span> &bull; Assignee:{' '}
                          <span className="text-dark">{t.ownerName}</span>
                        </div>
                      </div>
                      <div className="text-muted small text-end">
                        {new Date(t.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions & Admin Statistics */}
        <div className="col-12 col-lg-4 d-flex flex-column gap-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 border-bottom">
              <h5 className="mb-0 fw-bold" style={{ color: '#1A2E22' }}>
                Quick Actions
              </h5>
            </div>
            <div className="card-body d-flex flex-column gap-3">
              {onCreateTicket && (
                <button
                  type="button"
                  className="btn btn-success d-flex align-items-center justify-content-center gap-2 py-2"
                  onClick={onCreateTicket}
                  data-testid="quick-create-ticket-btn"
                  style={{
                    backgroundColor: 'var(--primary-green, #006B3C)',
                    borderColor: 'var(--primary-green, #006B3C)',
                  }}
                >
                  <span className="fs-5">+</span> Create Ticket
                </button>
              )}
              <button
                type="button"
                className="btn btn-outline-success d-flex align-items-center justify-content-center gap-2 py-2"
                onClick={() => onNavigateToQueue({ ownership: 'my' })}
                data-testid="quick-my-queue-btn"
                style={{
                  borderColor: 'var(--primary-green, #006B3C)',
                  color: 'var(--primary-green, #006B3C)',
                }}
              >
                <span>📋</span> My Assigned Queue
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2 py-2"
                onClick={() => onNavigateToQueue()}
                data-testid="quick-full-queue-btn"
              >
                <span>🔍</span> Search All Tickets
              </button>
            </div>
          </div>

          {/* Admin User Accounts Overview (If Admin) */}
          {user?.role === 'ADMIN' && adminStats && (
            <div className="card shadow-sm border-0" data-testid="admin-stats-card">
              <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-bottom">
                <h6 className="mb-0 fw-bold" style={{ color: '#5B21B6' }}>
                  👥 User Accounts Overview
                </h6>
                {onNavigateToUserManagement && (
                  <button
                    type="button"
                    className="btn btn-link btn-sm text-decoration-none p-0 fw-bold"
                    style={{ color: '#5B21B6' }}
                    onClick={onNavigateToUserManagement}
                    data-testid="admin-manage-users-link"
                  >
                    Manage &rarr;
                  </button>
                )}
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small text-muted">Total Accounts:</span>
                  <span className="fw-bold">{adminStats.totalUsers}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small text-muted">Active Users:</span>
                  <span className="badge bg-success">{adminStats.activeUsers}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small text-muted">Requesters:</span>
                  <span className="fw-semibold">{adminStats.byRole.REQUESTER}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small text-muted">IT Staff:</span>
                  <span className="fw-semibold">{adminStats.byRole.IT_STAFF}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="small text-muted">Administrators:</span>
                  <span className="fw-semibold">{adminStats.byRole.ADMIN}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
