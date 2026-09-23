import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';

interface Category {
  id: number;
  name: string;
}

interface TicketQueueItem {
  id: number;
  ticketNumber: string;
  summary: string;
  ticketDate: string;
  itPriority: string;
  requestedPriority: string;
  currentStatus: string;
  problemResolvedIndicated?: boolean;
  category: { id: number; name: string };
  relatedSystem: { id: number; name: string; code: string };
  requester: { id: number; name: string; email: string; department: string };
  owner: { id: number; name: string; email: string; role: string } | null;
  _count: {
    comments: number;
    notes: number;
    attachments: number;
  };
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface StaffTicketQueuePageProps {
  onSelectTicket: (id: number) => void;
  initialStatus?: string;
  initialOwnership?: string;
  initialPriority?: string;
}

export const StaffTicketQueuePage: React.FC<StaffTicketQueuePageProps> = ({
  onSelectTicket,
  initialStatus,
  initialOwnership,
  initialPriority,
}) => {
  const [tickets, setTickets] = useState<TicketQueueItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [search, setSearch] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [itPriority, setItPriority] = useState<string>(initialPriority || '');
  const [currentStatus, setCurrentStatus] = useState<string>(initialStatus || '');
  const [ownership, setOwnership] = useState<string>(initialOwnership || 'all');

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<string>('ticketDate');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {};
    const token = localStorage.getItem('toktickit_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // Fetch categories on mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch((err) => console.error('Error fetching categories:', err));
  }, []);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (categoryId) params.append('categoryId', categoryId);
      if (itPriority) params.append('itPriority', itPriority);
      if (currentStatus) params.append('currentStatus', currentStatus);
      if (ownership !== 'all') params.append('ownership', ownership);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('page', currentPage.toString());
      params.append('limit', '10');

      const res = await fetch(`${API_BASE_URL}/api/staff/tickets?${params.toString()}`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error(`Failed to load queue (status ${res.status})`);
      }

      const json = await res.json();
      setTickets(json.data || []);
      setPagination(
        json.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
        }
      );
    } catch (err: any) {
      setError(err.message || 'Error loading tickets');
    } finally {
      setLoading(false);
    }
  }, [search, categoryId, itPriority, currentStatus, ownership, sortBy, sortOrder, currentPage]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleClaim = async (ticketId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE_URL}/api/staff/tickets/${ticketId}/claim`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        fetchTickets();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to claim ticket.');
      }
    } catch (err) {
      alert('Network error claiming ticket.');
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'NEW':
        return { backgroundColor: '#E0F2FE', color: '#0369A1', border: '1px solid #BAE6FD' };
      case 'OPEN':
        return { backgroundColor: '#E0E7FF', color: '#3730A3', border: '1px solid #C7D2FE' };
      case 'IN_PROGRESS':
        return { backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' };
      case 'WAITING_FOR_REQUESTER':
        return { backgroundColor: '#FFEDD5', color: '#9A3412', border: '1px solid #FED7AA' };
      case 'RESOLVED':
        return { backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0' };
      case 'CLOSED':
        return { backgroundColor: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' };
      case 'REOPENED':
        return { backgroundColor: '#FCE7F3', color: '#9D174D', border: '1px solid #FBCFE8' };
      case 'CANCELLED':
        return { backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' };
      default:
        return { backgroundColor: '#F3F4F6', color: '#4B5563', border: '1px solid #E5E7EB' };
    }
  };

  const getPriorityBadgeStyle = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return { backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' };
      case 'HIGH':
        return { backgroundColor: '#FFEDD5', color: '#9A3412', border: '1px solid #FED7AA' };
      case 'MEDIUM':
        return { backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' };
      case 'LOW':
        return { backgroundColor: '#E0F2FE', color: '#0369A1', border: '1px solid #BAE6FD' };
      default:
        return { backgroundColor: '#F3F4F6', color: '#4B5563', border: '1px solid #E5E7EB' };
    }
  };

  return (
    <div className="container py-4">
      {/* Page Title & Stats */}
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <span style={{ color: '#006B3C' }}>IT Staff</span> Ticket Queue
          </h1>
          <p className="text-muted small mb-0">
            Triage, prioritize, and manage all campus IT support tickets.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge px-3 py-2 fs-6 rounded-pill" style={{ backgroundColor: '#E8F5E9', color: '#006B3C', border: '1px solid #A7F3D0' }}>
            Total Tickets: {pagination.total}
          </span>
          <button
            onClick={() => fetchTickets()}
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
            title="Refresh Queue"
          >
            &#x21bb; Refresh
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '12px' }}>
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            {/* Search */}
            <div className="col-12 col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">&#128269;</span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search Ticket # or Summary..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  data-testid="queue-search-input"
                />
                {search && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setCurrentPage(1);
                    }}
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>

            {/* Ownership Filter */}
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={ownership}
                onChange={(e) => {
                  setOwnership(e.target.value);
                  setCurrentPage(1);
                }}
                data-testid="queue-ownership-filter"
              >
                <option value="all">All Ownership</option>
                <option value="unassigned">Unassigned Only</option>
                <option value="assignedToMe">Assigned to Me</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={currentStatus}
                onChange={(e) => {
                  setCurrentStatus(e.target.value);
                  setCurrentPage(1);
                }}
                data-testid="queue-status-filter"
              >
                <option value="">All Statuses</option>
                <option value="NEW">NEW</option>
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="WAITING_FOR_REQUESTER">WAITING FOR REQUESTER</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
                <option value="REOPENED">REOPENED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={itPriority}
                onChange={(e) => {
                  setItPriority(e.target.value);
                  setCurrentPage(1);
                }}
                data-testid="queue-priority-filter"
              >
                <option value="">All Priorities</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setCurrentPage(1);
                }}
                data-testid="queue-category-filter"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        {error && (
          <div className="alert alert-danger m-3" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading queue...</span>
            </div>
            <p className="text-muted mt-2">Loading ticket queue...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-5">
            <h5 className="text-muted fw-normal">No tickets match the selected filters</h5>
            <p className="text-muted small">Try adjusting your search criteria or resetting filters.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" data-testid="staff-queue-table">
              <thead style={{ backgroundColor: '#F8FAF9', borderBottom: '2px solid #E2E8F0' }}>
                <tr>
                  <th
                    scope="col"
                    className="ps-3 py-3 text-secondary small fw-bold text-uppercase"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSort('ticketNumber')}
                    title="Sort by Ticket Number"
                  >
                    Ticket # {sortBy === 'ticketNumber' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th scope="col" className="py-3 text-secondary small fw-bold text-uppercase">
                    Summary & System
                  </th>
                  <th scope="col" className="py-3 text-secondary small fw-bold text-uppercase">
                    Requester
                  </th>
                  <th
                    scope="col"
                    className="py-3 text-secondary small fw-bold text-uppercase"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSort('itPriority')}
                    title="Sort by Priority"
                  >
                    IT Priority {sortBy === 'itPriority' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th
                    scope="col"
                    className="py-3 text-secondary small fw-bold text-uppercase"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSort('currentStatus')}
                    title="Sort by Status"
                  >
                    Status {sortBy === 'currentStatus' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th scope="col" className="py-3 text-secondary small fw-bold text-uppercase">
                    Assignee
                  </th>
                  <th scope="col" className="pe-3 py-3 text-end text-secondary small fw-bold text-uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTicket(t.id)}
                    style={{ cursor: 'pointer' }}
                    data-testid={`queue-row-${t.id}`}
                  >
                    <td className="ps-3 fw-bold text-dark text-nowrap">
                      <span className="text-decoration-none text-primary" style={{ color: '#006B3C' }}>
                        {t.ticketNumber}
                      </span>
                      <div className="text-muted small fw-normal">
                        {new Date(t.ticketDate).toLocaleDateString()}
                      </div>
                    </td>

                    <td style={{ maxWidth: '300px' }}>
                      <div className="fw-semibold text-truncate">{t.summary}</div>
                      <div className="d-flex align-items-center gap-2 mt-1">
                        <span className="badge bg-light text-dark border small">{t.category?.name}</span>
                        {t.relatedSystem && (
                          <span className="badge bg-light text-secondary border small">
                            {t.relatedSystem.code}
                          </span>
                        )}
                        {t.problemResolvedIndicated && (
                          <span
                            className="badge rounded-pill"
                            style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '0.72rem' }}
                            title="Requester indicated problem appears resolved"
                          >
                            &#x2714; Problem Resolved Indicated
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="fw-medium text-dark">{t.requester?.name}</div>
                      <div className="text-muted small">{t.requester?.department}</div>
                    </td>

                    <td>
                      <span
                        className="badge px-2 py-1 rounded-pill"
                        style={getPriorityBadgeStyle(t.itPriority)}
                        data-testid={`priority-badge-${t.id}`}
                      >
                        {t.itPriority}
                      </span>
                    </td>

                    <td>
                      <span
                        className="badge px-2 py-1 rounded-pill"
                        style={getStatusBadgeStyle(t.currentStatus)}
                        data-testid={`status-badge-${t.id}`}
                      >
                        {t.currentStatus.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td>
                      {t.owner ? (
                        <div className="d-flex align-items-center gap-1">
                          <span className="badge bg-secondary-subtle text-secondary rounded-pill">
                            &#128100; {t.owner.name}
                          </span>
                        </div>
                      ) : (
                        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill">
                          Unassigned
                        </span>
                      )}
                    </td>

                    <td className="pe-3 text-end text-nowrap">
                      {!t.owner && (
                        <button
                          className="btn btn-sm btn-outline-success me-2"
                          onClick={(e) => handleClaim(t.id, e)}
                          title="Claim this ticket"
                          data-testid={`claim-btn-${t.id}`}
                        >
                          Claim
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-light border"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTicket(t.id);
                        }}
                        data-testid={`view-btn-${t.id}`}
                      >
                        View &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="card-footer bg-white border-top d-flex align-items-center justify-content-between p-3">
          <span className="text-muted small">
            Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${pagination.page <= 1 ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                >
                  &laquo; Prev
                </button>
              </li>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, pagination.page - 3), Math.min(pagination.totalPages, pagination.page + 2))
                .map((p) => (
                  <li key={p} className={`page-item ${p === pagination.page ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(p)}>
                      {p}
                    </button>
                  </li>
                ))}
              <li className={`page-item ${pagination.page >= pagination.totalPages ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next &raquo;
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
};
